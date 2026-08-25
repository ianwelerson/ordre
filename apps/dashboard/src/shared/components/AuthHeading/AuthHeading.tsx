import type { ReactNode } from 'react';

import { Eyebrow, Typography } from '@ordre/ui/components';

export interface AuthHeadingProps {
  eyebrow: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /**
   * A block that belongs to the eyebrow rather than to the page - the invite
   * screens' workspace card. Given one, the title moves below it as a block of
   * its own.
   */
  media?: ReactNode;
}

/**
 * What a screen says it is: an eyebrow, a headline, and the sentence under it.
 *
 * The fragment is deliberate. `media` splits the heading into two blocks that
 * are siblings inside `AuthCard`, so the card's gap separates them; without it
 * the three parts stay in one block and read as a single unit.
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
