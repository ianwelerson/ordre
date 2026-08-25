---
name: review-security
description: Reviews code for security defects by threat modelling the change first, then auditing it against the OWASP Top 10 2025 and the specific risks of this stack, which are Better Auth sessions, Postgres row-level security, RBAC guards, Zod validation at the edge, credentialed CORS, the proxy chain, the transactional outbox, and secret handling. Reports exploitable findings with a concrete attack path, severity, and a fix. Use when the user asks for a security review, a threat model, an audit, or whether an endpoint, auth flow, permission check, or data access path is safe.
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

# Security review

Review the change as an attacker would read it, then explain the defence as an
engineer would build it. Findings must be exploitable, not theoretical.

Report findings only. Do not edit files unless the user asks for the fix.

## Step 1: Fix the scope

- Argument given: review that path, branch, or pull request.
- No argument: review the working tree with `git status` and `git diff HEAD`. If it
  is clean, review the branch against `develop` with `git diff develop...HEAD`.

## Step 2: Ground yourself in how this system defends itself

Read before judging, or you will report defences that already exist:

- `apps/docs/content/docs/engineering/authorization/rbac.mdx` for the permission
  catalog, the role map, and the two guards.
- `apps/docs/content/docs/engineering/authorization/row-level-security.mdx` for the
  per-request database identity and the policies.
- `apps/api/src/adapters/express/server.ts` and `middlewares/` for the request
  pipeline: helmet, credentialed CORS, the trusted proxy depth, client IP, session
  authentication, RLS context, permission guards, quota.
- `apps/api/src/config/auth.ts` for the Better Auth configuration.

## Step 3: Threat model the change

Before checking anything off a list, answer these four questions in writing:

1. **What new surface does this expose?** New route, new field, new query, new file
   read, new outbound call, new dependency.
2. **Who can reach it?** Unauthenticated, any signed-in user, a workspace member, an
   admin, an owner. Then assume the caller is one tier lower than intended.
3. **What is the worst thing they can do with it?** Read another workspace's data,
   escalate a role, forge a session, poison an email, exhaust a resource.
4. **What stops them today?** Name the specific guard, policy, or schema. If you
   cannot name it, that is the finding.

## Step 4: Audit against the checklist

Work through [reference/threat-checklist.md](reference/threat-checklist.md), which
maps the OWASP Top 10 2025 onto this stack. Skip categories the change cannot
touch, and say which ones you skipped.

The categories that bite hardest in this codebase, in order:

- **Broken access control.** A route without a permission guard, a guard checking a
  role instead of a permission, a database read that bypasses the RLS transaction,
  an object id trusted from the request body, an invite token compared without care.
- **Authentication failures.** Session cookie flags and lifetime, token entropy and
  expiry, password reset and invite flows that can be replayed or enumerated,
  verification that can be skipped.
- **Injection.** Any raw SQL fragment built from input, any HTML or email template
  interpolating user text, any redirect target read from a query parameter.
- **Security misconfiguration.** CORS origins, helmet defaults that were relaxed,
  the trusted proxy depth against the real deployment, environments where a guard is
  disabled, stack traces or internal codes in a response body.
- **Mishandling of exceptional conditions.** A `catch` that swallows a failed
  authorization check, an error path that returns success, a transaction that leaves
  state half written, a timeout that fails open.

## Step 5: Rank by exploitability

| Severity     | Meaning                                                                    |
| ------------ | --------------------------------------------------------------------------- |
| **Critical** | Reachable by an unauthenticated or wrong-tenant caller, with real impact    |
| **High**     | Reachable by a signed-in user outside their permission, or leaks secrets    |
| **Medium**   | Needs an unlikely precondition, or weakens a control without breaking it    |
| **Low**      | Hardening: defence in depth, better defaults, reduced blast radius          |

A finding with no attack path is not a finding. Say "no issue found here" instead.

## Step 6: Write it up

```markdown
## Security review of <scope>

### Threat model
**Surface:** <what the change exposes.>
**Reachable by:** <the lowest tier of caller that can hit it.>
**Worst case:** <the concrete impact.>
**Current defences:** <the named guards and policies.>

### Critical: <title>
`path/to/file.ts:42`
**Attack path:** <the concrete steps an attacker takes, in order.>
**Impact:** <what they get.>
**Fix:** <the specific change, and where it belongs in the pipeline.>
**Why here:** <the principle, for example validate at the edge, authorize at the
resource, isolate at the database.>

### High / Medium / Low: <title>
...

### Checked and clean
<Categories audited with nothing to report, so the author knows the coverage.>

### Docs
<Pages under apps/docs that should record a new control, or "nothing to update".>
```

## Rules

- Verify before claiming. Read the guard, the policy, or the schema and confirm it
  is missing. A false positive costs more trust than a missed low-severity finding.
- Defence in depth is a recommendation, not a defect. Rank it Low and say so.
- Never write a working exploit. Describe the path in enough detail to reproduce the
  reasoning, not to run the attack.
- Point at the layer that should own the fix. Validation belongs at the edge,
  authorization at the resource, isolation at the database. A fix in the wrong layer
  is a finding of its own.
- Check dependencies added by the change: what it pulls in, whether it is
  maintained, and whether a smaller standard-library answer exists.
- Never print secrets, tokens, or connection strings you find. Name the file and the
  line, and stop there.
