import type { ReactNode } from 'react';

import { Card } from '@ordre/ui/components';

export interface AuthCardProps {
  children: ReactNode;
}

/**
 * Wraps an auth screen's blocks in the shared card. The card's own gap spaces
 * them, so a screen never sets its own vertical rhythm, and below 460px the
 * corners square off and it runs edge to edge.
 *
 * @example
 * <AuthCard><AuthHeading … /><form … /></AuthCard>
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
