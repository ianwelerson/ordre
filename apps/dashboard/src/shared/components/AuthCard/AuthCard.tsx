import type { ReactNode } from 'react';

import { Card } from '@ordre/ui/components';

export interface AuthCardProps {
  children: ReactNode;
}

/**
 * The sheet every auth screen is printed on.
 *
 * Its children are the screen's blocks - a heading, a form, a footnote - and the
 * card's own gap is what separates them, so a screen never sets the rhythm
 * itself. Below its own width the corners square off and it runs edge to edge,
 * which is what stops a narrow phone showing a floating card on a margin.
 */
export const AuthCard = ({ children }: AuthCardProps) => {
  return (
    <Card
      padding="none"
      className="flex w-full max-w-[460px] flex-col gap-7 px-10 pt-10 pb-8 max-[460px]:rounded-none"
    >
      {children}
    </Card>
  );
};
