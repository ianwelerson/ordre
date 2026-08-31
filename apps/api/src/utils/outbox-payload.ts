import z from 'zod';

import { OUTBOX_PAYLOAD_SCHEMAS } from '@ordre/core/schemas';
import type { OutboxDelivery, OutboxPayload, OutboxPayloadFor } from '@ordre/core/types';

/**
 * Parses an outbox row's payload against the schema for its delivery.
 *
 * @param delivery - The `<channel>:<topic>` pair, which picks the schema.
 * @param id - The row id, named in the error so `last_error` says which row is wrong.
 * @throws When the payload does not match, so the worker records the failure.
 */
export const parseOutboxPayload = <D extends OutboxDelivery>(
  delivery: D,
  payload: OutboxPayload,
  id: string
): OutboxPayloadFor<D> => {
  const parsed = z.safeParse(OUTBOX_PAYLOAD_SCHEMAS[delivery], payload);

  if (!parsed.success) {
    throw new Error(
      `Outbox row ${id} has a payload that does not match the schema for ${delivery}: ${formatIssues(parsed.error)}`
    );
  }

  return parsed.data as OutboxPayloadFor<D>;
};

/**
 * Flattens a Zod error to one line: the message lands in the row's `last_error`
 * column, and a queued payload that no longer matches its schema is only
 * debuggable if that column says which field is wrong.
 */
const formatIssues = (error: z.ZodError): string => {
  return error.issues
    .map(({ path, message }) => `${path.join('.') || '(root)'} - ${message}`)
    .join('; ');
};
