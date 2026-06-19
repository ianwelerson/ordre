'use client';

import { createOpenAPIPage } from 'fumadocs-openapi/ui';

// The `APIPage` component used by the generated API reference MDX pages.
// In fumadocs-openapi v11, `createOpenAPIPage` takes render options (not the
// server) and returns a client component, so the factory must run in a client
// module. Each page's `document`/`operations` are supplied by the generated MDX.
export const APIPage = createOpenAPIPage();
