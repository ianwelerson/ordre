# `@ordre/email`

The transactional email templates, written with [React Email](https://react.email)
and rendered by `apps/api` when the outbox worker delivers a row.

See [Transactional Outbox](https://github.com/ianwelerson/ordre/blob/main/apps/docs/content/docs/architecture/outbox.mdx)
for how a message is declared, produced, and sent, and
[The API Runtime](https://github.com/ianwelerson/ordre/blob/main/apps/docs/content/docs/architecture/runtime.mdx)
for why this is the only workspace with a build step.
