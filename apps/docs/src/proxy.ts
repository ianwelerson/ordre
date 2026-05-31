import { isMarkdownPreferred } from 'fumadocs-core/negotiation';

import { NextRequest, NextResponse } from 'next/server';

import { docsContentRoute, docsRoute } from '@/lib/shared';

// Expose the raw markdown of a guide page when:
//   - the URL ends with `.md` (e.g. `/internal-docs/architecture.md`), or
//   - the client prefers markdown via the `Accept` header.
// Both rewrite to the markdown handler at `docsContentRoute`, keyed by the
// page slug (the `docsRoute` prefix is stripped).
function markdownTarget(pathname: string, request: NextRequest) {
  if (pathname !== docsRoute && !pathname.startsWith(`${docsRoute}/`)) {
    return NextResponse.next();
  }

  const slugPath = pathname.slice(docsRoute.length); // '' for the index, '/architecture', ...
  return NextResponse.rewrite(
    new URL(`${docsContentRoute}${slugPath}/content.md`, request.nextUrl)
  );
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.endsWith('.md')) {
    return markdownTarget(pathname.slice(0, -'.md'.length), request);
  }

  // Only negotiate markdown for extension-less doc routes.
  const hasExtension = /\.[^/]+$/.test(pathname);
  if (!hasExtension && isMarkdownPreferred(request)) {
    return markdownTarget(pathname, request);
  }

  return NextResponse.next();
}

export const config = {
  // Only run on the guide docs routes.
  matcher: ['/internal-docs', '/internal-docs/:path*'],
};
