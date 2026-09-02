import { DocsLayout } from 'fumadocs-ui/layouts/docs';

import { baseOptions, layoutTabs } from '@/lib/layout.shared';
import { source } from '@/lib/source';

export default function Layout({ children }: LayoutProps<'/internal-docs'>) {
  return (
    <DocsLayout tree={source.getPageTree()} {...baseOptions()} tabs={layoutTabs}>
      {children}
    </DocsLayout>
  );
}
