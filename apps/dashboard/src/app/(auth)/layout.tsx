import { ReactNode } from 'react';

import { type SiteHeaderProps, SiteShell } from '@ordre/ui/components';

import { HeaderCta } from './HeaderCta';

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  const headerContent: SiteHeaderProps = {
    trailing: <HeaderCta />,
    alwaysScrolled: true,
  };

  return (
    <SiteShell
      showHeader
      headerContent={headerContent}
      contentClass="flex justify-center items-center"
    >
      {children}
    </SiteShell>
  );
}
