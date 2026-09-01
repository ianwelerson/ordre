import { stdSerializers } from 'pino';

import { failedInviteInsert, INVITE_TOKEN, INVITEE_EMAIL } from '../test/errors.ts';
import { maskUrl, scrubError, scrubRequest, scrubResponse } from './scrub.ts';

/** The credentials the invite and auth flows put in a path or a query string. */
describe('maskUrl', () => {
  it('replaces the token in an invite path', () => {
    expect(maskUrl(`/v1/invite/${INVITE_TOKEN}`)).toBe('/v1/invite/[redacted]');
  });

  it('keeps the action following a masked token', () => {
    expect(maskUrl(`/v1/invite/${INVITE_TOKEN}/accept`)).toBe('/v1/invite/[redacted]/accept');
  });

  it('replaces the token in a password reset path', () => {
    expect(maskUrl('/v1/auth/reset-password/tok_abc123')).toBe(
      '/v1/auth/reset-password/[redacted]'
    );
  });

  it('replaces every query parameter value, keeping the names', () => {
    expect(maskUrl('/v1/auth/verify-email?token=tok_abc&callbackURL=/dashboard')).toBe(
      '/v1/auth/verify-email?token=[redacted]&callbackURL=[redacted]'
    );
  });

  it('masks an absolute URL, which is the shape a referer header carries', () => {
    expect(maskUrl(`https://app.ordre.app/invite/${INVITE_TOKEN}`)).toBe(
      'https://app.ordre.app/invite/[redacted]'
    );
  });

  it('leaves a path carrying no credential alone', () => {
    expect(maskUrl('/v1/workspace/9f1e/member/me')).toBe('/v1/workspace/9f1e/member/me');
  });
});

/** The request fields that reach the access log, and the ones that must not. */
describe('scrubRequest', () => {
  const serialized = () =>
    scrubRequest({
      id: 1,
      method: 'GET',
      url: `/v1/invite/${INVITE_TOKEN}`,
      headers: {
        host: 'api.ordre.app',
        'user-agent': 'curl/8.7.1',
        referer: `https://app.ordre.app/invite/${INVITE_TOKEN}`,
        cookie: `session=${INVITE_TOKEN}`,
        authorization: 'Bearer tok_abc123',
        'x-forwarded-for': '203.0.113.5',
        'x-ordre-client-ip': '203.0.113.5',
      },
    });

  it('keeps the allowlisted headers', () => {
    expect(serialized().headers).toMatchObject({
      host: 'api.ordre.app',
      'user-agent': 'curl/8.7.1',
    });
  });

  it.each(['cookie', 'authorization', 'x-forwarded-for', 'x-ordre-client-ip'])(
    'drops the %s header',
    (name) => {
      expect(serialized().headers).not.toHaveProperty(name);
    }
  );

  it('masks the token in the url and in the referer', () => {
    const { url, headers } = serialized();

    expect(url).toBe('/v1/invite/[redacted]');
    expect(headers.referer).toBe('https://app.ordre.app/invite/[redacted]');
  });

  it('leaves a request with no url alone', () => {
    expect(scrubRequest({ method: 'GET' }).url).toBeUndefined();
  });

  it('drops the caller address', () => {
    const scrubbed = scrubRequest({
      method: 'GET',
      url: '/v1/health',
      remoteAddress: '203.0.113.5',
      remotePort: 54321,
    } as Parameters<typeof scrubRequest>[0]);

    expect(scrubbed).not.toHaveProperty('remoteAddress');
    expect(scrubbed).not.toHaveProperty('remotePort');
  });
});

/** The response headers carry the session cookie Better Auth just issued. */
describe('scrubResponse', () => {
  it('keeps the status and drops the headers', () => {
    const scrubbed = scrubResponse({
      statusCode: 200,
      headers: { 'set-cookie': 'session=abc' },
    } as {
      statusCode: number;
    });

    expect(scrubbed).toStrictEqual({ statusCode: 200 });
  });
});

/**
 * `scrubError` receives the object `pino-std-serializers` produces, so every
 * case here is fed through it the way both loggers do.
 */
describe('scrubError', () => {
  it('keeps the query values out of every field they reach', () => {
    const record = scrubError(stdSerializers.err(failedInviteInsert()));

    expect(JSON.stringify(record)).not.toContain(INVITEE_EMAIL);
    expect(JSON.stringify(record)).not.toContain(INVITE_TOKEN);
  });

  it('keeps the parameterised statement, which names columns rather than values', () => {
    const record = scrubError(stdSerializers.err(failedInviteInsert()));

    expect(record.query).toBe(
      'insert into "invite" ("email", "name", "token") values ($1, $2, $3)'
    );
    expect(record.message).toContain('Failed query: insert into "invite"');
  });

  it.each(['params', 'detail', 'where', 'internalQuery'])('drops the %s field', (key) => {
    const serialized = stdSerializers.err(
      Object.assign(failedInviteInsert(), {
        detail: `Key (email)=(${INVITEE_EMAIL}) already exists.`,
        where: 'PL/pgSQL function inline_code_block line 1',
        internalQuery: `select * from invite where token = '${INVITE_TOKEN}'`,
      })
    );

    // Asserted present first, so a renamed field cannot pass this vacuously.
    expect(serialized).toHaveProperty(key);
    expect(scrubError(serialized)).not.toHaveProperty(key);
  });

  it('drops the driver detail that quotes the offending row back', () => {
    const record = scrubError(stdSerializers.err(failedInviteInsert()));

    expect(JSON.stringify(record)).not.toContain('already exists');
  });

  it('scrubs the members of an aggregate error', () => {
    const aggregate = new AggregateError([failedInviteInsert()], 'batch failed');
    const record = scrubError(stdSerializers.err(aggregate));

    expect(record.aggregateErrors).toHaveLength(1);
    expect(JSON.stringify(record)).not.toContain(INVITEE_EMAIL);
  });

  it('leaves an error carrying no statement alone', () => {
    const record = scrubError(stdSerializers.err(new Error('nothing to hide')));

    expect(record.message).toBe('nothing to hide');
  });
});
