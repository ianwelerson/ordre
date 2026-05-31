import { createAPIPage } from 'fumadocs-openapi/ui';

import { openapi } from '@/lib/openapi';

// The `APIPage` component used by the generated API reference MDX pages.
export const APIPage = createAPIPage(openapi);
