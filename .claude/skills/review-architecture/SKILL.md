---
name: review-architecture
description: Reviews changed code the way a staff engineer would, covering boundaries and dependency direction, the design decision behind the change, contracts and types, correctness, error handling, naming, tests, and documentation. Every finding names the principle behind it so the author learns the rule, not just the fix. Use when the user asks for a code review, an architecture review, a second pair of eyes on a diff, branch, or pull request, or feedback on whether an implementation fits the project's patterns.
argument-hint: "[path, branch, or nothing for the working tree]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - "Bash(git diff:*)"
  - "Bash(git status:*)"
  - "Bash(git log:*)"
  - "Bash(git show:*)"
---

# Architecture review

Review the code as a staff engineer who has to maintain it for years. The goal is
two things at once: a better diff, and an author who understands why it is better.

Report findings only. Do not edit files unless the user asks for the fix.

## Step 1: Fix the scope

- Argument given: review that path, branch, or pull request.
- No argument: review the working tree with `git status` and `git diff HEAD`. If it
  is clean, review the branch against `develop` with `git diff develop...HEAD`.

State what you are reviewing in one line before you start.

## Step 2: Ground yourself before judging

A review that does not know the surrounding pattern is noise. Before forming an
opinion:

1. Read the docs page covering the touched area under `apps/docs/content/docs/`.
   Architecture, data model, authorization, outbox, and testing each define rules
   this project has already decided on. Those decisions are the baseline.
2. Read the two or three closest existing files: the sibling controller, the
   neighbouring component, the equivalent hook in another view. Consistency with
   what is already there beats your preferred style.
3. Read the whole file a change sits in, not only the hunk. Most real findings live
   in what the diff does **not** show.

## Step 3: Review in passes

Run these lenses in order. Early passes catch problems that make later ones moot.

**Boundaries and dependency direction**
Does the change respect `apps/` depending on `packages/` and never the reverse?
Does `@ordre/db` stay inside `apps/api`? Does `@ordre/core` stay free of React and
Drizzle? Is logic sitting in the layer that owns it, or has business logic leaked
into a controller, a route, or a component?

**The design decision**
Is this the right shape, or a working shape? Name the alternative the author did not
take and say why the chosen one is or is not better here. Watch for abstractions
invented for one caller, and for duplication that is about to become a third copy.

**Contracts and types**
Are the schemas in `@ordre/core` the single source for both sides of the wire? Any
`any`, unchecked cast, or type that permits a state the domain forbids? Could the
type make the invalid case unrepresentable instead of the code checking for it?

**Correctness and edge cases**
Empty, null, zero, one, many. Concurrency and races. Partial failure halfway through
a multi-step operation. What happens on the second call, or the retried one?

**Errors and failure modes**
Does every failure map to a catalog `ErrorCode` rather than an ad hoc string? Is the
status right? Does the caller get enough to act on without leaking internals? Are
errors swallowed anywhere?

**Naming and readability**
Does the name say what the thing is, in the vocabulary the rest of the codebase
uses? Would a reader understand the file without the diff for context?

**Tests**
Is the case in the right tier (integration for anything reachable through a real
request, unit only for fault injection that a real database cannot produce)? Do the
tests assert behaviour rather than the classes a variant emits? What would still
pass if the change were reverted?

**Comments, JSDoc, and docs**
Check each comment against four tests, in order:

1. **Does the first sentence say what the thing is or does?** A fragment, an
   aphorism, or a label-plus-colon opener is a finding on its own.
2. **Is every factual claim verified?** A statement about a library, an endpoint,
   a status code, or a runtime behaviour has to be checkable in the source. Open
   the dependency and confirm it. An unverifiable claim stated confidently is the
   most expensive kind of comment, because it survives review on tone.
3. **Is the register plain?** Metaphor, rhetorical inversion, and phrasing chosen
   for rhythm all belong in the chat, not the file.
4. **Is it carrying more than one "why"?** Rejected alternatives and trade-off
   reasoning are conversation, not documentation.

Then: do comments describe the code as it stands, with no trace of what it
replaced? Does anything reusable lack an `@example`? Which docs page is now stale?

**Performance, where it matters**
Query counts and N+1 shapes, work repeated per render, bundle weight crossing into
a client component. Ignore micro-optimisation.

## Step 4: Rank what you found

| Severity      | Meaning                                                              |
| ------------- | -------------------------------------------------------------------- |
| **Blocker**   | Wrong behaviour, broken boundary, or a bug that reaches production   |
| **Should fix**| Real debt: it will cost someone later, and it is cheap to fix now    |
| **Consider**  | A defensible alternative worth weighing, not a defect                |
| **Teach**     | The code is fine; here is the pattern or principle underneath it     |

Drop anything you cannot justify at one of these levels. A long review is not a
better review.

## Step 5: Write it up

```markdown
## Reviewing <scope>

<One paragraph: what the change does, and whether the shape is right.>

### What works well
<One to three specific things, with the reason they are right.>

### Blocker: <title>
`path/to/file.ts:42`
**What:** <the defect, in one or two sentences.>
**Why it matters:** <the concrete consequence.>
**Principle:** <the rule this is an instance of.>
**Suggestion:** <the smallest change that fixes it.>

### Should fix: <title>
...

### Consider: <title>
...

### Worth knowing
<The concept behind the most interesting finding, explained properly: what the
pattern is called, why it exists, and where else in this repo it shows up.>

### Docs
<Pages under apps/docs that this change makes stale, or "nothing to update".>
```

## Rules

- Cite `file.ts:line` for every finding. A finding without a location is an opinion.
- Every finding names the principle behind it. The author is here to learn the rule.
- Say what is good, specifically. A review that only lists faults teaches nothing
  about what to repeat.
- Never invent a project convention. If the docs and the code disagree, say so and
  let the author decide which one is wrong.
- Do not rewrite the change. Suggest the smallest edit that resolves the finding.
- If the diff is genuinely clean, say so and stop.
