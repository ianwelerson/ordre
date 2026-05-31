import { createMDX } from 'fumadocs-mdx/next';

import type { NextConfig } from 'next';

const withMDX = createMDX();

const config: NextConfig = {
  reactStrictMode: true,
  // Served behind portless on a custom host in dev (docs.ordre.localhost).
  // Allow that origin to reach the dev server's /_next assets and HMR socket,
  // otherwise styles and hot reload fail with cross-origin errors.
  allowedDevOrigins: ['docs.ordre.localhost'],
};

export default withMDX(config);
