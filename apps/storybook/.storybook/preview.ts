import type { Preview } from "@storybook/react";

import "./global.css";

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        method: "alphabetical",
        order: [
          "Introduction",
          "Design Tokens",
          ["Introduction"],
          "Components",
          ["Introduction"],
        ],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      values: [{ name: "Dark", value: "#333" }],
      default: "Dark",
    },
  },
};

export default preview;
