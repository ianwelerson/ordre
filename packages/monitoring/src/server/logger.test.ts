import { captureLogs, type LogCapture } from '../test/capture.ts';
import { failedInviteInsert, INVITE_TOKEN, INVITEE_EMAIL } from '../test/errors.ts';
import { createLogger } from './logger.ts';

/**
 * The application logger composes `scrubError` over the standard serializer by
 * hand, because plain pino hands a custom `err` serializer the raw `Error`.
 * These assertions run on the written record, so a composition that silently
 * did nothing would fail them.
 */
describe('createLogger', () => {
  let capture: LogCapture;

  // Installed before the first logger is built, since pino resolves its
  // destination once, at construction.
  beforeAll(() => {
    capture = captureLogs();
  });

  afterAll(() => {
    capture.restore();
  });

  beforeEach(() => {
    capture.clear();
  });

  it('keeps the values of a failed query out of the record', async () => {
    createLogger('api').error({ err: failedInviteInsert() }, 'Unhandled error');

    const line = JSON.stringify(await capture.next());

    expect(line).not.toContain(INVITEE_EMAIL);
    expect(line).not.toContain(INVITE_TOKEN);
  });

  it('keeps the parameterised statement for diagnosis', async () => {
    createLogger('api').error({ err: failedInviteInsert() }, 'Unhandled error');

    const record = await capture.next();

    expect(record.err).toMatchObject({
      query: 'insert into "invite" ("email", "name", "token") values ($1, $2, $3)',
    });
  });

  it('scrubs errors a caller cannot switch off with its own serializers', async () => {
    const logger = createLogger('api', { serializers: { err: (error: Error) => error } });

    logger.error({ err: failedInviteInsert() }, 'Unhandled error');

    expect(JSON.stringify(await capture.next())).not.toContain(INVITEE_EMAIL);
  });

  it('tags the record with the service', async () => {
    createLogger('api').info('up');

    expect(await capture.next()).toMatchObject({ service: 'api', msg: 'up' });
  });

  it('writes no service when none is given', async () => {
    createLogger().info('up');

    expect(await capture.next()).not.toHaveProperty('service');
  });
});
