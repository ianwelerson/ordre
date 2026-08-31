import type { OutboxPayload } from '@ordre/core/types';

import { syncAudienceContact } from './audience.ts';

const { get, create, update, list, add, remove, updateTopics } = vi.hoisted(() => ({
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  list: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
  updateTopics: vi.fn(),
}));

// A class, not `vi.fn(() => ...)`: the config builds the client with `new Resend(...)`,
// and an arrow function is not constructible.
vi.mock('resend', () => ({
  Resend: class {
    contacts = {
      get,
      create,
      update,
      segments: { list, add, remove },
      topics: { update: updateTopics },
    };
  },
}));

vi.mock('#/config/audience.ts', () => ({
  LOCALE_PROPERTY: 'locale',
  segmentId: (segment: string) => `id-${segment}`,
  topicId: (topic: string) => `id-${topic}`,
}));

const ROW_ID = '11111111-1111-4111-8111-111111111111';
const ALL = 'id-all-accounts';
const OWNER = 'id-workspace-owner';
const MEMBER = 'id-workspace-member';

const payloadFor = (segments: string[], topics: string[] = []): OutboxPayload =>
  ({
    to: 'ada@example.com',
    locale: 'pt',
    variables: {
      contact_first_name: 'Ada',
      contact_last_name: 'Lovelace',
      contact_segments: segments,
      contact_topics: topics,
    },
  }) as OutboxPayload;

/** A Resend success envelope. */
const ok = (data: unknown = {}) => ({ data, error: null });

/** A Resend failure envelope, shaped like the SDK's `ErrorResponse`. */
const fail = (name: string, statusCode = 404) => ({
  data: null,
  error: { name, message: name, statusCode },
});

/** What `contacts.segments.list` answers for a contact in `segments`. */
const inSegments = (...segments: string[]) =>
  ok({ object: 'list', has_more: false, data: segments.map((id) => ({ id, name: id })) });

describe('services/audience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get.mockResolvedValue(ok({ id: 'contact-1' }));
    update.mockResolvedValue(ok());
    create.mockResolvedValue(ok());
    list.mockResolvedValue(inSegments());
    add.mockResolvedValue(ok());
    remove.mockResolvedValue(ok());
    updateTopics.mockResolvedValue(ok());
  });

  it('refuses a topic the audience channel has no delivery for', async () => {
    await expect(syncAudienceContact('account:created', payloadFor([]), ROW_ID)).rejects.toThrow(
      /account:created/
    );
  });

  describe('the contact itself', () => {
    it('updates an existing contact with the current name and language', async () => {
      await syncAudienceContact('contact:sync', payloadFor([]), ROW_ID);

      expect(create).not.toHaveBeenCalled();
      expect(update).toHaveBeenCalledWith({
        email: 'ada@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        properties: { locale: 'pt' },
      });
    });

    /**
     * `unsubscribed` is the contact's own global switch, so a sign-up must not write
     * it: doing so would resurrect somebody who had turned every broadcast off.
     */
    it('creates a missing contact without touching its subscription state', async () => {
      get.mockResolvedValue(fail('not_found'));

      await syncAudienceContact('contact:sync', payloadFor([]), ROW_ID);

      expect(update).not.toHaveBeenCalled();
      expect(create).toHaveBeenCalledWith({
        email: 'ada@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        properties: { locale: 'pt' },
      });
    });

    it('rethrows a lookup failure that is not a missing contact', async () => {
      get.mockResolvedValue(fail('rate_limit_exceeded', 429));

      await expect(
        syncAudienceContact('contact:sync', payloadFor([]), ROW_ID)
      ).rejects.toMatchObject({ statusCode: 429 });
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('segment membership', () => {
    it('adds a desired segment the contact is not in', async () => {
      await syncAudienceContact('contact:sync', payloadFor(['all-accounts']), ROW_ID);

      expect(add).toHaveBeenCalledWith({ email: 'ada@example.com', segmentId: ALL });
      // Not in the workspace segments to begin with, so there is nothing to remove.
      expect(remove).not.toHaveBeenCalled();
    });

    /**
     * Every segment is a fact about our tables rather than a consent, so the sync
     * owns all of them and a membership that ended is removed.
     */
    it('removes a segment the contact is in but the row does not list', async () => {
      list.mockResolvedValue(inSegments(ALL, OWNER, MEMBER));

      await syncAudienceContact('contact:sync', payloadFor(['all-accounts']), ROW_ID);

      expect(remove).toHaveBeenCalledWith({ email: 'ada@example.com', segmentId: OWNER });
      expect(remove).toHaveBeenCalledWith({ email: 'ada@example.com', segmentId: MEMBER });
      expect(add).not.toHaveBeenCalled();
    });

    /**
     * Resend rejects a removal for a segment the contact is not in, so a sync that
     * changes nothing has to send nothing.
     */
    it('sends no membership change when Resend already matches the row', async () => {
      list.mockResolvedValue(inSegments(ALL, OWNER));

      await syncAudienceContact(
        'contact:sync',
        payloadFor(['all-accounts', 'workspace-owner']),
        ROW_ID
      );

      expect(add).not.toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
    });
  });

  describe('topic subscriptions', () => {
    it('opts into the topics the row carries', async () => {
      await syncAudienceContact(
        'contact:sync',
        payloadFor(['all-accounts'], ['product-news']),
        ROW_ID
      );

      expect(updateTopics).toHaveBeenCalledWith({
        email: 'ada@example.com',
        topics: [{ id: 'id-product-news', subscription: 'opt_in' }],
      });
    });

    /**
     * The rule that makes an unsubscribe stick: every producer but sign-up sends an
     * empty list, and an empty list must never be read as a withdrawal.
     */
    it('writes no preference for a row that carries no topics', async () => {
      await syncAudienceContact(
        'contact:sync',
        payloadFor(['all-accounts', 'workspace-owner']),
        ROW_ID
      );

      expect(updateTopics).not.toHaveBeenCalled();
    });

    it('rethrows a failed opt-in so the worker retries it', async () => {
      updateTopics.mockResolvedValue(fail('application_error', 500));

      await expect(
        syncAudienceContact('contact:sync', payloadFor([], ['product-news']), ROW_ID)
      ).rejects.toMatchObject({ statusCode: 500 });
    });
  });

  /**
   * The worker marks a row processed whenever this resolves, so a swallowed error
   * is a contact that silently never syncs.
   */
  describe('failures reach the worker', () => {
    it('rethrows a failed segment add', async () => {
      add.mockResolvedValue(fail('rate_limit_exceeded', 429));

      await expect(
        syncAudienceContact('contact:sync', payloadFor(['workspace-owner']), ROW_ID)
      ).rejects.toMatchObject({ statusCode: 429 });
    });

    it('rethrows a failed segment removal', async () => {
      list.mockResolvedValue(inSegments(MEMBER));
      remove.mockResolvedValue(fail('application_error', 500));

      await expect(
        syncAudienceContact('contact:sync', payloadFor([]), ROW_ID)
      ).rejects.toMatchObject({ statusCode: 500 });
    });

    it('rethrows a failed contact update', async () => {
      update.mockResolvedValue(fail('application_error', 500));

      await expect(
        syncAudienceContact('contact:sync', payloadFor([]), ROW_ID)
      ).rejects.toMatchObject({ statusCode: 500 });
    });
  });
});
