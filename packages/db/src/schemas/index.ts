// Auth tables come from the generated artifact; their relations are hand-owned
// in `./auth.ts`. We export the tables here but NOT `better-auth.ts`'s generated
// relations, so the Drizzle client only sees the relations from `./auth.ts`.
export { account, session, user, verification } from './better-auth.ts';

export * from './auth.ts';
export * from './workspace.ts';
export * from './billing.ts';
export * from './outbox.ts';
export * from './feature.ts';
