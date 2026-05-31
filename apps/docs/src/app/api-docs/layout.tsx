import { DocsLayout } from 'fumadocs-ui/layouts/docs';

import { baseOptions } from '@/lib/layout.shared';
import { apiSource } from '@/lib/source';

export default function Layout({ children }: LayoutProps<'/api-docs'>) {
  return (
    <DocsLayout tree={apiSource.getPageTree()} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
