export default {
  customTypes: {
    enginesNode: {
      path: "engines.node",
      strategy: "version",
    },
  },
  versionGroups: [
    {
      label: "Node engine pinned to >=24 across workspace",
      dependencies: ["**"],
      dependencyTypes: ["enginesNode"],
      pinVersion: ">=24",
    },
  ],
};
