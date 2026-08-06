/**
 * Single source for Drizzle-inferred types, so the same shapes aren't re-declared
 * in every controller/util. Value import (not `import type`): `$inferSelect` is
 * read via `typeof` on the table value.
 */
import type { ExtractTablesWithRelations } from 'drizzle-orm';

import * as schema from '@ordre/db/schemas';

export type WorkspaceRow = typeof schema.workspace.$inferSelect;
export type WorkspaceMemberRow = typeof schema.workspaceMember.$inferSelect;
export type WorkspaceMemberLocationRow = typeof schema.workspaceMemberLocation.$inferSelect;
export type WorkspaceLocationRow = typeof schema.workspaceLocation.$inferSelect;
export type WorkspaceInviteRow = typeof schema.workspaceInvite.$inferSelect;
export type WorkspaceSubscriptionRow = typeof schema.workspaceSubscription.$inferSelect;
export type PlanRow = typeof schema.plan.$inferSelect;
export type OutboxRow = typeof schema.outbox.$inferSelect;

/** The schema's relation map, for typing relational (`with`) query results via `BuildQueryResult`. */
export type Schema = ExtractTablesWithRelations<typeof schema>;
