import { render } from 'react-email';

import type { OutboxDelivery, OutboxPayloadFor } from '@ordre/core/types';

import { copyFor } from './copy.ts';
import { TEMPLATES } from './registry.ts';

/** A finished email, in the three fields Resend's send takes. */
export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

/**
 * Renders one outbox payload into the email it describes.
 *
 * The delivery key picks both the template and its copy, and the payload's own
 * `locale` picks the language, so nothing about which message this is has to be
 * decided by the caller.
 *
 * Both bodies come from one element rather than two renders of the component, so
 * the plain-text alternative cannot drift from the HTML it accompanies.
 *
 * @param delivery - The `<channel>:<topic>` key naming what to render.
 * @param payload - The outbox row's payload: recipient, locale, and variables.
 * @example
 * const { subject, html, text } = await renderEmail('email:invite:created', payload);
 */
export const renderEmail = async <D extends OutboxDelivery>(
  delivery: D,
  payload: OutboxPayloadFor<D>
): Promise<RenderedEmail> => {
  const { copyKey, Component } = TEMPLATES[delivery];
  const copy = copyFor(payload.locale, copyKey);
  const element = <Component locale={payload.locale} copy={copy} {...payload.variables} />;

  return {
    subject: copy.t('subject', payload.variables),
    html: await render(element),
    text: await render(element, {
      plainText: true,
      // The eyebrow's rule and the card's accent bar are drawn with spacer cells,
      // which reach the text alternative as stray blank lines otherwise.
      htmlToTextOptions: { selectors: [{ selector: '[data-skip-in-text]', format: 'skip' }] },
    }),
  };
};
