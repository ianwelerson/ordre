import { createRequire } from "node:module";
import { dirname, join } from "node:path";

// Resolve the actual package directory (bypass package exports) and load the
// built `dist/blocks.js` bundle which contains the named exports Storybook
// expects when importing `@storybook/addon-docs/blocks`.
const require = createRequire(import.meta.url);
const pkgJsonPath = require.resolve("@storybook/addon-docs/package.json");
const pkgDir = dirname(pkgJsonPath);
const blocks = require(join(pkgDir, "dist/blocks.js"));

export const {
  Meta,
  Docs,
  AnchorMdx,
  HeadersMdx,
  CodeOrSourceMdx,
  ColorItem,
  ColorPalette,
  Typeset,
} = blocks;

export default blocks;
