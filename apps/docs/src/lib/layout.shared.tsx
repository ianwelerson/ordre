import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

import Image from 'next/image';

import { apiDocsRoute, appName, docsRoute } from './shared';

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
    links: [
      {
        text: 'Guides',
        url: docsRoute,
        active: 'nested-url',
      },
      {
        text: 'API Reference',
        url: apiDocsRoute,
        active: 'nested-url',
      },
    ],
  };
}
