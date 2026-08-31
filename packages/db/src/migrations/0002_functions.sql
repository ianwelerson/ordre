-- ============================================================================
-- SECURITY DEFINER functions
-- ----------------------------------------------------------------------------
-- Every function here is SECURITY DEFINER. Normally a function runs with the
-- privileges of whoever *calls* it; SECURITY DEFINER makes it run with the
-- privileges of whoever *created* it (a privileged role), which lets it bypass
-- Row-Level Security in one explicit, auditable place. We need that because the
-- `invite_all` RLS policy is `USING (app_is_member(workspace_id))`, so:
--   * the public preview/decline calls have no `app.user_id` at all, and
--   * an accepting invitee is not a member of the target workspace yet,
-- meaning a normal query would see (or write) zero invite rows. The audience
-- function at the end is here for the same reason from the other direction: it
-- has to see workspaces the caller is not a member of. This mirrors the
-- `app_slug_exists` pattern in the previous migration.
--
-- Every function also pins `SET search_path = public, pg_temp` - a required
-- hardening step for SECURITY DEFINER functions so a caller can't point object
-- names at a malicious schema (privilege-escalation guard).
-- ============================================================================

-- ── 1. Preview (public, read-only) ───────────────────────────────────────────
-- Powers the invite landing page, which renders before the invitee has a
-- session. Returns a minimal projection (never the token or internal ids) for a
-- single pending, non-expired invite, and no rows for anything else.
--
-- `LANGUAGE sql` + `STABLE`: the body is a single SELECT that only reads, so it
-- is marked STABLE (does not modify data). The OUT columns are renamed
-- (invite_email, invitee_name, ...) so they can't collide with the `name`
-- columns referenced in the body (i.name / w.name / u.name).
--
-- `expires_at` is returned as ISO-8601 UTC text, not the `timestamptz` it is
-- stored as: callers reach this through `db.execute()`, which skips pg's type
-- parsers, so a `timestamptz` would arrive rendered in the session's time zone
-- (`2026-07-30 16:37:51.520952-06`) - not a format `new Date()` reads reliably.
CREATE FUNCTION app_invite_preview(token_input text)
RETURNS TABLE (
  invite_email text,
  invitee_name text,
  member_role workspace_member_role,
  workspace_name text,
  workspace_logo text,
  invited_by_name text,
  expires_at text
)
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, pg_temp
AS $$
  SELECT
    i.email       AS invite_email,
    i.name        AS invitee_name,
    i.role        AS member_role,
    w.name        AS workspace_name,
    w.logo        AS workspace_logo,
    u.name        AS invited_by_name,
    to_char(i.expires_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS expires_at
  FROM workspace_invite i
  JOIN workspace w ON w.id = i.workspace_id
  -- The inviter may have been removed since (invited_by_member_id is ON DELETE SET
  -- NULL), so LEFT JOIN keeps the invite previewable even without their name.
  LEFT JOIN workspace_member m ON m.id = i.invited_by_member_id
  LEFT JOIN "user" u ON u.id = m.user_id
  WHERE i.token = token_input
    AND i.status = 'pending'
    AND i.expires_at > now();
$$;
--> statement-breakpoint

-- ── 2. Accept (session required; joins or reactivates) ───────────────────────
-- Runs atomically: it re-reads the caller from `app_current_user_id()` rather than
-- trusting the client, verifies the invite is pending and unexpired and that the
-- caller's email matches the invite's, then creates the membership (and its
-- location link, if any) and marks the invite accepted. The controller only maps
-- the returned status string onto a response.
--
-- `locale_input` is passed in because the membership row is created here, where
-- there is no request to negotiate a language from. It only lands on a first-time
-- join; reinstating a suspended member keeps whatever locale that membership had,
-- for the same reason the role is reset but the phone is not.
--
-- `display_name` is taken from the accepting user's `first_name`, and coalesced
-- rather than assigned on reinstatement: a removal keeps the column, so a member
-- who set their own name keeps it through a re-invite.
CREATE FUNCTION app_invite_accept(token_input text, locale_input locale)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id         uuid := app_current_user_id();
  v_user_email      text;
  v_user_first_name text;
  v_member          workspace_member;
  v_member_id       uuid;
  v_invite          workspace_invite;
BEGIN
  -- No session -> nobody to attach the membership to.
  IF v_user_id IS NULL THEN
    RETURN 'UNAUTHORIZED';
  END IF;

  SELECT email, first_name
    INTO v_user_email, v_user_first_name
    FROM "user"
   WHERE id = v_user_id;

  -- Lock the invite row (FOR UPDATE) so two concurrent accepts can't both pass the
  -- checks below and insert duplicate memberships.
  SELECT * INTO v_invite
  FROM workspace_invite
  WHERE token = token_input
    AND status = 'pending'
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'INVITE_NOT_FOUND';
  END IF;

  -- The invite is bound to a specific email, so the account accepting it must own
  -- that address. This is the real guard - the prefilled email on the page is UX.
  IF lower(v_invite.email) <> lower(v_user_email) THEN
    RETURN 'INVITE_EMAIL_MISMATCH';
  END IF;

  -- Look up any existing membership for this (workspace, user) and lock it, so a
  -- concurrent accept or remove can't change its status from under us. A member is
  -- never hard-deleted (remove is a soft delete -> status 'suspended'), so the row
  -- may still be here from a past membership.
  SELECT * INTO v_member
  FROM workspace_member
  WHERE workspace_id = v_invite.workspace_id AND user_id = v_user_id
  FOR UPDATE;

  IF FOUND THEN
    -- Already an active member: settle the invite and return, so a double submit
    -- (or a retried request) is harmless.
    IF v_member.status = 'active' THEN
      UPDATE workspace_invite SET status = 'accepted' WHERE id = v_invite.id;
      RETURN 'ALREADY_MEMBER';
    END IF;

    -- Suspended (removed earlier): reinstate the existing row rather than inserting
    -- a new one, which the unique (user_id, workspace_id) index would reject. The
    -- new invite defines the role; phone and locale stay as they were left.
    UPDATE workspace_member
       SET status       = 'active',
           role         = v_invite.role,
           display_name = COALESCE(v_member.display_name, v_user_first_name)
     WHERE id = v_member.id;

    v_member_id := v_member.id;
  ELSE
    -- First-time join: create the membership, capturing its id for the location link.
    INSERT INTO workspace_member (user_id, workspace_id, role, status, locale, display_name)
    VALUES (v_user_id, v_invite.workspace_id, v_invite.role, 'active', locale_input, v_user_first_name)
    RETURNING id INTO v_member_id;
  END IF;

  -- Attach the member to the invited location, but only when the invite targeted
  -- one. ON CONFLICT DO NOTHING so a stale link left over from a prior membership
  -- doesn't error when reactivating; a location-less invite leaves them unassigned.
  IF v_invite.location_id IS NOT NULL THEN
    INSERT INTO workspace_member_location (member_id, location_id)
    VALUES (v_member_id, v_invite.location_id)
    ON CONFLICT (member_id, location_id) DO NOTHING;
  END IF;

  UPDATE workspace_invite SET status = 'accepted' WHERE id = v_invite.id;
  RETURN 'ACCEPTED';
END;
$$;

-- ── 3. Decline (public, mutating) ────────────────────────────────────────────
-- The invitee's "no". Public and token-only: someone shouldn't have to create an
-- account just to decline, so - unlike accept - there is no session and no email
-- check; holding the token IS the authorization.
--
-- It WRITES (sets status = 'declined'), so it is VOLATILE (not STABLE). Returns
-- the declined invite's id, or NULL when no pending invite matched the token (the
-- controller maps NULL to INVITE_NOT_FOUND). No `expires_at` filter: an invitee
-- actively declining a still-pending invite should always succeed.
CREATE FUNCTION app_invite_decline(token_input text)
RETURNS uuid
LANGUAGE sql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE workspace_invite
     SET status = 'declined'
   WHERE token = token_input
     AND status = 'pending'
  RETURNING id;
$$;
--> statement-breakpoint

-- ── 4. Expire (the sweep, called by a scheduler) ─────────────────────────────
-- Flips every still-pending invite whose deadline has passed to 'expired'. This
-- is bookkeeping only: preview/accept already refuse expired invites via their
-- `expires_at > now()` filters, so validity never depends on this running. What
-- it fixes is (a) accurate admin listings and (b) freeing the partial unique
-- index so the same email can be re-invited.
--
-- SECURITY DEFINER is essential here: a scheduler (pg_cron or an external job)
-- has no `app.user_id`, so under RLS a plain UPDATE would match ZERO rows and
-- silently do nothing. Returns the number of rows expired (handy for logging).
CREATE FUNCTION app_invite_expire()
RETURNS integer
LANGUAGE sql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH expired AS (
    UPDATE workspace_invite
       SET status = 'expired'
     WHERE status = 'pending'
       AND expires_at <= now()
    RETURNING id
  )
  SELECT count(*)::int FROM expired;
$$;

-- ── 5. Audience state (contact sync for a member the caller acts on) ─────────
-- Answers what a member's Resend contact should look like: their address, name
-- parts, and whether they own or belong to a workspace anywhere. The last two are
-- computed across every workspace, which is why this needs SECURITY DEFINER - RLS
-- hides the target's other workspaces from an admin acting inside one of them.
--
-- Those two booleans are for the outbox payload only. Returning them to a client
-- would tell one workspace's admin about a tenant they have no relationship with.
CREATE FUNCTION app_member_audience_state(member_id_input uuid)
RETURNS TABLE(email text, first_name text, last_name text, is_owner boolean, is_member boolean)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target_user uuid;
  v_workspace   uuid;
BEGIN
  SELECT m.user_id, m.workspace_id INTO v_target_user, v_workspace
  FROM workspace_member m WHERE m.id = member_id_input;

  IF NOT FOUND THEN RETURN; END IF;

  -- The caller must be the member themselves, or an active owner/admin of that
  -- member's workspace. Without this the function hands any user's email to anyone
  -- who can supply an id.
  IF NOT EXISTS (
    SELECT 1 FROM workspace_member c
    WHERE c.workspace_id = v_workspace
      AND c.user_id = app_current_user_id()
      AND c.status = 'active'
      AND (c.role IN ('owner', 'admin') OR c.user_id = v_target_user)
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT u.email, u.first_name, u.last_name,
    EXISTS (SELECT 1 FROM workspace_member m
             WHERE m.user_id = u.id AND m.status = 'active' AND m.role = 'owner'),
    EXISTS (SELECT 1 FROM workspace_member m
             WHERE m.user_id = u.id AND m.status = 'active' AND m.role <> 'owner')
  FROM "user" u WHERE u.id = v_target_user;
END;
$$;
