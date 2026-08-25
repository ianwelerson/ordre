import type { ReactNode } from 'react';

import { Typography } from '@ordre/ui/components';

export interface AuthFootnoteProps {
  children: ReactNode;
}

/**
 * The small centred line under a screen's action: the way to the screen that
 * would have suited the reader better, or the terms they are agreeing to.
 *
 * A direct child of `AuthCard`, never nested inside the form above it, so every
 * screen sets it off by the same distance.
 */
export const AuthFootnote = ({ children }: AuthFootnoteProps) => {
  return (
    <div className="mt-1 text-center">
      <Typography tag="p" variant="caption">
        {children}
      </Typography>
    </div>
  );
};
