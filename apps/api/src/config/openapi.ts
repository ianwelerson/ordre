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
  // Declared at the document root so the docs generator (which groups pages by
  // tag) can resolve each operation's tag; an operation tagged with a name not
  // listed here is dropped from the generated reference.
  tags: [
    { name: 'Auth', description: 'Authentication and session endpoints (better-auth).' },
    { name: 'Workspace', description: 'Create, read, update, and delete workspaces.' },
    {
      name: 'Workspace Location',
      description: "Manage a workspace's locations, including the default location.",
    },
    {
      name: 'Workspace Member',
      description: "Manage a workspace's members - roles, profiles, removal, and self-service.",
    },
    {
      name: 'Workspace Invite',
      description: "Manage a workspace's member invites.",
    },
    { name: 'Health', description: 'Service health checks.' },
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

// HTTP methods that identify an operation object within a path item (the item
// can also hold non-operation keys like `parameters` or `summary`).
const HTTP_METHODS = new Set(['get', 'put', 'post', 'delete', 'patch', 'head', 'options', 'trace']);

const authPaths = Object.fromEntries(
  Object.entries(authSchema.paths ?? {}).map(([route, item]) => {
    for (const [method, operation] of Object.entries(item as Record<string, unknown>)) {
      if (!HTTP_METHODS.has(method) || !operation || typeof operation !== 'object') {
        continue;
      }

      const op = operation as { security?: unknown; tags?: string[]; operationId?: string };

      if ('security' in op) {
        op.security = [{ cookieAuth: [] }];
      }

      // better-auth tags every operation `Default`; group them under `Auth` so
      // the docs render a single, meaningfully named section.
      op.tags = ['Auth'];

      // The docs group by tag and name each page by operationId. better-auth
      // omits it on some operations, so synthesise a stable, unique one from the
      // method and route to keep every auth page flat (not falling back to a
      // nested route path).
      if (!op.operationId) {
        op.operationId = [
          method,
          ...route
            .split('/')
            .filter(Boolean)
            .map((s) => s.replace(/[{}]/g, '')),
        ].join('-');
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
