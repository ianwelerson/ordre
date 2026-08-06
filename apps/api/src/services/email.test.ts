import type { OutboxPayload } from '@ordre/core/types';

import { sendEmail } from './email.ts';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

// A class, not `vi.fn(() => ...)`: the service calls `new Resend(...)`, and an
// arrow function is not constructible.
vi.mock('resend', () => ({
  Resend: class {
    emails = { send };
  },
}));

const ROW_ID = '11111111-1111-4111-8111-111111111111';

const payload: OutboxPayload = {
  to: 'user@example.com',
  variables: {
    user_name: 'Ada',
    user_email: 'user@example.com',
    base_url: 'https://dashboard.test',
    dashboard_url: 'https://dashboard.test',
    dashboard_login_url: 'https://dashboard.test/login',
    help_url: 'https://help.test',
    privacy_url: 'https://privacy.test',
  },
};

describe('services/email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    send.mockResolvedValue({ data: { id: 'resend-id' }, error: null });
  });

  it('resolves the Resend template from the topic and passes the row id as idempotency key', async () => {
    await sendEmail('account:created', payload, ROW_ID);

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        template: { id: 'account-created-1', variables: payload.variables },
      }),
      // At-least-once delivery means a redelivery is expected; the key is what
      // stops it becoming a duplicate email.
      { idempotencyKey: ROW_ID }
    );
  });

  it('picks a different template for a different topic', async () => {
    await sendEmail(
      'invite:created',
      {
        to: 'invitee@example.com',
        variables: {
          workspace_name: 'Ordre',
          invitee_name: 'Ada',
          invitee_email: 'invitee@example.com',
          invited_name: 'Grace',
          invited_email: 'grace@example.com',
          invited_role: 'member',
          invite_url: 'https://dashboard.test/invite/token',
          base_url: 'https://dashboard.test',
          dashboard_url: 'https://dashboard.test',
          dashboard_login_url: 'https://dashboard.test/login',
          help_url: 'https://help.test',
          privacy_url: 'https://privacy.test',
        },
      },
      ROW_ID
    );

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        template: expect.objectContaining({ id: 'workspace-invitation-1' }),
      }),
      expect.anything()
    );
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
  });

  it('rejects an id that is not a uuid, so it can never be a weak idempotency key', async () => {
    await expect(sendEmail('account:created', payload, 'not-a-uuid')).rejects.toThrow(
      'Outbox row id "not-a-uuid" is not a uuid'
    );
    expect(send).not.toHaveBeenCalled();
  });
});
