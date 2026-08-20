import env from '#env';
import { Resend } from 'resend';
import { z } from 'zod';

import { type OutboxTopic } from '@ordre/core/enums';
import { OUTBOX_PAYLOAD_SCHEMAS } from '@ordre/core/schemas';
import type { OutboxDelivery, OutboxPayload } from '@ordre/core/types';

let resend: Resend | undefined;

/**
 * Built on first send, not at import.
 *
 * The SDK throws on an empty key from its constructor, and this module is pulled in
 * transitively by every producer (through the worker's provider registry), so doing
 * it at module scope takes down anything that imports a controller when the key is
 * unset. Deferring makes a missing key a delivery failure the outbox records and
 * retries, which is where it belongs.
 */
const getResend = () => (resend ??= new Resend(env.RESEND_API_KEY));

/**
 * Delivery -> the template id Resend knows it by.
 *
 * The indirection exists because the right-hand side is not ours: it lives in the
 * Resend dashboard and can be renamed by anyone with access. Keeping it here means
 * a rename, or a new version of a template, is one edit in this file and never
 * reaches a queued row.
 *
 * `Record<OutboxDelivery, string>` makes a new delivery a compile error until it
 * has a Resend template to send with.
 */
/**
 * Deliberately a constant, not an env-derived origin like the links in the body.
 *
 * The sending domain is verified with Resend and does not track the environment -
 * there is no `@ordre.localhost` to send from - so this is the same string in dev,
 * preview and production.
 */
const EMAIL_FROM = 'Ordre <onboarding@ordre.app>';

const RESEND_TEMPLATE_IDS: Record<OutboxDelivery, string> = {
  'email:account:created': 'account-created-1',
  'email:account:verify-email': 'email-verification-1',
  'email:account:reset-password': 'reset-password-1',
  'email:workspace:created': 'workspace-created-1',
  'email:invite:created': 'workspace-invitation-1',
};

/**
 * Flattens a Zod error to one line: the message lands in the row's `last_error`
 * column, and a queued payload that no longer matches its schema is only
 * debuggable if that column says which field is wrong.
 */
const formatIssues = (error: z.ZodError): string =>
  error.issues.map(({ path, message }) => `${path.join('.') || '(root)'} - ${message}`).join('; ');

/**
 * Sends one outbox row through Resend.
 *
 * The template is resolved here from the row's topic, not read off the payload, so
 * a template rename or version bump never has to reach rows already queued. That
 * also means the payload can only be validated at this point: `topic` picks the
 * schema, which is what checks the variables the chosen template will render.
 *
 * **Throws on failure, never returns the error.** The worker marks a row processed
 * whenever this resolves, so a swallowed error silently drops the email. Resend's
 * `ErrorResponse` is rethrown as-is because it carries the `statusCode` the worker
 * classifies on.
 *
 * @param topic - The business event the row was queued for.
 * @param payload - The outbox row's payload: recipient and variables.
 * @param id - The outbox row id, used as the idempotency key so an at-least-once
 *   redelivery inside Resend's 24h window doesn't send twice.
 */
export const sendEmail = async (topic: OutboxTopic, payload: OutboxPayload, id: string) => {
  const parsedPayload = z.safeParse(OUTBOX_PAYLOAD_SCHEMAS[`email:${topic}`], payload);
  const parsedId = z.safeParse(z.uuid(), id);

  if (!parsedPayload.success) {
    throw new Error(
      `Outbox row ${id} has a payload that does not match the schema for email:${topic}: ${formatIssues(parsedPayload.error)}`
    );
  }

  if (!parsedId.success) {
    throw new Error(
      `Outbox row id ${JSON.stringify(id)} is not a uuid, so it cannot be used as an idempotency key`
    );
  }

  const { data: payloadData } = parsedPayload;
  const templateId = RESEND_TEMPLATE_IDS[`email:${topic}`];

  const { data, error } = await getResend().emails.send(
    {
      to: payloadData.to,
      from: EMAIL_FROM,
      template: { id: templateId, variables: payloadData.variables },
    },
    { idempotencyKey: parsedId.data }
  );

  if (error) {
    throw error;
  }

  return data;
};
