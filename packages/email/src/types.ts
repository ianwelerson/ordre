import type { Locale } from '@ordre/core/enums';
import type { EmailCopyKeyFor, OutboxDelivery, OutboxVariablesFor } from '@ordre/core/types';

import type { Copy } from './copy.ts';

/**
 * What a template component receives: exactly the variables its delivery declares
 * in `OUTBOX_PAYLOAD_SCHEMAS`, the locale to render in, and its own copy.
 *
 * Both halves are derived from the delivery rather than restated, which is what
 * makes a template that reads an undeclared variable, or another message's copy,
 * a compile error rather than a test failure.
 */
export type TemplateProps<D extends OutboxDelivery> = OutboxVariablesFor<D> & {
  locale: Locale;
  copy: Copy<EmailCopyKeyFor<D>>;
};
