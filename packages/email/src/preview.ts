import { createElement, type ReactElement } from 'react';

import type { Locale } from '@ordre/core/enums';
import type { EmailDelivery } from '@ordre/core/types';

import { copyFor } from './copy.ts';
import { TEMPLATES } from './registry.ts';
import { SAMPLES } from './samples.ts';

/**
 * Builds a template the same way `renderEmail` does, for the preview server.
 *
 * Goes through the registry rather than importing a component directly, so a
 * preview can never show a pairing of template and copy that a real send would
 * not produce.
 *
 * @example
 * const Preview = () => previewFor('email:invite:created', 'pt');
 */
export const previewFor = (delivery: EmailDelivery, locale: Locale): ReactElement => {
  const { copyKey, Component } = TEMPLATES[delivery];
  const props: Record<string, unknown> = {
    locale,
    copy: copyFor(locale, copyKey),
    ...SAMPLES[delivery],
  };

  // `delivery` is the whole union here rather than one literal, so the compiler
  // cannot line the component up with its sample set even though both tables are
  // keyed by it. Each concrete pairing is checked where it is declared.
  return createElement(Component as (props: Record<string, unknown>) => ReactElement, props);
};
