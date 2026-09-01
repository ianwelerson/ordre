import {
  captureLogs,
  type LogCapture,
  SESSION_VALUE,
  startServer,
  type TestServer,
} from '../test/capture.ts';
import { INVITE_TOKEN } from '../test/errors.ts';
import { httpLogger } from './http-logger.ts';

const HEALTH_PATH = '/v1/health';

/** pino's numeric levels, for asserting which one a response was logged at. */
const LEVEL = { debug: 20, info: 30, warn: 40, error: 50 } as const;

/**
 * The access log runs over a real HTTP server, because `pino-http` composes
 * these serializers over the standard ones and only the written record shows
 * whether that composition took effect.
 */
describe('httpLogger', () => {
  let capture: LogCapture;
  let server: TestServer;

  // Installed before the first logger is built, since pino resolves its
  // destination once, at construction.
  beforeAll(() => {
    capture = captureLogs();
  });

  afterAll(() => {
    capture.restore();
  });

  beforeEach(async () => {
    capture.clear();
    server = await startServer(httpLogger('api', { quietPaths: [HEALTH_PATH] }));
  });

  afterEach(async () => {
    await server.close();
  });

  it('masks the invite token in the logged url and referer', async () => {
    await fetch(server.url(`/v1/invite/${INVITE_TOKEN}`), {
      headers: { referer: `https://app.ordre.app/invite/${INVITE_TOKEN}` },
    });

    const record = await capture.next();

    expect(record.req).toMatchObject({
      url: '/v1/invite/[redacted]',
      headers: { referer: 'https://app.ordre.app/invite/[redacted]' },
    });
    expect(JSON.stringify(record)).not.toContain(INVITE_TOKEN);
  });

  it('keeps the session cookie out of the record', async () => {
    await fetch(server.url('/v1/auth/sign-in/email'), {
      headers: { cookie: `${SESSION_VALUE}=stale`, authorization: 'Bearer tok_abc123' },
    });

    const line = JSON.stringify(await capture.next());

    expect(line).not.toContain(SESSION_VALUE);
    expect(line).not.toContain('tok_abc123');
  });

  it.each([
    ['200', LEVEL.info],
    ['400', LEVEL.warn],
    ['404', LEVEL.debug],
    ['500', LEVEL.error],
  ])('logs a %s response at level %i', async (status, level) => {
    await fetch(server.url('/v1/workspace'), { headers: { 'x-test-status': status } });

    expect(await capture.next()).toMatchObject({ level });
  });

  it.each([HEALTH_PATH, `${HEALTH_PATH}/`, `${HEALTH_PATH}?probe=1`])(
    'demotes %s to debug',
    async (path) => {
      await fetch(server.url(path));

      expect(await capture.next()).toMatchObject({ level: LEVEL.debug });
    }
  );

  it('writes nothing when disabled', async () => {
    const silent = await startServer(httpLogger('api', { enabled: false }));

    await fetch(silent.url('/v1/workspace/silent'));
    await silent.close();
    await fetch(server.url('/v1/workspace/logged'));

    // The next record is the second request's, so the disabled server wrote none.
    expect(await capture.next()).toMatchObject({ req: { url: '/v1/workspace/logged' } });
  });
});
