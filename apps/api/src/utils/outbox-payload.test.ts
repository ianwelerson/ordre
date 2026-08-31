import type { OutboxPayload } from '@ordre/core/types';

import { parseOutboxPayload } from './outbox-payload.ts';

const ROW_ID = '11111111-1111-4111-8111-111111111111';

const emailPayload = {
  to: 'user@example.com',
  locale: 'en',
  variables: {
    user_name: 'Ada',
    user_email: 'user@example.com',
    dashboard_login_url: 'https://dashboard.test/login',
    help_url: 'https://help.test',
    privacy_url: 'https://privacy.test',
  },
} satisfies OutboxPayload;

describe('utils/outbox-payload', () => {
  it('returns the payload when it matches the delivery it was queued for', () => {
    expect(parseOutboxPayload('email:account:created', emailPayload, ROW_ID)).toEqual(emailPayload);
  });

  it('rejects a payload parsed against another delivery', () => {
    expect(() => parseOutboxPayload('email:workspace:created', emailPayload, ROW_ID)).toThrow(
      /email:workspace:created/
    );
  });

  /** The message lands in `last_error`, so it has to name the row and the field. */
  it('names the row and the offending field when the payload no longer matches', () => {
    const stale = {
      ...emailPayload,
      variables: { ...emailPayload.variables, user_email: 'not-an-address' },
    } as unknown as OutboxPayload;

    expect(() => parseOutboxPayload('email:account:created', stale, ROW_ID)).toThrow(
      new RegExp(`${ROW_ID}.*user_email`)
    );
  });
});
