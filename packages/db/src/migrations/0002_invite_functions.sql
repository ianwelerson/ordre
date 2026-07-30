-- ============================================================================
-- Invite SECURITY DEFINER functions
-- ----------------------------------------------------------------------------
-- Every function here is SECURITY DEFINER. Normally a function runs with the
-- privileges of whoever *calls* it; SECURITY DEFINER makes it run with the
-- privileges of whoever *created* it (a privileged role), which lets it bypass
-- Row-Level Security in one explicit, auditable place. We need that because the
-- `invite_all` RLS policy is `USING (app_is_member(workspace_id))`, so:
--   * the public preview/decline calls have no `app.user_id` at all, and
--   * an accepting invitee is not a member of the target workspace yet,
-- meaning a normal query would see (or write) zero invite rows. This mirrors the
-- existing `app_slug_exists` pattern.
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
-- By now the invitee has signed up / logged in, so there IS a session, but they
-- are not an active member of the target workspace yet - though they may be a
-- soft-removed (suspended) member being re-invited, whom this reactivates in
-- place (see the branch below). Two RLS rules block a plain
-- INSERT into workspace_member:
--   * member_insert_bootstrap only allows inserting YOURSELF as `owner` into an
--     empty workspace - not joining a populated one as member/admin.
--   * invite_all hides the invite row itself from non-members.
-- Running the whole accept inside one SECURITY DEFINER function sidesteps both,
-- keeps it atomic, and - crucially - reads the caller from app_current_user_id()
-- (set by rlsContext) instead of trusting a client-supplied id, so nobody can
-- accept on another user's behalf.
--
-- `LANGUAGE plpgsql` (not sql): it needs variables and IF branches. It is NOT
-- STABLE because it writes (the default, VOLATILE, is correct for a mutation).
--
-- Returns a status string the controller maps to an HTTP response:
--   ACCEPTED | ALREADY_MEMBER | INVITE_NOT_FOUND | INVITE_EMAIL_MISMATCH | UNAUTHORIZED
CREATE FUNCTION app_invite_accept(token_input text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id    uuid := app_current_user_id();
  v_user_email text;
  v_member     workspace_member;
  v_member_id  uuid;
  v_invite     workspace_invite;
BEGIN
  -- No session -> nobody to attach the membership to.
  IF v_user_id IS NULL THEN
    RETURN 'UNAUTHORIZED';
  END IF;

  SELECT email INTO v_user_email FROM "user" WHERE id = v_user_id;

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
    -- new invite defines the role; phone stays as it was left on removal (null).
    UPDATE workspace_member
       SET status = 'active',
           role   = v_invite.role
     WHERE id = v_member.id;

    v_member_id := v_member.id;
  ELSE
    -- First-time join: create the membership, capturing its id for the location link.
    INSERT INTO workspace_member (user_id, workspace_id, role, status)
    VALUES (v_user_id, v_invite.workspace_id, v_invite.role, 'active')
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
--> statement-breakpoint

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
