---
name: new-component
description: Scaffolds a component in the @ordre/ui design system, covering the component file with its cva variants and typed props, the behaviour test, the Storybook story, and the explicit export line in the package index. Use when the user asks to add, create, or scaffold a UI component, a design-system primitive, a form field, or a new entry in packages/ui.
argument-hint: "[ComponentName] [primitives|form|surfaces|shell]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - "Bash(git status:*)"
---

# New component

A component in `@ordre/ui` is four edits, not one file. Missing any of them is a
review blocker, and the missing story is the one people forget.

## Step 1: Settle the name and the group

The group decides both the folder and the Storybook title, and the two must agree.

| Group | Folder | Storybook title | Holds |
| ----- | ------ | --------------- | ----- |
| Primitives | `components/<Name>/` | `Components/Primitives/<Name>` | Standalone atoms |
| Form | `components/Form/` | `Components/Form/<Name>` | Anything bound to a form field |
| Surfaces | `components/<Name>/` | `Components/Surfaces/<Name>` | Containers that hold other content |
| Shell | `components/SiteShell/` | `Components/Shell/<Name>` | App and site chrome |

Form and Shell components live **flat** inside their shared folder. Everything
else gets its own directory named after the component.

Before writing anything, read the closest existing component in the same group and
match it. Variant naming, prop shape, and test style should look like siblings, not
like a new dialect.

## Step 2: Write the four pieces

Copy this checklist and work it:

```
- [ ] <Name>.tsx          component + variants + exported props type
- [ ] <Name>.test.tsx     behaviour tests
- [ ] <Name>.stories.tsx  Storybook entry
- [ ] index.ts            one explicit export line, in the right group
```

### The component

- Arrow function, named export, props type exported beside it.
- Variants go through `cva`. Colour pairings that only make sense together belong
  in `compoundVariants`, not in the consumer's hands.
- Props extend the underlying element: `Omit<ComponentPropsWithRef<'span'>, 'className' | 'children'> & VariantProps<typeof variants> & { ... }`.
- Spread `...rest` onto the element, and put `className` last in the `variants()`
  call so a consumer can still override.
- Give the root a `data-testid` matching the lowercased component name.
- Tokens only. No raw hex, no arbitrary pixel values where a token exists.
- One JSDoc above the component saying what the thing **is** and when to reach for
  it, not how it is built.

### The test

Assert behaviour, never the classes a variant emits. A `cva` output is an
implementation detail and asserting it makes every restyle a test failure.

Worth asserting: what renders, the accessible name and role, what is hidden from
the accessibility tree, that `...rest` reaches the element, that a consumer
`className` survives, and any state the component owns.

### The story

- `title` exactly as the table above.
- `tags: ['autodocs']`, `parameters: { layout: 'centered' }`.
- `argTypes` for every variant so the controls panel is usable.
- A JSDoc above each story explaining what that story is showing.
- If a variant is invisible on the default canvas, stage it on a surface, the way
  `Chip.stories.tsx` does for its `outline` appearance.

### The index entry

`packages/ui/src/components/index.ts` takes one line per export, value and type
together, filed under the group heading that matches the Storybook title.
`export *` is banned there, so widening the surface stays a deliberate edit.

## Step 3: Verify

```bash
pnpm --filter @ordre/ui test:unit:ci
pnpm --filter @ordre/ui check-types
pnpm --filter @ordre/ui lint
```

## Step 4: Report

Explain in the chat what the component is, why the variant axes are split the way
they are, and which existing component it was modelled on. Then say whether
[Brand](../../../apps/docs/content/docs/design/brand.mdx) needs a new pattern
recorded, or that nothing needs updating.

## Rules

- Four pieces or it is not done. A component without a story does not ship.
- Never invent a token. If the design needs a value the token files do not have,
  stop and raise it rather than reaching for a literal.
- Prefer a native element over an ARIA reconstruction of one.
- If an existing component already covers the case with one more variant, say so
  instead of adding a second component.
