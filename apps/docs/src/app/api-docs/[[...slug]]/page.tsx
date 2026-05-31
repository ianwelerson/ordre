import { Card, Cards } from 'fumadocs-ui/components/card';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { APIPage } from '@/components/api-page';
import { getMDXComponents } from '@/components/mdx';

import { apiSource } from '@/lib/source';

export default async function Page(props: PageProps<'/api-docs/[[...slug]]'>) {
  const params = await props.params;
  const page = apiSource.getPage(params.slug);

  // No slug -> the /api-docs landing: list every operation.
  if (!page) {
    if (params.slug?.length) notFound();
    return <ApiIndex />;
  }

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={getMDXComponents({ APIPage })} />
      </DocsBody>
    </DocsPage>
  );
}

function ApiIndex() {
  const operations = apiSource.getPages();

  return (
    <DocsPage>
      <DocsTitle>API Reference</DocsTitle>
      <DocsDescription>
        Interactive reference for the Ordre REST API, generated from the OpenAPI spec. Pick an
        endpoint to see its parameters, schema, and a request playground.
      </DocsDescription>
      <DocsBody>
        <Cards>
          {operations.map((operation) => {
            const method = operation.data._openapi?.method;
            const methodLabel = typeof method === 'string' ? method.toUpperCase() : undefined;

            return (
              <Card
                key={operation.url}
                href={operation.url}
                title={operation.data.title}
                description={[methodLabel, operation.data.description].filter(Boolean).join(' - ')}
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
