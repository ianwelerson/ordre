import type { OutboxPayload } from '@ordre/core/types';

import { sendEmail } from './email.ts';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
const { renderEmail } = vi.hoisted(() => ({ renderEmail: vi.fn() }));

// Mutable rather than a frozen literal: the service reads the flag on every call,
// so a case can flip it without reloading the module.
const { envMock, log } = vi.hoisted(() => ({
  envMock: { RESEND_API_KEY: 'test-key', DISABLE_OUTBOX_EMAIL: false },
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('#env', () => ({ env: envMock, default: envMock }));
vi.mock('#/config/logger.ts', () => ({ logger: { child: () => log } }));

// A class, not `vi.fn(() => ...)`: the service calls `new Resend(...)`, and an
// arrow function is not constructible.
vi.mock('resend', () => ({
  Resend: class {
    emails = { send };
  },
}));

// Rendering is covered by `@ordre/email`'s own tests; what matters here is that
// this service hands Resend whatever came back, and picks the right delivery.
vi.mock('@ordre/email', () => ({ renderEmail }));

const ROW_ID = '11111111-1111-4111-8111-111111111111';

const payload: OutboxPayload = {
  to: 'user@example.com',
  locale: 'en',
  variables: {
    user_name: 'Ada',
    user_email: 'user@example.com',
    dashboard_login_url: 'https://dashboard.test/login',
    help_url: 'https://help.test',
    privacy_url: 'https://privacy.test',
  },
};

const invitePayload: OutboxPayload = {
  to: 'invitee@example.com',
  locale: 'pt',
  variables: {
    workspace_name: 'Ordre',
    inviter_name: 'Ada',
    invitee_email: 'invitee@example.com',
    invited_role: 'member',
    invite_url: 'https://dashboard.test/invite/token',
    help_url: 'https://help.test',
    privacy_url: 'https://privacy.test',
  },
};

describe('services/email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.DISABLE_OUTBOX_EMAIL = false;
    send.mockResolvedValue({ data: { id: 'resend-id' }, error: null });
    renderEmail.mockResolvedValue({
      subject: 'Welcome to Ordre',
      html: '<p>Welcome</p>',
      text: 'Welcome',
    });
  });

  it('sends the rendered subject, html and text, with the row id as idempotency key', async () => {
    await sendEmail('account:created', payload, ROW_ID);

    expect(send).toHaveBeenCalledWith(
      {
        to: 'user@example.com',
        from: expect.stringContaining('@'),
        subject: 'Welcome to Ordre',
        html: '<p>Welcome</p>',
        text: 'Welcome',
      },
      // At-least-once delivery means a redelivery is expected; the key is what
      // stops it becoming a duplicate email.
      { idempotencyKey: ROW_ID }
    );
  });

  it('resolves the delivery from the topic and renders with the payload the row carries', async () => {
    await sendEmail('invite:created', invitePayload, ROW_ID);

    expect(renderEmail).toHaveBeenCalledWith(
      'email:invite:created',
      expect.objectContaining({ locale: 'pt', to: 'invitee@example.com' })
    );
  });

  it('renders in the locale frozen into the row, not a request default', async () => {
    await sendEmail('invite:created', invitePayload, ROW_ID);

    const [, rendered] = renderEmail.mock.calls[0] as [string, { locale: string }];

    expect(rendered.locale).toBe('pt');
  });

  it('falls back to the default locale for a payload that carries none', async () => {
    // A row with no locale still has to send. Failing validation here would burn
    // all five attempts and dead-letter a message that is otherwise deliverable.
    const { locale: _locale, ...withoutLocale } = payload;

    await sendEmail('account:created', withoutLocale as OutboxPayload, ROW_ID);

    expect(renderEmail).toHaveBeenCalledWith(
      'email:account:created',
      expect.objectContaining({ locale: 'en' })
    );
    expect(send).toHaveBeenCalled();
  });

  it('throws the provider error rather than returning it, keeping the statusCode', async () => {
    const error = { statusCode: 429, name: 'rate_limit_exceeded', message: 'slow down' };
    send.mockResolvedValue({ data: null, error });

    // The worker marks a row processed whenever this resolves, so a returned error
    // would silently drop the email. statusCode is what drives the retry rule.
    await expect(sendEmail('account:created', payload, ROW_ID)).rejects.toMatchObject({
      statusCode: 429,
    });
  });

  it('rejects a payload that does not match the topic it was queued under', async () => {
    // Valid for account:created, but workspace:created renders other variables.
    // The message has to name the row and the offending field: it is what the
    // worker writes to `last_error`.
    await expect(sendEmail('workspace:created', payload, ROW_ID)).rejects.toThrow(
      `Outbox row ${ROW_ID} has a payload that does not match the schema for email:workspace:created: variables.workspace_name - `
    );
    expect(send).not.toHaveBeenCalled();
    expect(renderEmail).not.toHaveBeenCalled();
  });

  it('rejects an id that is not a uuid, so it can never be a weak idempotency key', async () => {
    await expect(sendEmail('account:created', payload, 'not-a-uuid')).rejects.toThrow(
      'Outbox row id "not-a-uuid" is not a uuid'
    );
    expect(send).not.toHaveBeenCalled();
  });

  /**
   * A topic is no longer carried by every channel, and the worker routes on the
   * `channel` column alone, so this is the guard against a row reaching the wrong
   * provider.
   */
  it('rejects a topic the email channel has no delivery for', async () => {
    await expect(sendEmail('contact:sync', payload, ROW_ID)).rejects.toThrow(
      `Outbox row ${ROW_ID} has no email delivery for topic contact:sync`
    );
    expect(renderEmail).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  describe('DISABLE_OUTBOX_EMAIL', () => {
    beforeEach(() => {
      envMock.DISABLE_OUTBOX_EMAIL = true;
    });

    /** Resolving is what marks the row processed, so a skipped message is dropped. */
    it('renders and sends nothing when the flag is set', async () => {
      await expect(sendEmail('account:created', payload, ROW_ID)).resolves.toBeUndefined();

      expect(renderEmail).not.toHaveBeenCalled();
      expect(send).not.toHaveBeenCalled();
    });

    it('names the row it skipped, so a missing email is traceable', async () => {
      await sendEmail('account:created', payload, ROW_ID);

      expect(log.info).toHaveBeenCalledWith(
        { outboxId: ROW_ID, topic: 'account:created' },
        expect.stringContaining('DISABLE_OUTBOX_EMAIL')
      );
    });

    /**
     * The check comes before the schema, so a row that would have dead-lettered on
     * a bad payload is processed instead. That is the cost of the flag, and it is
     * why it belongs in local development rather than on a deployed stage.
     */
    it('returns before the payload is validated', async () => {
      await expect(sendEmail('workspace:created', payload, ROW_ID)).resolves.toBeUndefined();
    });
  });
});
