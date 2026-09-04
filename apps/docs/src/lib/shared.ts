export const appName = 'Ordre Docs';

// Guide documentation lives under /internal-docs, the API reference under /api-docs.
// The root (/) redirects to the guides.
export const docsRoute = '/internal-docs';
export const apiDocsRoute = '/api-docs';

// The generated error catalog. It lives in the guides tree because the API
// reference directory is wiped and regenerated from the OpenAPI spec on every
// build, but an API consumer looks for it beside the endpoints.
export const errorCodesRoute = '/internal-docs/architecture/reference/error-codes';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

/**
 * The OpenAPI document, served straight from `public/`.
 *
 * It is the same file the API reference is generated from, so anything that
 * downloads it gets exactly what the pages describe.
 */
export const openApiSpecRoute = '/openapi.json';

/** Filename offered when the spec is downloaded, rather than the bare route name. */
export const openApiSpecFilename = 'ordre-openapi.json';
