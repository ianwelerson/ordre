import type { StorybookConfig } from "@storybook/react-vite";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import remarkGfm from "remark-gfm";
import { mergeConfig } from "vite";

import tailwindcss from "@tailwindcss/postcss";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
const require = createRequire(import.meta.url);

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../../cockpit/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../../../packages/ui/src/**/*.mdx",
    "../../../packages/ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    {
      name: "@storybook/addon-docs",
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
  async viteFinal(config) {
    // Make sure Vite can resolve addon-docs subpath imports that appear in
    // MDX files inside other workspace packages (monorepo). Some Storybook
    // entrypoints are export-subpaths that Vite/Rollup can't resolve when
    // bundling cross-package imports; adding an alias to the actual file
    // location fixes the issue.
    // Resolve the installed package directory and point the alias directly
    // at the built `dist/blocks.js` file so Vite can import the exact module
    // without using package-subpath imports blocked by `exports`.
    const pkgJson = require.resolve("@storybook/addon-docs/package.json");
    const pkgDir = dirname(pkgJson);
    const docsBlocksPath = join(pkgDir, "dist", "blocks.js");

    return mergeConfig(config, {
      resolve: {
        alias: [
          { find: "@storybook/addon-docs/blocks", replacement: docsBlocksPath },
        ],
        dedupe: ["react", "react-dom"],
      },
      optimizeDeps: {
        include: ["@storybook/addon-docs", "@storybook/addon-docs/blocks"],
      },
      css: {
        postcss: {
          plugins: [tailwindcss()],
        },
      },
      esbuild: {
        // Ensure React is in scope when any classic JSX slips through
        jsxInject: "import React from 'react'",
      },
    });
  },
};
export default config;
