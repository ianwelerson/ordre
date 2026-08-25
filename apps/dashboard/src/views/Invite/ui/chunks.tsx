import type { ReactNode } from 'react';

import { Typography } from '@ordre/ui/components';

/**
 * Rich-text chunk handlers shared by the invite copy. They sit at module scope so
 * `t.rich` receives the same function on every render.
 */

/**
 * Renders a chunk in the mono token style, for addresses and other values.
 *
 * @example
 * t.rich('accept.subtitle', { email, mono });
 */
export const mono = (chunks: ReactNode) => {
  return (
    <Typography tag="span" variant="mono-token">
      {chunks}
    </Typography>
  );
};

/**
 * Renders a chunk in bold, for a name inside a sentence.
 *
 * @example
 * t.rich('workspace.invitedBy', { name, bold });
 */
export const bold = (chunks: ReactNode) => {
  return <span className="font-bold">{chunks}</span>;
};
