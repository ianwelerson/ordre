import { ReactNode } from 'react';

import { SiteHeader, type SiteHeaderProps } from './SiteHeader';

export interface SiteShellProps {
  showHeader?: boolean;
  /** Forwarded to `SiteHeader`. Ignored while `showHeader` is false. */
  headerContent?: SiteHeaderProps;
  children: ReactNode;
  /** Rendered inside the `footer` landmark. Omit it and no footer element exists. */
  footer?: ReactNode;
}

/**
 * Page frame for the public site: header, main, footer.
 *
 * The column is at least the viewport tall with `main` taking the slack, so a short
 * page still pins its footer to the bottom rather than leaving it mid-screen.
 */
export const SiteShell = ({
  // Header
  headerContent,
  showHeader = false,
  // Content
  children,
  // Footer
  footer,
}: SiteShellProps) => {
  return (
    <div className="flex min-h-dvh flex-col">
      {showHeader && <SiteHeader {...headerContent} />}
      <main className="flex-1">{children}</main>
      {footer && <footer>{footer}</footer>}
    </div>
  );
};
