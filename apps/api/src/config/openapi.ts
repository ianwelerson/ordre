import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { globSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { auth } from './auth.ts';
import { registry } from './openapi-registry.ts';

const controllersDir = path.resolve(import.meta.dirname, '../controllers');

// Auto-import every controller's *.openapi.ts so it registers onto the shared
// registry before the document is generated. Sorted for a stable spec output.
await Promise.all(
  globSync('**/*.openapi.ts', { cwd: controllersDir })
    .sort()
    .map((file) => import(pathToFileURL(path.join(controllersDir, file)).href))
);

const generator = new OpenApiGeneratorV31(registry.definitions);

// Generate the OpenAPI docs
const openApiDocument = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'Ordre API',
    version: '1.0.0',
    description:
      'REST API for the Ordre client communication platform. It powers the operator dashboard, the shareable client board, and the background services that keep both in sync. Endpoints exchange JSON over HTTPS and follow standard REST conventions. Use the **Production** server for live traffic and the **Development** server for staging or local testing.',
    contact: {
      name: 'Ordre',
      url: 'https://ordre.app',
      email: 'devops@ordre.app',
    },
  },
  servers: [
    { url: 'https://api.ordre.app/api', description: 'Production' },
    { url: 'https://ordre-api.vercel.app/api', description: 'Development' },
    { url: 'https://api.ordre.localhost/api', description: 'Local' },
  ],
});

// Fold better-auth's endpoints into the same document. Its schema paths are
// relative to the auth base (e.g. /sign-in/email), so prefix them with /auth to
// match where the handler is mounted (/api/auth, under the /api server URL).
// better-auth emits OpenAPI 3.1 (matching this document), so its schema merges
// in as-is; cast at the boundary since it ships its own nominal OpenAPI types.
type Components = NonNullable<typeof openApiDocument.components>;
type Paths = NonNullable<typeof openApiDocument.paths>;
type Schemas = NonNullable<Components['schemas']>;
type SecuritySchemes = NonNullable<Components['securitySchemes']>;

const authSchema = await auth.api.generateOpenAPISchema();

// We authenticate with cookie sessions (no bearer plugin), but better-auth's
// generator hardcodes `bearerAuth` on every protected operation. Rewrite those
// references to a cookie scheme so the reference matches how auth actually works.
// Pull the cookie name from the live config so it stays correct if it changes.
const sessionCookieName = (await auth.$context).authCookies.sessionToken.name;

const authPaths = Object.fromEntries(
  Object.entries(authSchema.paths ?? {}).map(([route, item]) => {
    for (const operation of Object.values(item as Record<string, unknown>)) {
      if (operation && typeof operation === 'object' && 'security' in operation) {
        (operation as { security: unknown }).security = [{ cookieAuth: [] }];
      }
    }
    return [`/auth${route}`, item];
  })
) as Paths;

openApiDocument.paths = { ...openApiDocument.paths, ...authPaths };
openApiDocument.components = {
  ...openApiDocument.components,
  schemas: {
    ...openApiDocument.components?.schemas,
    ...(authSchema.components?.schemas as Schemas),
  },
  // Protected auth operations are guarded by the better-auth session cookie;
  // declare that scheme (replacing better-auth's hardcoded bearerAuth) so the
  // reference shows the real credential.
  securitySchemes: {
    ...openApiDocument.components?.securitySchemes,
    cookieAuth: {
      type: 'apiKey',
      in: 'cookie',
      name: sessionCookieName,
      description: 'Session cookie set by better-auth on sign-in.',
    },
  } as SecuritySchemes,
};

export const openApiSpec: ReturnType<OpenApiGeneratorV31['generateDocument']> = openApiDocument;
