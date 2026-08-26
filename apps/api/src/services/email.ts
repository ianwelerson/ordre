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
 * Loads the template package on first send, for the same reason as the client above.
 *
 * `@ordre/email` brings React and `react-dom/server` with it, and this module
 * reaches every producer transitively, so importing it at module scope would put
 * that cost on the boot path of a process that may never send anything. Node
 * caches the module, so only the first call pays.
 */
const getRenderEmail = async () => (await import('@ordre/email')).renderEmail;

/**
 * Deliberately a constant, not an env-derived origin like the links in the body.
 *
 * The sending domain is verified with Resend and does not track the environment -
 * there is no `@ordre.localhost` to send from - so this is the same string in dev,
 * preview and production.
 */
const EMAIL_FROM = 'Ordre <onboarding@ordre.app>';

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
 * a template change never has to reach rows already queued. That also means the
 * payload can only be validated at this point: `topic` picks the schema, which is
 * what checks the variables the chosen template will render. The payload's own
 * `locale` picks the language, so nothing about the message is decided here.
 *
 * **Throws on failure, never returns the error.** The worker marks a row processed
 * whenever this resolves, so a swallowed error silently drops the email. Resend's
 * `ErrorResponse` is rethrown as-is because it carries the `statusCode` the worker
 * classifies on.
 *
 * @param topic - The business event the row was queued for.
 * @param payload - The outbox row's payload: recipient, locale and variables.
 * @param id - The outbox row id, used as the idempotency key so an at-least-once
 *   redelivery inside Resend's 24h window doesn't send twice.
 */
export const sendEmail = async (topic: OutboxTopic, payload: OutboxPayload, id: string) => {
  const delivery = `email:${topic}` satisfies OutboxDelivery;
  const parsedPayload = z.safeParse(OUTBOX_PAYLOAD_SCHEMAS[delivery], payload);
  const parsedId = z.safeParse(z.uuid(), id);

  if (!parsedPayload.success) {
    throw new Error(
      `Outbox row ${id} has a payload that does not match the schema for ${delivery}: ${formatIssues(parsedPayload.error)}`
    );
  }

  if (!parsedId.success) {
    throw new Error(
      `Outbox row id ${JSON.stringify(id)} is not a uuid, so it cannot be used as an idempotency key`
    );
  }

  const renderEmail = await getRenderEmail();
  const { subject, html, text } = await renderEmail(delivery, parsedPayload.data);

  const { data, error } = await getResend().emails.send(
    {
      to: parsedPayload.data.to,
      from: EMAIL_FROM,
      subject,
      html,
      // Every client that cannot show the HTML still gets a readable message, and
      // spam filters weight a missing plain-text alternative against the sender.
      text,
    },
    { idempotencyKey: parsedId.data }
  );

  if (error) {
    throw error;
  }

  return data;
};
