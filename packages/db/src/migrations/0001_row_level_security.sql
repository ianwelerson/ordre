-- ── Helpers ──────────────────────────────────────────────────────────────────
-- Who is the caller? Reads the GUC our rlsContext middleware sets per request.
-- Returns NULL when unset (public routes, background workers) -> policies match nothing.
CREATE FUNCTION app_current_user_id() RETURNS uuid
  LANGUAGE sql STABLE
  SET search_path = public, pg_temp
  AS $$ SELECT NULLIF(current_setting('app.user_id', true), '')::uuid $$;
--> statement-breakpoint

-- Is the caller a member of this workspace?
-- SECURITY DEFINER: bypasses RLS so it can't recurse into the policies calling it.
CREATE FUNCTION app_is_member(ws uuid) RETURNS boolean
  LANGUAGE sql SECURITY DEFINER STABLE
  SET search_path = public, pg_temp
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.workspace_member
      WHERE workspace_id = ws AND user_id = app_current_user_id()
    )
  $$;
--> statement-breakpoint

-- Does this workspace have any members yet? Used only by the create bootstrap.
CREATE FUNCTION app_workspace_has_members(ws uuid) RETURNS boolean
  LANGUAGE sql SECURITY DEFINER STABLE
  SET search_path = public, pg_temp
  AS $$ SELECT EXISTS (SELECT 1 FROM public.workspace_member WHERE workspace_id = ws) $$;
--> statement-breakpoint

-- Is a workspace slug already taken? Deliberately public: the slug-availability
-- endpoint is unauthenticated (signup UX), so it has no `app.user_id` and RLS would
-- otherwise hide every workspace from it. SECURITY DEFINER keeps the disclosure
-- minimal and explicit - a boolean, never a row - instead of poking a hole in the
-- SELECT policy.
CREATE FUNCTION app_slug_exists(slug_input text) RETURNS boolean
  LANGUAGE sql SECURITY DEFINER STABLE
  SET search_path = public, pg_temp
  AS $$ SELECT EXISTS (SELECT 1 FROM public.workspace WHERE slug = slug_input) $$;
--> statement-breakpoint

-- workspace_member_location has no workspace_id, so scope it through its member row.
CREATE FUNCTION app_can_access_member(member uuid) RETURNS boolean
  LANGUAGE sql SECURITY DEFINER STABLE
  SET search_path = public, pg_temp
  AS $$
    SELECT app_is_member((SELECT workspace_id FROM public.workspace_member WHERE id = member))
  $$;
--> statement-breakpoint

-- ── Enable RLS on every tenant table ─────────────────────────────────────────
-- (Auth tables - user/session/account/verification - are intentionally excluded:
--  Better Auth reads them before we know who the caller is.)
ALTER TABLE "workspace" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workspace" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workspace_member" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workspace_member" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workspace_location" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workspace_location" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workspace_invite" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workspace_invite" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workspace_member_location" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workspace_member_location" FORCE ROW LEVEL SECURITY;--> statement-breakpoint

-- ── Policies ─────────────────────────────────────────────────────────────────
-- workspace: see/change only workspaces you belong to; anyone signed in may create.
CREATE POLICY workspace_select ON "workspace" FOR SELECT USING (app_is_member(id));--> statement-breakpoint
CREATE POLICY workspace_update ON "workspace" FOR UPDATE USING (app_is_member(id)) WITH CHECK (app_is_member(id));--> statement-breakpoint
CREATE POLICY workspace_delete ON "workspace" FOR DELETE USING (app_is_member(id));--> statement-breakpoint
CREATE POLICY workspace_insert ON "workspace" FOR INSERT WITH CHECK (app_current_user_id() IS NOT NULL);--> statement-breakpoint

-- workspace_member: see co-members. Bootstrap = insert YOURSELF as owner, and only
-- into a workspace that has no members yet (i.e. the one you just created).
-- `user_id = app_current_user_id()` must come first: a statement cannot see its own
-- inserted row, so `app_is_member()` is still false while the bootstrap INSERT..RETURNING
-- reads the row back. Being able to see your OWN membership rows breaks that cycle.
CREATE POLICY member_select ON "workspace_member" FOR SELECT
  USING (user_id = app_current_user_id() OR app_is_member(workspace_id));--> statement-breakpoint
CREATE POLICY member_insert_bootstrap ON "workspace_member" FOR INSERT
  WITH CHECK (
    user_id = app_current_user_id()
    AND role = 'owner'
    AND NOT app_workspace_has_members(workspace_id)
  );--> statement-breakpoint
CREATE POLICY member_update ON "workspace_member" FOR UPDATE USING (app_is_member(workspace_id)) WITH CHECK (app_is_member(workspace_id));--> statement-breakpoint
CREATE POLICY member_delete ON "workspace_member" FOR DELETE USING (app_is_member(workspace_id));--> statement-breakpoint

-- Child tables: scoped by their workspace.
CREATE POLICY location_all ON "workspace_location" FOR ALL
  USING (app_is_member(workspace_id)) WITH CHECK (app_is_member(workspace_id));--> statement-breakpoint
CREATE POLICY invite_all ON "workspace_invite" FOR ALL
  USING (app_is_member(workspace_id)) WITH CHECK (app_is_member(workspace_id));--> statement-breakpoint
CREATE POLICY member_location_all ON "workspace_member_location" FOR ALL
  USING (app_can_access_member(member_id))
  WITH CHECK (app_can_access_member(member_id));--> statement-breakpoint

-- ── Billing ──────────────────────────────────────────────────────────────────
-- `plan` is a global, read-only catalog (not tenant data), so it is deliberately
-- left without RLS - same treatment as the auth tables above. Only the
-- owner-run seed writes it.
--
-- `workspace_subscription` IS tenant data: scope it by its workspace, mirroring
-- the `location_all` / `invite_all` policies. The create flow inserts the row
-- after the owner member exists, so `app_is_member(workspace_id)` already holds.
ALTER TABLE "workspace_subscription" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workspace_subscription" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY subscription_all ON "workspace_subscription" FOR ALL
  USING (app_is_member(workspace_id)) WITH CHECK (app_is_member(workspace_id));
