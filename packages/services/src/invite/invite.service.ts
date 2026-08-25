import { API_ROUTES, buildPath } from '@ordre/core/constants';
import { WorkspaceInvitePreviewSchema } from '@ordre/core/schemas';

import type { HttpClient } from '../http/client.ts';

export type WorkspaceInviteService = ReturnType<typeof createInviteService>;

/**
 * Everything an invite token can be turned into. Only `preview` answers with a
 * body, so it is the only call handed a schema; the other two are read for
 * their success alone.
 */
export const createInviteService = (http: HttpClient) => ({
  preview: (token: string) =>
    http.get(buildPath(API_ROUTES.invite.preview, { token }), WorkspaceInvitePreviewSchema),
  accept: (token: string) => http.post(buildPath(API_ROUTES.invite.accept, { token })),
  decline: (token: string) => http.post(buildPath(API_ROUTES.invite.decline, { token })),
});
