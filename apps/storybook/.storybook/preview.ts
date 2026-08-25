import type { Preview } from "@storybook/react";

import "./global.css";

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        method: "alphabetical",
        // Groups run in the order named here and everything inside them alphabetically.
        // The component groups mirror `@ordre/ui`'s barrel, so a component's place in
        // the sidebar is decided in the same edit that adds it to the public API. They
        // are listed rather than sorted because alphabetical would open on Form.
        // The design system comes first, then what each app builds on top of it.
        order: [
          "Introduction",
          "Design Tokens",
          ["Introduction"],
          "Components",
          ["Primitives", "Form", "Surfaces", "Shell"],
          "Dashboard",
          ["Auth"],
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
