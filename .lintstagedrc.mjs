export default {
  "*.{js,ts,tsx}": () => ["pnpm lint", "pnpm format:check"],
  "*.{ts,tsx}": () => "pnpm check-types",
  "package.json": () => "pnpm packages:lint",
  "apps/api/**": () => [
    "pnpm api:docs:generate",
    "git add apps/api-docs/openapi/openapi.json",
  ],
};
