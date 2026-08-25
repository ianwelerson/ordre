---
name: review-interface
description: Reviews interface code as an accessibility and interaction design specialist, covering semantics, keyboard and focus behaviour, accessible names, WCAG 2.2 AA conformance including contrast, APCA as advisory judgment, responsive behaviour and reflow, motion, form and error patterns, component state coverage, and fidelity to the Ordre design tokens. Use when the user asks for a UI review, a design review, an accessibility or a11y check, a WCAG or APCA audit, responsive or RWD feedback, or a second look at a component, screen, or form.
argument-hint: "[component path, view path, or nothing for the working tree]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - "Bash(git diff:*)"
  - "Bash(git status:*)"
  - "Bash(git log:*)"
  - "Bash(git show:*)"
---

# Interface review

Review the interface as someone who has shipped design systems and watched real
people fail to use them. Accessibility, responsive behaviour, and interaction
quality are one review, not three, because they break for the same reasons.

Report findings only. Do not edit files unless the user asks for the fix.

## Step 1: Fix the scope

- Argument given: review that component, view, or path.
- No argument: review the working tree with `git status` and `git diff HEAD`. If it
  is clean, review the branch against `develop` with `git diff develop...HEAD`.

## Step 2: Ground yourself in the system

Read before judging, or you will recommend something the system already decided:

- `apps/docs/content/docs/design/brand.mdx` for the palette, surface tiers,
  typography rules, spacing, radius, and the component patterns.
- `packages/ui/src/styles/tokens/*.mdx` for the token namespaces as they actually
  exist: colours, typography, spacing, radius, shadows, motion, breakpoints,
  containers.
- The two or three closest components in `packages/ui/src/components/`. Variant
  naming, `data-testid` conventions, and how state is expressed should match.

## Step 3: Review in passes

**Semantics and structure**
The right element before the right attribute: a `button` for an action, an `a` for
navigation, a real `label` bound to its control, a landmark for each region, one
`h1` per page with no skipped levels. A `div` with a click handler is a finding.

**Keyboard and focus**
Every interactive element reachable and operable by keyboard, in an order that
matches the visual one. No traps. A visible focus indicator with at least 3:1
contrast against what surrounds it. Focus moved deliberately when a drawer, dialog,
or menu opens, restored to the trigger when it closes, and never left on a hidden
element. Focused elements not covered by sticky headers or footers.

**Accessible names and roles**
Every control has a name a screen reader can announce. Icon-only buttons carry a
label, not a tooltip. Decorative elements are hidden from the accessibility tree.
State that is visual (selected, expanded, busy, invalid) is also programmatic.
Live regions announce what changes without moving focus.

**Contrast**
WCAG 2.2 AA is the bar: 4.5:1 for body text, 3:1 for large text, 3:1 for interface
components and meaningful graphics. Check text on the tinted washes and on the
tonal surface tiers, disabled states, placeholder text, and any colour applied over
a variant background. See [reference/wcag-checklist.md](reference/wcag-checklist.md)
for the thresholds and the APCA note.

**Responsive behaviour**
Content reflows to 320 CSS pixels wide without a second scroll axis. Text survives
200 percent zoom and the text-spacing overrides. Layout is driven by the breakpoint
tokens rather than invented widths, and a component that breaks at its own width
gets its own named breakpoint. Touch targets are at least 24 by 24 CSS pixels, and
comfortably larger for anything primary.

**Motion**
Animation respects a reduced-motion preference. Nothing moves, blinks, or
auto-advances for longer than a few seconds without a way to stop it. Transitions
use the motion tokens rather than ad hoc durations.

**Forms and errors**
Labels are visible and persistent, not placeholders doing double duty. Required and
optional are stated, not implied. Errors identify the field, say what is wrong, and
suggest the fix, in text as well as colour. Errors are announced, and focus moves to
the first invalid field on submit. Autocomplete attributes are set on personal
fields. Nothing requires the user to retype something they already entered in the
same flow, and no step depends on solving a puzzle or transcribing a code by hand.

**States and edge content**
Loading, empty, error, disabled, and busy each have a designed state. Long strings,
long names, and translated copy that runs longer than English do not break the
layout. Every user-facing string comes from `@ordre/core/messages`, never a literal.

**Design system fidelity**
Colours, spacing, radius, shadows, and type come from tokens. Variants go through
`class-variance-authority` rather than conditional class strings. A component in
`@ordre/ui` ships a colocated `.stories.tsx` and `.test.tsx`, and is exported from
`components/index.ts` on its own line.

## Step 4: Rank what you found

| Severity      | Meaning                                                                |
| ------------- | ----------------------------------------------------------------------- |
| **Blocker**   | Fails WCAG 2.2 AA, or a user cannot complete the task by keyboard      |
| **Should fix**| Works, but degrades badly on a real device, at zoom, or with a reader  |
| **Consider**  | An interaction or visual choice worth weighing against the alternative |
| **Teach**     | The code is right; here is the guideline or pattern underneath it      |

Name the success criterion by number for anything at Blocker or Should fix.

## Step 5: Write it up

```markdown
## Interface review of <scope>

<One paragraph: what this renders, and whether the interaction shape is right.>

### What works well
<One to three specific things, with the reason they are right.>

### Blocker: <title>
`path/to/Component.tsx:42`
**Criterion:** <for example 1.4.3 Contrast (Minimum), Level AA.>
**What happens:** <who fails, doing what, on which device or assistive technology.>
**Fix:** <the specific change.>
**Principle:** <the rule this is an instance of.>

### Should fix / Consider: <title>
...

### Worth knowing
<The concept behind the most interesting finding, explained properly.>

### Docs and stories
<Brand or token pages that should record a new pattern, and missing Storybook
coverage, or "nothing to update".>
```

## Rules

- Cite `file.tsx:line` for every finding, and the success criterion where one applies.
- Reason from the code and the tokens. When a contrast ratio matters, compute it
  from the actual hex values rather than guessing, and show the number.
- WCAG 2.2 Level AA is the conformance bar. APCA is advisory judgment for cases
  where the 2.x formula is known to be unreliable, and it never justifies shipping
  something that fails 1.4.3.
- Prefer a native element over an ARIA reconstruction of one, every time.
- Do not redesign the component. Suggest the smallest change that resolves the
  finding and keeps it inside the design system.
- If the interface is genuinely clean, say so and stop.
