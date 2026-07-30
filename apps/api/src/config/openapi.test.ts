import { openApiSpec } from './openapi.ts';

/** Every operation object across every path in the generated document. */
const operations = () =>
  Object.values(openApiSpec.paths ?? {}).flatMap((item) =>
    Object.entries(item as Record<string, unknown>)
      .filter(([method]) => ['get', 'put', 'post', 'delete', 'patch'].includes(method))
      .map(([, op]) => op as { tags?: string[]; security?: unknown[]; operationId?: string })
  );

describe('config/openapi', () => {
  it('generates a 3.1.0 document with the app metadata', () => {
    expect(openApiSpec.openapi).toBe('3.1.0');
    expect(openApiSpec.info.title).toBe('Ordre API');
  });

  it('registers the app controllers and folds in better-auth paths under /auth', () => {
    const paths = Object.keys(openApiSpec.paths ?? {});

    // A workspace controller path (registered via glob import).
    expect(paths.some((p) => p.startsWith('/workspace'))).toBe(true);
    // better-auth paths are re-mounted under /auth.
    expect(paths.some((p) => p.startsWith('/auth/'))).toBe(true);
  });

  it('re-tags every folded auth operation as Auth and gives it an operationId', () => {
    const authOps = Object.entries(openApiSpec.paths ?? {})
      .filter(([route]) => route.startsWith('/auth/'))
      .flatMap(([, item]) =>
        Object.entries(item as Record<string, unknown>)
          .filter(([method]) => ['get', 'post'].includes(method))
          .map(([, op]) => op as { tags?: string[]; operationId?: string })
      );

    expect(authOps.length).toBeGreaterThan(0);
    for (const op of authOps) {
      expect(op.tags).toEqual(['Auth']);
      expect(typeof op.operationId).toBe('string');
      expect(op.operationId).not.toBe('');
    }
  });

  it('rewrites protected auth operations onto the cookie scheme', () => {
    const cookieAuth = openApiSpec.components?.securitySchemes?.cookieAuth;
    expect(cookieAuth).toMatchObject({ type: 'apiKey', in: 'cookie' });

    // No operation should still reference better-auth's hardcoded bearerAuth.
    const usesBearer = operations().some((op) =>
      (op.security ?? []).some(
        (req) => req !== null && typeof req === 'object' && 'bearerAuth' in req
      )
    );
    expect(usesBearer).toBe(false);
  });
});
