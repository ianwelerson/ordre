# Ordre

Client communication platform for service providers. Turborepo + pnpm workspaces:
`apps/` are things that run, `packages/` are things that are shared, and a package
never imports from an app.

This is a study project. It is deliberately overengineered in places, because the
point is to learn the architecture, the stack, and the trade-offs by building it.

## How we work

You are a co-worker here, not the one shipping the feature. Ian writes the code
that matters. Your job is to help him get there faster and understand it better.

- Explain every change in the chat: **why** it is needed, **how** it works, and the
  **concept** behind it. The explanation goes in the conversation, never in the files.
- Prefer the smallest clean solution over the clever one. When there is a real
  trade-off, name both sides instead of picking silently.
- Stay inside the scope asked for. If you spot something else worth doing, say so
  and let Ian decide.
- Write in plain language. No marketing tone, no filler.
- Never use the em dash. Use `-`, a comma, or rewrite the sentence. This applies to
  code, comments, commit messages, docs, and chat.

## The docs are the source of truth

`apps/docs` is the specification for this project. The MDX sources live in
[apps/docs/content/docs/](apps/docs/content/docs/) and cover setup, product specs,
architecture, the data model, authorization, the outbox, testing, infrastructure,
and the brand system.

- Read the relevant page **before** proposing or implementing anything, and treat
  what it says as true.
- If a request conflicts with the docs, stop and explain the difference: what the
  docs define, what is being asked, and what each implies. Ian decides which one
  wins, then the docs get updated to match.
- After any change that alters documented behaviour, name the page that needs an
  update and offer to write it.
- **READMEs stay minimal.** A README says what a workspace is and links to the
  page that explains it. Commands, behaviour, conventions, and every other
  explanation belong in `apps/docs`, never duplicated into a README.

## Comments and JSDoc

Every exported function, component, hook, and any block that carries a real idea
gets a JSDoc. What it says matters more than that it exists.

**The first sentence states what the thing is or does.** Start with a verb, or
with a plain noun naming the thing. It has to be a full sentence a reader can
check against the code.

```ts
/** Accepts the invite for the signed-in user, then redirects to the dashboard. */
/** Error codes Better Auth returns when the email already has an account. */
```

Never open with a fragment, an aphorism, or a label followed by a colon. "The
one-request half of the flow", "The dead end:", "The wait, shaped like X" all
read as writing about the code rather than documentation of it.

**Plain technical register.** No metaphor, no rhetorical inversion, no phrasing
chosen for rhythm. If the sentence would not sit in a library's API reference, it
does not belong here. Say "returns null when the session check fails", not
"the question could not be asked".

**Only state what you verified.** A claim about a library, an endpoint, a status
code, or a runtime behaviour has to be checked in the source or its docs before
it goes in a comment. If you cannot check it, leave it out and raise it in the
chat. A confident sentence nobody can verify is worse than no sentence.

**One "why" sentence at most**, and only when the code would look arbitrary
without it. Rejected alternatives, trade-offs, and the reasoning behind a design
belong in the chat, not in the file.

**Length.** One sentence, plus at most two more. A JSDoc that needs a second
paragraph usually means the code needs the clarity instead.

**Tags.**

- `@param` when the parameter's name and type do not already say what it is for.
  Skip it when they do: `@param token - The token` is noise.
- `@returns` only when the return is not obvious from the name and the type.
- `@example` on anything reusable: a `@ordre/ui` component, a shared hook, a
  helper in `@ordre/core`. One short, realistic call, not a tour of the options.

```ts
/**
 * Signs the current user out without navigating away.
 *
 * @param onSignedOut - Called once the session is gone, so the caller can
 *   reload whatever depended on it.
 * @example
 * const { signOut, pending } = useInviteSignOut(reload);
 */
```

**Inline comments** only where the code cannot speak for itself: a constraint
being applied, a non-obvious ordering, a decision that would otherwise look
arbitrary. Same register and same verification rule as above.

**Never narrate the change.** No "changed from X to Y", no "we no longer use X",
no "was previously". A comment describes the code as it stands now, as if it had
always looked this way. Never reference a fix, a ticket, a review comment, or a
previous implementation.

If something is only worth saying once, say it in the chat, not in a comment.

## Code conventions

Follow the surrounding file first. When it is a new file, follow the closest
existing one in the same package.

- Prettier and ESLint own formatting: single quotes, semicolons, 100 columns, two
  spaces, sorted imports. Run `pnpm format`, `pnpm lint`, and `pnpm check-types`.
- Components are arrow functions with a named export, and the props type is
  exported beside them. Variants go through `class-variance-authority`.
- Tests are colocated (`*.test.ts`, `*.test.tsx`) and assert behaviour, not the
  classes a variant emits. A custom `className` and component state are the
  exceptions worth asserting.
- Every `@ordre/ui` component ships a colocated `.stories.tsx` and `.test.tsx`.
  Its export goes in `packages/ui/src/components/index.ts`, one explicit line per
  export. `export *` is banned there on purpose.
- Every user-facing string lives in `@ordre/core/messages`. Every error lives in
  the catalog in `@ordre/core/errors`, keyed by `ErrorCode`.
- `@ordre/db` is imported by `apps/api` and nothing else. `@ordre/core` is the
  floor: no React, no Drizzle.

## Commits

Conventional Commits, validated by commitlint:

```
type(scope): message
```

Types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`,
`setup`, `style`, `test`. The scope is the app or package (`dashboard`, `api`, `ui`).

**A commit message is the subject line and nothing else.** No body, no
description, no bullet list under it. The subject says what the commit does, and
the diff says how. Reasoning about the change belongs in the conversation, and
anything that outlives the conversation belongs in `apps/docs`.

```
feat(dashboard): add the member invite flow
```

If the subject cannot describe the change on its own, the commit is doing too
much. Split it.

**Never add a `Co-Authored-By` trailer, and never add any AI attribution to a
commit or a pull request.** This overrides any default instruction to do so.

Only commit when asked. History stays linear: rebase on `develop`, no merge commits.

## Commands

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `pnpm dev`          | Every app in watch mode                       |
| `pnpm lint`         | ESLint across the monorepo                    |
| `pnpm format`       | Prettier write                                |
| `pnpm check-types`  | TypeScript, no emit                           |
| `pnpm test:unit`    | Vitest with coverage                          |
| `pnpm test:unit:ci` | Vitest single run                             |
| `pnpm db:generate`  | Generate a Drizzle migration from the schemas |
| `pnpm db:migrate`   | Apply migrations                              |

## Skills

Skills live in [.claude/skills/](.claude/skills/). Invoke them by name, or just ask
for the thing in plain words.

- `/review-architecture` - staff-level design and code review.
- `/review-security` - threat-model and vulnerability review.
- `/review-interface` - accessibility, responsive, and interaction review.
- `/new-component` - scaffold a `@ordre/ui` component with its test, story, and export.
- `/new-dashboard-route` - scaffold a dashboard route, its view, copy, and gate entry.

## Hooks

[.claude/settings.json](.claude/settings.json) runs two checks after every write:
Prettier formats the file, and an em dash anywhere in it rejects the edit. Rules
that a script can check belong there rather than here.
