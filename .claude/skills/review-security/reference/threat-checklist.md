# Threat checklist

The OWASP Top 10 2025 mapped onto this stack, plus the checks that only make sense
here. Work the categories the change actually touches.

## Contents

- A01 Broken access control
- A02 Security misconfiguration
- A03 Software supply chain failures
- A04 Cryptographic failures
- A05 Injection
- A06 Insecure design
- A07 Authentication failures
- A08 Software or data integrity failures
- A09 Security logging and alerting failures
- A10 Mishandling of exceptional conditions
- Stack specific: row-level security
- Stack specific: the transactional outbox
- Stack specific: the frontend apps

## A01 Broken access control

Server-side request forgery now lives in this category too.

- Every route that touches workspace data passes through the workspace access and
  permission guards, in that order, before the controller runs.
- Guards check a **permission**, never a role name. A role is a bundle of
  permissions and can be re-bundled; a permission is the contract.
- Object ids arriving in a path, query, or body are authorized against the caller,
  not just parsed. Owning a valid UUID is not proof of access.
- List endpoints filter by tenant in the query, not in the response mapping.
- Relation-level shaping: a caller who may read an entity is not automatically
  allowed to read every relation hanging off it.
- Invite, reset, and verification tokens are single use, expiring, and bound to the
  address they were issued for.
- Any URL the server fetches is built from a fixed allowlist, never from input.

## A02 Security misconfiguration

- `helmet()` is on and its defaults are not relaxed without a reason recorded in
  the code.
- CORS allows only the explicit app origins, and `credentials: true` never pairs
  with a reflected or wildcard origin.
- `trust proxy` matches the real number of hops in front of the service. Too high
  lets a caller spoof their client IP; too low breaks IP-based controls.
- Error responses carry a catalog code and safe copy, never a stack trace, driver
  message, or SQL fragment.
- No control is disabled outside tests, and any test-only branch is guarded by an
  explicit stage check that cannot be true in production.
- Environment variables are validated at boot, so a missing secret fails loudly
  instead of defaulting to something permissive.

## A03 Software supply chain failures

- A new dependency is justified: what it does that the standard library or an
  existing dependency does not.
- It is maintained, widely used, and small enough to read.
- The lockfile is committed and the change does not loosen a version range.
- Install scripts and transitive additions are worth a look when the tree grows.
- Nothing in a build step fetches code from the network at runtime.

## A04 Cryptographic failures

- Passwords go through the auth library's hashing, never a hand-rolled path.
- Tokens come from a cryptographically secure source with enough entropy to resist
  guessing, and are compared in constant time where the comparison is a secret.
- Secrets come from the environment, never a literal, a default, or a test fixture
  that ships.
- Sensitive fields are not logged, cached, or returned in a list response.
- Transport is HTTPS everywhere, including the local hostnames.

## A05 Injection

- Drizzle query builders are parameterized. Any raw SQL fragment built by string
  concatenation from input is a finding.
- Email templates and any HTML rendering escape interpolated values.
- Redirect targets are validated against an allowlist of known app paths, never
  taken from a query parameter as given.
- Values that reach a shell, a file path, or a header are validated first.
- Zod schemas from `@ordre/core` validate at the edge, and the parsed value is what
  the controller uses. Reading the raw body after parsing defeats the check.

## A06 Insecure design

- The flow has a failure mode that is safe: denied by default, never allowed by
  default.
- Rate limits and quotas exist wherever a caller can drive cost: authentication,
  invites, email, uploads.
- Enumeration is considered: does a wrong email and a right email produce different
  status codes, response times, or copy?
- The multi-step flows (invite, reset, verification) cannot be reordered, replayed,
  or completed by a different account than the one that started them.

## A07 Authentication failures

- Session cookies are `httpOnly`, `secure`, and use the narrowest `sameSite` the
  cross-origin setup allows.
- Session lifetime and refresh behaviour are deliberate, and sign-out invalidates
  server side, not only in the browser.
- Password reset invalidates existing sessions, and the reset token dies on use.
- Credential endpoints are rate limited per address and per IP.
- Account linking and email change cannot be used to take over an existing account.

## A08 Software or data integrity failures

- Anything deserialized from an untrusted source is schema validated first.
- Webhook and callback payloads are signature verified before they are trusted.
- Migrations are reviewed for data loss and for the window where old and new code
  both run.

## A09 Security logging and alerting failures

- Authentication failures, permission denials, and quota rejections are logged with
  enough context to investigate.
- Logs never carry passwords, tokens, session ids, or full personal records.
- A log line records who, what, and which tenant, so an incident can be traced.

## A10 Mishandling of exceptional conditions

- No `catch` swallows a failed authorization or validation check.
- An error path never returns a success status or a partially populated success body.
- A transaction either commits fully or rolls back. Nothing writes outside it and
  assumes the commit succeeded.
- Timeouts, retries, and circuit breakers fail closed on anything security relevant.
- An unexpected database state maps to an explicit catalog error rather than falling
  through to a generic success.

## Stack specific: row-level security

- Every request that reads tenant data runs inside the transaction that sets the
  per-request identity. A query outside that transaction runs without policies.
- `SET LOCAL` is used so the identity dies with the transaction.
- The privileged database role is used only where the design requires it, and each
  such use is deliberate and narrow.
- Work that happens after the commit does not assume the identity is still set.
- New tables carry policies from the start. A table without a policy is open.

## Stack specific: the transactional outbox

- The row is written in the same transaction as the state change it announces.
- Template variables are escaped, and no user-controlled value reaches a header, a
  recipient list, or a link target unvalidated.
- Retry and dead-letter limits exist, so a poisoned row cannot loop forever.
- The worker claims rows atomically, so two instances cannot send the same message.

## Stack specific: the frontend apps

- No secret reaches a `NEXT_PUBLIC_` variable or a client bundle.
- Authorization decisions are made on the server. Hiding a button is presentation,
  not a control.
- `dangerouslySetInnerHTML` and equivalents are absent, or the input is sanitized.
- Session cookies are sent with `credentials: 'include'` only to the known API
  origin.
- Tokens are not persisted in `localStorage` where a script can read them.
