import { ReactNode } from 'react';

import { cx } from '../../helpers/cva';
import { SiteHeader, type SiteHeaderProps } from './SiteHeader';

export interface SiteShellProps {
  children: ReactNode;
  contentClass?: string;
  showHeader?: boolean;
  /** Forwarded to `SiteHeader`. Ignored while `showHeader` is false. */
  headerContent?: SiteHeaderProps;
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
  contentClass,
}: SiteShellProps) => {
  return (
    <div className="flex min-h-dvh flex-col">
      {showHeader && <SiteHeader {...headerContent} />}
      <main className={cx('flex-1', contentClass)}>{children}</main>
      {footer && <footer>{footer}</footer>}
    </div>
  );
};
