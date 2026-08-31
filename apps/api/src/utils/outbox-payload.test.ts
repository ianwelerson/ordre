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

const audiencePayload = {
  to: 'user@example.com',
  locale: 'pt',
  variables: {
    contact_first_name: 'Ada',
    contact_last_name: 'Lovelace',
    contact_segments: ['workspace-owner'],
    contact_topics: [],
  },
} satisfies OutboxPayload;

describe('utils/outbox-payload', () => {
  it('returns the payload when it matches the delivery it was queued for', () => {
    expect(parseOutboxPayload('email:account:created', emailPayload, ROW_ID)).toEqual(emailPayload);
  });

  it('parses a delivery whose variables are list-valued', () => {
    const parsed = parseOutboxPayload('audience:contact:sync', audiencePayload, ROW_ID);

    expect(parsed.variables.contact_segments).toEqual(['workspace-owner']);
  });

  /**
   * An empty list is a value, not a missing one: it says the contact belongs to
   * none of the synced segments, which is what a removal looks like.
   */
  it('accepts an empty segment list', () => {
    const parsed = parseOutboxPayload(
      'audience:contact:sync',
      { ...audiencePayload, variables: { ...audiencePayload.variables, contact_segments: [] } },
      ROW_ID
    );

    expect(parsed.variables.contact_segments).toEqual([]);
  });

  /**
   * A backfilled account whose name was one word has no last name, and its rows
   * must still deliver rather than dead-letter on validation.
   */
  it('accepts an empty last name where the rest of the vocabulary requires a value', () => {
    const parsed = parseOutboxPayload(
      'audience:contact:sync',
      { ...audiencePayload, variables: { ...audiencePayload.variables, contact_last_name: '' } },
      ROW_ID
    );

    expect(parsed.variables.contact_last_name).toBe('');
  });

  it('rejects a payload parsed against another delivery', () => {
    expect(() => parseOutboxPayload('audience:contact:sync', emailPayload, ROW_ID)).toThrow(
      /audience:contact:sync/
    );
  });

  /** The message lands in `last_error`, so it has to name the row and the field. */
  it('names the row and the offending field when the payload no longer matches', () => {
    const stale = {
      ...audiencePayload,
      variables: { ...audiencePayload.variables, contact_segments: ['nope'] },
    } as unknown as OutboxPayload;

    expect(() => parseOutboxPayload('audience:contact:sync', stale, ROW_ID)).toThrow(
      new RegExp(`${ROW_ID}.*contact_segments`)
    );
  });
});
