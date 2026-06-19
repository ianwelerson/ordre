import type { Folder, Node } from 'fumadocs-core/page-tree';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { APIPage } from '@/components/api-page';
import { getMDXComponents } from '@/components/mdx';

import { openapi } from '@/lib/openapi';
import { apiSource } from '@/lib/source';

export default async function Page(props: PageProps<'/api-docs/[[...slug]]'>) {
  const params = await props.params;
  const page = apiSource.getPage(params.slug);

  // No slug -> the /api-docs landing: list every operation.
  if (!page) {
    if (params.slug?.length) {
      notFound();
    }
    return <ApiIndex />;
  }

  const MDX = page.data.body;

  // In fumadocs-openapi v11 the client `APIPage` needs the bundled spec. The
  // generated MDX only passes `document`/`operations`, so we bundle the spec
  // server-side here (driven by the page's `_openapi.preload` frontmatter) and
  // inject it as the `preloaded` prop.
  const { preloaded } = await openapi.preloadOpenAPIPage(page);

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            APIPage: (props) => <APIPage {...props} preloaded={preloaded} />,
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

// First reachable operation page within a set of tree nodes - used so a folder
// card links somewhere sensible when the folder has no index page of its own.
function firstItemUrl(nodes: Node[]): string | undefined {
  for (const node of nodes) {
    if (node.type === 'page') {
      return node.url;
    }
    if (node.type === 'folder') {
      const url = node.index?.url ?? firstItemUrl(node.children);
      if (url) {
        return url;
      }
    }
  }

  return undefined;
}

function countOperations(nodes: Node[]): number {
  return nodes.reduce((total, node) => {
    if (node.type === 'page') {
      return total + 1;
    }
    if (node.type === 'folder') {
      return total + countOperations(node.children);
    }

    return total;
  }, 0);
}

function ApiIndex() {
  // Show a card per top-level folder (e.g. auth, health) rather than one per
  // operation. Folders come from the generated content tree.
  const folders = apiSource.pageTree.children.filter(
    (node): node is Folder => node.type === 'folder'
  );

  return (
    <DocsPage>
      <DocsTitle>API Reference</DocsTitle>
      <DocsDescription>
        Interactive reference for the Ordre REST API, generated from the OpenAPI spec. Pick a group
        to browse its endpoints.
      </DocsDescription>
      <DocsBody>
        <Cards>
          {folders.map((folder) => {
            const href = folder.index?.url ?? firstItemUrl(folder.children);
            if (!href) {
              return null;
            }

            const count = countOperations(folder.children);

            return (
              <Card
                key={folder.$id ?? href}
                href={href}
                title={folder.name}
                description={`${count} endpoint${count === 1 ? '' : 's'}`}
              />
            );
          })}
        </Cards>
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return apiSource.generateParams();
}

export async function generateMetadata(
  props: PageProps<'/api-docs/[[...slug]]'>
): Promise<Metadata> {
  const params = await props.params;
  const page = apiSource.getPage(params.slug);

  return {
    title: page?.data.title ?? 'API Reference',
    description: page?.data.description ?? 'Interactive reference for the Ordre REST API.',
  };
}
