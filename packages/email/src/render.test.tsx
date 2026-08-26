import { type Locale, LOCALES, WORKSPACE_MEMBER_ROLES } from '@ordre/core/enums';
import { emails as enCopy } from '@ordre/core/messages/en';
import { emails as ptCopy } from '@ordre/core/messages/pt';
import { OUTBOX_PAYLOAD_SCHEMAS } from '@ordre/core/schemas';
import type { OutboxDelivery, OutboxPayloadFor } from '@ordre/core/types';

import { TEMPLATES } from './registry.ts';
import { renderEmail } from './render.tsx';

const DELIVERIES = Object.keys(OUTBOX_PAYLOAD_SCHEMAS) as OutboxDelivery[];

/** Every string in a copy block, including the ones nested inside the step list. */
const copyStrings = (value: unknown, path = ''): [string, string][] => {
  if (typeof value === 'string') {
    return [[path, value]];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => copyStrings(item, `${path}[${index}]`));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, next]) =>
      copyStrings(next, path ? `${path}.${key}` : key)
    );
  }

  return [];
};

/**
 * A value distinctive enough to find in the output, and valid for the schema that
 * variable is checked against - the suffix decides both.
 */
const sampleValue = (key: string) => {
  if (key.endsWith('_url')) {
    return `https://example.test/${key}`;
  }

  if (key.endsWith('_email')) {
    return `sv-${key}@example.test`;
  }

  if (key.endsWith('_role')) {
    return WORKSPACE_MEMBER_ROLES[0];
  }

  return `sv-${key}`;
};

/**
 * Builds a payload from the delivery's own schema rather than a hand-written
 * fixture, so a variable added to a schema is automatically asserted on here.
 */
const sampleFor = <D extends OutboxDelivery>(delivery: D, locale: Locale) => {
  const shape = OUTBOX_PAYLOAD_SCHEMAS[delivery].shape.variables.shape;
  const variables: Record<string, string> = Object.fromEntries(
    Object.keys(shape).map((key) => [key, sampleValue(key)])
  );

  return {
    payload: { to: 'person@example.test', locale, variables } as OutboxPayloadFor<D>,
    variables,
  };
};

describe('renderEmail', () => {
  it('has a template for every delivery the payload registry declares', () => {
    // The registry's type already guarantees this; asserting it at runtime catches
    // a cast that quietly let a delivery through without one.
    expect(Object.keys(TEMPLATES).sort()).toEqual([...DELIVERIES].sort());
  });

  describe.each(DELIVERIES)('%s', (delivery) => {
    it.each(LOCALES)('renders every variable the schema declares in %s', async (locale) => {
      const { payload, variables } = sampleFor(delivery, locale);
      const { subject, html } = await renderEmail(delivery, payload);

      // An empty subject is rejected by Resend, which would burn all five attempts
      // and dead-letter a message that was otherwise fine.
      expect(subject).not.toBe('');

      for (const [key, value] of Object.entries(variables)) {
        // A role renders as its translated label rather than the enum value.
        // `role label in %s` below asserts that separately.
        if (key.endsWith('_role')) {
          continue;
        }

        // A declared variable the template never renders is the failure the payload
        // registry exists to prevent: a mail that delivers successfully with a
        // blank link.
        expect(html, `${delivery} does not render ${key}`).toContain(value);
      }
    });

    it.each(LOCALES)('leaves no unresolved placeholder in %s', async (locale) => {
      const { payload, variables } = sampleFor(delivery, locale);
      const { subject, html, text } = await renderEmail(delivery, payload);

      for (const key of Object.keys(variables)) {
        expect(subject).not.toContain(`{${key}}`);
        expect(html).not.toContain(`{${key}}`);
      }

      expect(text).not.toContain('undefined');
      expect(html).not.toContain('undefined');
    });

    it.each(LOCALES)('carries the action link into the plain-text body in %s', async (locale) => {
      const { payload, variables } = sampleFor(delivery, locale);
      const { text } = await renderEmail(delivery, payload);

      // A plain-text rendering keeps a link's text but not its target, so the URL
      // is repeated in the body. Without it the message is a dead end for any
      // client that cannot show the HTML.
      const urls = Object.values(variables).filter((value) => value.startsWith('https://'));

      for (const url of urls) {
        expect(text).toContain(url);
      }
    });
  });

  describe.each(LOCALES)('copy coverage in %s', (locale) => {
    const bundle = locale === 'en' ? enCopy : ptCopy;

    it.each(Object.keys(TEMPLATES) as OutboxDelivery[])(
      '%s renders every string in its own copy block',
      async (delivery) => {
        const { payload } = sampleFor(delivery, locale);
        const { subject, html } = await renderEmail(delivery, payload);
        const block = bundle[TEMPLATES[delivery].copyKey];
        // React escapes text nodes, so `You're` reaches the output as `You&#x27;re`.
        // Decoding is what lets the copy be compared as it was written.
        const rendered = `${subject}\n${html}`
          .replaceAll('&#x27;', "'")
          .replaceAll('&quot;', '"')
          .replaceAll('&amp;', '&');

        for (const [field, value] of copyStrings(block)) {
          // Exactly one role label renders per message, so the other two are
          // absent by design. `renders the role label` below covers them.
          if (field.startsWith('role')) {
            continue;
          }

          // Compare the part before the first placeholder: the rest is
          // interpolated, so only this prefix survives verbatim.
          const literal = value.split('{')[0]?.trim() ?? '';

          if (literal.length < 12) {
            continue;
          }

          // Catches a template reading the wrong copy key, and a key typo that
          // use-intl resolves to a fallback rather than the words themselves.
          expect(rendered, `${delivery} does not render copy.${field}`).toContain(literal);
        }
      }
    );
  });

  describe.each(LOCALES)('role label in %s', (locale) => {
    const bundle = locale === 'en' ? enCopy : ptCopy;

    it.each(WORKSPACE_MEMBER_ROLES)("renders %s in the reader's language", async (role) => {
      const { payload } = sampleFor('email:invite:created', locale);
      const { html } = await renderEmail('email:invite:created', {
        ...payload,
        variables: { ...payload.variables, invited_role: role },
      });

      const field =
        `role${role[0]?.toUpperCase()}${role.slice(1)}` as keyof typeof bundle.inviteCreated;

      // The row stores the enum value, which is English and lower case. What the
      // recipient reads has to be neither.
      expect(html).toContain(bundle.inviteCreated[field]);
      expect(html).not.toContain(`>${role}<`);
    });
  });

  it('interpolates variables into the subject, not only the body', async () => {
    const { payload, variables } = sampleFor('email:invite:created', 'en');
    const { subject } = await renderEmail('email:invite:created', payload);

    // The subject is rendered from the registry's copy key rather than by the
    // component, so it is the one string a template-level assertion would miss.
    expect(subject).toContain(variables.workspace_name);
  });

  it('renders different copy per locale', async () => {
    const { payload: en } = sampleFor('email:invite:created', 'en');
    const { payload: pt } = sampleFor('email:invite:created', 'pt');

    const [english, portuguese] = await Promise.all([
      renderEmail('email:invite:created', en),
      renderEmail('email:invite:created', pt),
    ]);

    expect(english.subject).not.toBe(portuguese.subject);
    expect(portuguese.html).toContain('convidou');
  });

  it('sets the document language so a screen reader announces the right one', async () => {
    const { payload } = sampleFor('email:invite:created', 'pt');
    const { html } = await renderEmail('email:invite:created', payload);

    expect(html).toContain('lang="pt"');
  });
});
