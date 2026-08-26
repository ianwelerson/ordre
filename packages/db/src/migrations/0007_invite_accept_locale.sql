-- ── Invite accept: carry the joiner's locale ─────────────────────────────────
-- `workspace_member.locale` decides which language a member reads the product and
-- its email in. Every other membership is created from TypeScript, where the
-- request's negotiated locale is in scope; this one is created inside this
-- function, so the value has to be passed in.
--
-- The signature changes, so the old function is dropped rather than replaced:
-- Postgres overloads on argument types, and `CREATE OR REPLACE` alone would leave
-- both arities callable.
--
-- Only a first-time join takes the parameter. Reinstating a suspended member keeps
-- whatever locale that membership already had, for the same reason the role is
-- reset but the phone is not: the invite defines the role, not how someone reads.
DROP FUNCTION IF EXISTS app_invite_accept(text);
--> statement-breakpoint

CREATE FUNCTION app_invite_accept(token_input text, locale_input locale)
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
    -- new invite defines the role; phone and locale stay as they were left.
    UPDATE workspace_member
       SET status = 'active',
           role   = v_invite.role
     WHERE id = v_member.id;

    v_member_id := v_member.id;
  ELSE
    -- First-time join: create the membership, capturing its id for the location link.
    INSERT INTO workspace_member (user_id, workspace_id, role, status, locale)
    VALUES (v_user_id, v_invite.workspace_id, v_invite.role, 'active', locale_input)
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
