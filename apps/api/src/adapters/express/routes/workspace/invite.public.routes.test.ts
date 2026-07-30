import { app, BASE_PATH } from '#/adapters/express/server.ts';
import { auth } from '#/config/auth.ts';
import { INVITE_TOKENS, USER_IDS, userFixtures } from '#/test/fixtures.ts';
import { parseBody } from '#/utils/testing.ts';
import request from 'supertest';

import { ResponseErrorSchema, WorkspaceInvitePreviewSchema } from '@ordre/core/schemas';

import { inviteAcceptPath, inviteDeclinePath, invitePreviewPath } from './workspace.paths.ts';

const previewUrl = (token: string) => `${BASE_PATH}${invitePreviewPath.replace(':token', token)}`;
const declineUrl = (token: string) => `${BASE_PATH}${inviteDeclinePath.replace(':token', token)}`;
const acceptUrl = (token: string) => `${BASE_PATH}${inviteAcceptPath.replace(':token', token)}`;

vi.mock('#/config/auth.ts', () => ({ auth: { api: { getSession: vi.fn() } } }));

/** Authenticates the accept flow as a seeded user (accept reads the email from the DB, not the session). */
const mockUserSession = (userId: string) => {
  const seed = userFixtures.find((u) => u.id === userId);

  vi.mocked(auth.api.getSession).mockResolvedValue({
    user: { id: seed?.id, email: seed?.email },
  } as Awaited<ReturnType<typeof auth.api.getSession>>);
};

/**
 * The invitee-facing invite routes. Preview and decline are public (no session);
 * accept requires one. All read through the `app_invite_*` SECURITY DEFINER
 * functions, so these tests exercise those end to end against the seeded invites.
 */
describe('Workspace Invite (public)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe(`GET ${invitePreviewPath}`, () => {
    test('returns the public preview for a live pending invite', async () => {
      const response = await request(app).get(previewUrl(INVITE_TOKENS.pending)).send().expect(200);

      const preview = parseBody(WorkspaceInvitePreviewSchema, response.body);

      expect(preview.email).toBe('pending-invitee@ordre.app');
      // The preview is a minimal projection - it never leaks the token.
      expect(preview).not.toHaveProperty('token');
    });

    test('returns INVITE_NOT_FOUND for an expired invite', async () => {
      const response = await request(app).get(previewUrl(INVITE_TOKENS.expired)).send().expect(404);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('INVITE_NOT_FOUND');
    });

    test('returns INVITE_NOT_FOUND for an unknown token', async () => {
      await request(app).get(previewUrl(INVITE_TOKENS.missing)).send().expect(404);
    });
  });

  describe(`POST ${inviteDeclinePath}`, () => {
    test('declines a pending invite (204), no session required', async () => {
      const response = await request(app)
        .post(declineUrl(INVITE_TOKENS.pending))
        .send()
        .expect(204);

      expect(response.body).toEqual({});
    });

    test('returns INVITE_NOT_FOUND for a non-pending invite', async () => {
      const response = await request(app)
        .post(declineUrl(INVITE_TOKENS.accepted))
        .send()
        .expect(404);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('INVITE_NOT_FOUND');
    });

    test('returns INVITE_NOT_FOUND for an unknown token', async () => {
      await request(app).post(declineUrl(INVITE_TOKENS.missing)).send().expect(404);
    });
  });

  describe(`POST ${inviteAcceptPath}`, () => {
    test('rejects an unauthenticated request with UNAUTHORIZED', async () => {
      const response = await request(app)
        .post(acceptUrl(INVITE_TOKENS.pendingForOutsider))
        .send()
        .expect(401);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('UNAUTHORIZED');
    });

    test('accepts an invite whose email matches the caller (204)', async () => {
      // The outsider's account email matches the `pendingForOutsider` invite.
      mockUserSession(USER_IDS.outsider);

      const response = await request(app)
        .post(acceptUrl(INVITE_TOKENS.pendingForOutsider))
        .send()
        .expect(204);

      expect(response.body).toEqual({});
    });

    test('rejects an invite addressed to a different email with INVITE_EMAIL_MISMATCH', async () => {
      // The outsider tries to accept an invite addressed to someone else.
      mockUserSession(USER_IDS.outsider);

      const response = await request(app).post(acceptUrl(INVITE_TOKENS.pending)).send().expect(403);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('INVITE_EMAIL_MISMATCH');
    });

    test('returns INVITE_NOT_FOUND when accepting an expired invite', async () => {
      mockUserSession(USER_IDS.outsider);

      const response = await request(app).post(acceptUrl(INVITE_TOKENS.expired)).send().expect(404);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('INVITE_NOT_FOUND');
    });
  });
});
