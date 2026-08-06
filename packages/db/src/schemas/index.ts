// Auth tables come from the generated artifact; their relations are hand-owned
// in `./auth.ts`. We export the tables here but NOT `better-auth.ts`'s generated
// relations, so the Drizzle client only sees the relations from `./auth.ts`.
export { account, session, user, verification } from './better-auth.ts';
export * from './auth.ts';

// Workspace
export * from './workspace.ts';

// Billing
export * from './billing.ts';

// Outbox
export * from './outbox.ts';
