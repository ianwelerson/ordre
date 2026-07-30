import { authenticate } from '#/adapters/express/middlewares/authenticate.ts';
import { rlsContext } from '#/adapters/express/middlewares/rls-context.ts';
import { sendAuthResult, sendResult } from '#/adapters/express/utils/send-result.ts';
import {
  workspaceInviteAccept,
  workspaceInviteDecline,
  workspaceInvitePreviewByToken,
} from '#controllers/workspace';
import { Router } from 'express';

import { inviteAcceptPath, inviteDeclinePath, invitePreviewPath } from './workspace.paths.ts';

// The invitee-facing side of the invite feature. It lives in the `workspace`
// domain folder (next to the admin `invite.routes.ts`) so all invite routing
// stays in one place - the split here is by *trust boundary*, not domain, which
// is a cross-cutting concern expressed through middleware, not folder layout.
//
// Unlike the admin router, this one is mounted at the app root (`/invite/...`,
// see routes/index.ts), because the invitee isn't a workspace member yet and
// doesn't know the workspace id.
const publicInviteRouter: Router = Router();

// Public: the invite landing page renders before the invitee has a session, so
// this route runs with no `authenticate`/`rlsContext` - the controller reads
// through the `app_invite_preview` SECURITY DEFINER function instead.
publicInviteRouter.get(
  invitePreviewPath,
  sendResult((req) => workspaceInvitePreviewByToken(req.params.token))
);

// Declining mutates (sets status = 'declined'), so it must be POST, not GET -
// email link-scanners and browser prefetch issue GETs and would silently decline
// invites. It stays public (above `authenticate`): no account is needed to say no.
publicInviteRouter.post(
  inviteDeclinePath,
  sendResult((req) => workspaceInviteDecline(req.params.token))
);

// Everything below needs a session: the invitee has signed up / logged in by now.
// `authenticate` populates `req.user`; `rlsContext` pins `app.user_id` so the
// accept function can identify the caller.
publicInviteRouter.use(authenticate);
publicInviteRouter.use(rlsContext);

// The token identifies the invite (URL param); the accepting user comes from the
// session via RLS, so the controller only needs the token.
publicInviteRouter.post(
  inviteAcceptPath,
  sendAuthResult((req) => workspaceInviteAccept(req.params.token))
);

export default publicInviteRouter;
