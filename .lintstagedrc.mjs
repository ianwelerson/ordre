export default {
  "*.{js,ts,tsx}": () => ["pnpm lint", "pnpm format:check"],
  "*.{ts,tsx}": () => "pnpm check-types",
  "package.json": () => "pnpm packages:lint",
};
