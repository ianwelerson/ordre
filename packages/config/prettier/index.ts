const config = {
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  trailingComma: "es5",
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  printWidth: 100,
  importOrder: [
    "^(.*).css$",
    "^next.*|^react.*|^(?!@ordre|@|.).*$",
    "^@ordre/(.*)",
    "^@/(components|stores|locale|router|views)",
    "^@/",
    "^[./]",
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderCaseInsensitive: true,
};

export default config;
