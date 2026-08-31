import { getResend } from '#/config/email.ts';
import { logger } from '#/config/logger.ts';
import { parseOutboxPayload } from '#/utils/outbox-payload.ts';
import { env } from '#env';
import { z } from 'zod';

import { type OutboxTopic } from '@ordre/core/enums';
import { isEmailDelivery } from '@ordre/core/schemas';
import type { OutboxPayload } from '@ordre/core/types';

const log = logger.child({ service: 'email' });

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
 * `DISABLE_OUTBOX_EMAIL` returns before anything is rendered or sent. Resolving is
 * what marks the row processed, so a skipped message is dropped rather than held.
 *
 * @param topic - The business event the row was queued for.
 * @param payload - The outbox row's payload: recipient, locale and variables.
 * @param id - The outbox row id, used as the idempotency key so an at-least-once
 *   redelivery inside Resend's 24h window doesn't send twice.
 */
export const sendEmail = async (topic: OutboxTopic, payload: OutboxPayload, id: string) => {
  if (env.DISABLE_OUTBOX_EMAIL) {
    log.info({ outboxId: id, topic }, 'outbox email skipped - DISABLE_OUTBOX_EMAIL is set');

    return;
  }

  const delivery = `email:${topic}`;

  if (!isEmailDelivery(delivery)) {
    throw new Error(`Outbox row ${id} has no email delivery for topic ${topic}`);
  }

  const parsedPayload = parseOutboxPayload(delivery, payload, id);
  const parsedId = z.safeParse(z.uuid(), id);

  if (!parsedId.success) {
    throw new Error(
      `Outbox row id ${JSON.stringify(id)} is not a uuid, so it cannot be used as an idempotency key`
    );
  }

  const renderEmail = await getRenderEmail();
  const { subject, html, text } = await renderEmail(delivery, parsedPayload);

  const { data, error } = await getResend().emails.send(
    {
      to: parsedPayload.to,
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
