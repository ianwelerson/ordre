import type { ReactNode } from 'react';

import { Eyebrow, Typography } from '@ordre/ui/components';

export interface AuthHeadingProps {
  eyebrow: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /**
   * A block that belongs with the eyebrow rather than the page, such as the
   * invite screens' workspace card. When given, the title moves below it into a
   * block of its own.
   */
  media?: ReactNode;
}

/**
 * Renders an auth screen's eyebrow, headline, and optional subtitle. Returns a
 * fragment so that `media` can split the heading into two sibling blocks inside
 * `AuthCard` and let the card's gap separate them.
 *
 * @example
 * <AuthHeading eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />
 */
export const AuthHeading = ({ eyebrow, title, subtitle, media }: AuthHeadingProps) => {
  const heading = (
    <div className="flex flex-col gap-2.5">
      <Typography tag="h1" variant="h2">
        {title}
      </Typography>
      {subtitle && (
        <Typography tag="p" variant="body">
          {subtitle}
        </Typography>
      )}
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-3.5">
        <Eyebrow>{eyebrow}</Eyebrow>
        {media ?? heading}
      </div>
      {media && heading}
    </>
  );
};
