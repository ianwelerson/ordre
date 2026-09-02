import type { BaseLayoutProps, LayoutTab } from 'fumadocs-ui/layouts/shared';

import Image from 'next/image';

import { apiDocsRoute, appName, docsRoute } from './shared';

/**
 * The two documentation sets, shown as the sidebar's switcher.
 *
 * They come from separate loaders, so the tabs are declared here rather than
 * derived from a page tree. `isLayoutTabActive` falls back to a nested URL match
 * when a tab has no bound folder, which is what selects the right one.
 */
export const layoutTabs: LayoutTab[] = [
  {
    title: 'Documentation',
    description: 'Setup, product specs, and architecture',
    url: docsRoute,
  },
  {
    title: 'API Reference',
    description: 'Every endpoint, generated from the spec',
    url: apiDocsRoute,
  },
];

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      url: docsRoute,
      title: (
        <>
          <Image
            src="/icon-rounded.svg"
            alt="Ordre"
            width={24}
            height={24}
            className="rounded-md"
          />
          <span className="font-medium">{appName}</span>
        </>
      ),
      transparentMode: 'top',
    },
  };
}
