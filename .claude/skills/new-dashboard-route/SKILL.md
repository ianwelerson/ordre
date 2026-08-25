---
name: new-dashboard-route
description: Scaffolds a route in the dashboard app following the Login pattern, covering the path constant in @ordre/core, the route file that re-exports a view, the view split into ui and model, copy in both locales, and the proxy gate that decides whether the route is public. Use when the user asks to add, create, or scaffold a page, screen, or route in the dashboard, or a new view under apps/dashboard.
argument-hint: "[RouteName] [auth|authenticated]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - "Bash(git status:*)"
---

# New dashboard route

A dashboard route is never one file. Login is the reference: a path constant, a
route file, a view split into `ui/` and `model/`, copy in two locales, and an
entry in the proxy gate.

This covers `apps/dashboard` only. The board and marketing apps route
differently.

## Step 1: Settle the shell and the visibility

Two route groups, neither of which emits a URL segment:

| Group | Shell | For |
| ----- | ----- | --- |
| `(auth)` | `SiteShell` with a header and a centred card | Screens reached without a session |
| `(authenticated)` | The app itself | Everything behind a session |

Then answer separately: **can a visitor without a session reach this?** The group
is presentation, the proxy is the gate, and they are wired in different files. A
route placed in `(auth)` but left out of `PUBLIC_ROUTES` bounces to login forever.

Read [`src/proxy.ts`](../../../apps/dashboard/src/proxy.ts) before deciding. Note
what it says about itself: it picks a shell, it is not a security boundary. The
API authenticates every request and row-level security does the real work.

## Step 2: Declare the path once

Add it to `DASHBOARD_ROUTES` in
[`packages/core/src/constants/routes.ts`](../../../packages/core/src/constants/routes.ts).
Paths only, never an origin, because the shape of a route is the same in every
environment while its host is not.

A dynamic segment gets both a base constant and a builder, so the prefix stays
matchable by the proxy:

```ts
const DASHBOARD_INVITE_BASE = '/invite';

invite: (token: string) => `${DASHBOARD_INVITE_BASE}/${token}`,
```

Never write the literal path anywhere else. The whole point of this file is that
`/invite/${token}` is spelled once, for the app's own links and for the ones the
API mails out.

## Step 3: Build the view

```
src/views/<Name>/
├── index.ts                    export { default as <Name>Page } from './ui/<Name>Page';
├── ui/<Name>Page.tsx           'use client', markup, default export
└── model/                      only when there is logic
    ├── schema.ts               the form contract
    └── use<Name>Form.ts        the behaviour
```

A view with no logic skips `model/` entirely, the way `GetStarted` does. A view
with logic splits, so a screen's behaviour can be read without its markup.

**The schema** builds on `@ordre/core/schemas` and carries **no messages**. The
shared Zod error map turns every issue into a translation key. Say why in a JSDoc
when the form's rule deliberately differs from core's, the way `Login` relaxes
`min(8)` because that is the sign-up policy and login has no business restating it.

**The hook** uses `useAppForm` from `@ordre/ui/form`: pass the schema, the `t`
from `useTranslations()`, and `defaultValues`. Wrap the submit with `form.submit`
so a thrown `ServiceError` lands on the form, and return the form plus `onSubmit`.
Call the API through `services` from `@/shared/services`, never `createServices`.

**The page** reads `useTranslations('<Name>')`, spreads `field('name')` onto the
`@ordre/ui` controls, renders `rootError` in an `Alert`, and drives the submit
button from `isBusy`.

## Step 4: Wire the route file

```tsx
// src/app/(auth)/<segment>/page.tsx
import { <Name>Page } from '@/views/<Name>';

export default <Name>Page;
```

Two lines. No logic, no `'use client'`, no markup. The route file exists to point
at a view.

## Step 5: Copy, in both locales

Add a namespace matching the view name to
[`messages/en.ts`](../../../apps/dashboard/src/shared/i18n/messages/en.ts) **and**
[`messages/pt.ts`](../../../apps/dashboard/src/shared/i18n/messages/pt.ts). The two
files mirror each other key for key.

Words already in `@ordre/core/messages` (error copy, validation copy, shared
product words) are merged in at runtime, so never restate one here. No literal
user-facing string in JSX.

## Step 6: Wire the gate and the chrome

**Public route:** add it to `PUBLIC_ROUTES` in `src/proxy.ts`. If a signed-in
visitor should still be allowed to see it rather than bounced, add it to
`SESSION_TOLERANT_ROUTES` too, and say in a comment why the page has something to
tell them that the gate cannot.

**Auth header:** if the screen needs the cross-link in the header, add an entry to
`HEADER_CTA` in [`(auth)/HeaderCta.tsx`](<../../../apps/dashboard/src/app/(auth)/HeaderCta.tsx>)
and the matching `AuthHeader.<key>` copy in both locales.

**Query params:** a param the page reads gets its name and allowed values in
[`src/shared/constants.ts`](../../../apps/dashboard/src/shared/constants.ts), and
is validated on read. The query string belongs to the visitor, so an edited value
renders nothing rather than a broken key. `resolveNotice` in `LoginPage` is the
pattern.

**Tests:** `src/proxy.test.ts` covers the gate. Changing `PUBLIC_ROUTES` or
`SESSION_TOLERANT_ROUTES` means adding the case there. Views currently carry no
tests of their own, so do not invent one unless the model layer holds logic worth
pinning, and say so if you add the first.

## Step 7: Verify

```bash
pnpm --filter dashboard check-types
pnpm --filter dashboard lint
pnpm --filter dashboard test:unit:ci
```

## Step 8: Report

Explain in the chat what the route does, why it sits in the group it does, whether
it is public and what that means for the gate, and which existing view it was
modelled on. Then name the docs page that needs updating, or say nothing does.

## Checklist

```
- [ ] DASHBOARD_ROUTES entry in @ordre/core
- [ ] src/app/(<group>)/<segment>/page.tsx re-exporting the view
- [ ] src/views/<Name>/index.ts
- [ ] src/views/<Name>/ui/<Name>Page.tsx
- [ ] src/views/<Name>/model/ (only if there is logic)
- [ ] messages/en.ts
- [ ] messages/pt.ts
- [ ] proxy.ts PUBLIC_ROUTES (public routes only)
- [ ] proxy.test.ts (only if the route lists changed)
- [ ] HeaderCta HEADER_CTA (only if the header needs the link)
```

## Rules

- The path is declared once, in `@ordre/core`. A literal path in a component is a
  defect.
- Copy lands in both locales in the same change. One locale is a broken build
  waiting to happen.
- The proxy picks a shell. It is not the thing that keeps data safe, and a comment
  claiming otherwise is wrong.
- Follow the closest existing view rather than a general Next.js habit. Login for a
  form, Invite for a multi-state screen, GetStarted for a static one.
- If the screen is a variation of one that exists, say so before building a second
  one. `set-password` serves two flows through a `source` param rather than
  splitting into two routes.
