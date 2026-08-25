import type { ReactNode } from 'react';

import { Typography } from '@ordre/ui/components';

export interface AuthFootnoteProps {
  children: ReactNode;
}

/**
 * Renders the small centred line under an auth screen's action, used for a link
 * to a better-suited screen or for terms copy. It is a direct child of
 * `AuthCard` rather than of the form, so every screen sets it off equally.
 *
 * @example
 * <AuthFootnote>{t('noAccount')} <TextLink href={…}>{t('createOne')}</TextLink></AuthFootnote>
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
