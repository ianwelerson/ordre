import type { Tx } from '#/config/db-context.ts';
import { urls } from '#/config/urls.ts';

import { pushToOutbox } from './outbox.ts';

const { afterCommit, wakeOutboxWorker } = vi.hoisted(() => ({
  afterCommit: vi.fn(),
  wakeOutboxWorker: vi.fn(),
}));

vi.mock('#/config/db-context.ts', () => ({ afterCommit }));
vi.mock('#/workers/outbox.worker.ts', () => ({ wakeOutboxWorker }));

const values = vi.fn().mockResolvedValue(undefined);
const transaction = { insert: vi.fn(() => ({ values })) } as unknown as Tx;

describe('utils/outbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    values.mockResolvedValue(undefined);
  });

  it('writes the channel, the topic and a payload of recipient + variables', async () => {
    await pushToOutbox(transaction, {
      channel: 'email',
      topic: 'invite:created',
      to: 'invitee@example.com',
      variables: {
        workspace_name: 'Ordre',
        inviter_name: 'Ada',
        invitee_email: 'invitee@example.com',
        invited_role: 'member',
        invite_url: 'https://dashboard.test/invite/token',
      },
    });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'email',
        topic: 'invite:created',
        payload: expect.objectContaining({ to: 'invitee@example.com' }),
      })
    );
  });

  it('merges the default variables in, so producers never repeat them', async () => {
    await pushToOutbox(transaction, {
      channel: 'email',
      topic: 'account:created',
      to: 'user@example.com',
      variables: {
        user_name: 'Ada',
        user_email: 'user@example.com',
        dashboard_login_url: urls.dashboardLogin,
      },
    });

    const [{ payload }] = values.mock.calls[0] as [{ payload: { variables: object } }];

    expect(payload.variables).toEqual({
      user_name: 'Ada',
      user_email: 'user@example.com',
      dashboard_login_url: urls.dashboardLogin,
      help_url: urls.help,
      privacy_url: urls.privacy,
    });
  });

  it('queues the worker wake for after the commit, never during', async () => {
    await pushToOutbox(transaction, {
      channel: 'email',
      topic: 'account:created',
      to: 'user@example.com',
      variables: {
        user_name: 'Ada',
        user_email: 'user@example.com',
        dashboard_login_url: urls.dashboardLogin,
      },
    });

    expect(afterCommit).toHaveBeenCalledWith(wakeOutboxWorker);
    expect(wakeOutboxWorker).not.toHaveBeenCalled();
  });

  it('registers the wake only after the insert has resolved', async () => {
    const order: string[] = [];

    values.mockImplementation(async () => {
      await Promise.resolve();
      order.push('insert');
    });
    afterCommit.mockImplementation(() => order.push('afterCommit'));

    await pushToOutbox(transaction, {
      channel: 'email',
      topic: 'account:created',
      to: 'user@example.com',
      variables: {
        user_name: 'Ada',
        user_email: 'user@example.com',
        dashboard_login_url: urls.dashboardLogin,
      },
    });

    expect(order).toEqual(['insert', 'afterCommit']);
  });

  describe('sendAfter', () => {
    const verifyEmail = (sendAfter?: Date) =>
      pushToOutbox(transaction, {
        channel: 'email',
        topic: 'account:verify-email',
        to: 'user@example.com',
        variables: { user_email: 'user@example.com', verify_url: 'https://api.test/verify' },
        ...(sendAfter && { sendAfter }),
      });

    it('leaves `nextAttemptAt` to the column default when absent', async () => {
      await verifyEmail();

      const [row] = values.mock.calls[0] as [Record<string, unknown>];

      expect('nextAttemptAt' in row).toBe(false);
    });

    it('holds the row back to the given moment', async () => {
      const sendAfter = new Date(Date.now() + 30 * 60 * 1000);

      await verifyEmail(sendAfter);

      expect(values).toHaveBeenCalledWith(expect.objectContaining({ nextAttemptAt: sendAfter }));
    });

    it('does not wake the worker for a row that is not due yet', async () => {
      await verifyEmail(new Date(Date.now() + 30 * 60 * 1000));

      expect(afterCommit).not.toHaveBeenCalled();
    });

    it('still wakes the worker when the moment has already passed', async () => {
      await verifyEmail(new Date(Date.now() - 1000));

      expect(afterCommit).toHaveBeenCalledWith(wakeOutboxWorker);
    });
  });
});
