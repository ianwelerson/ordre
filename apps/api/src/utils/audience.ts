import { type DbHandle } from '#/config/db-context.ts';
import { and, eq, sql } from 'drizzle-orm';

import type { AudienceSegment, WorkspaceMemberRole } from '@ordre/core/enums';
import * as schema from '@ordre/db/schemas';

type MemberAudienceRow = {
  email: string;
  first_name: string;
  last_name: string;
  is_owner: boolean;
  is_member: boolean;
};

/**
 * The segments a user belongs to right now, from their active memberships.
 *
 * `all-accounts` is unconditional: a contact only exists here because an account
 * does, and it is the segment a broadcast to everybody targets, since Resend
 * requires one.
 *
 * Reads the caller's own rows, which `member_select` allows across every workspace
 * through its `user_id = app_current_user_id()` clause.
 *
 * @param transaction - The handle that wrote the membership change, so the list
 *   reflects it. Passing the request handle instead reads pre-change state.
 */
export const audienceSegmentsForSelf = async (
  transaction: DbHandle,
  userId: string
): Promise<AudienceSegment[]> => {
  const rows = await transaction
    .select({ role: schema.workspaceMember.role })
    .from(schema.workspaceMember)
    .where(
      and(eq(schema.workspaceMember.userId, userId), eq(schema.workspaceMember.status, 'active'))
    );

  return [
    'all-accounts',
    ...(rows.some(({ role }: { role: WorkspaceMemberRole }) => role === 'owner')
      ? (['workspace-owner'] as const)
      : []),
    ...(rows.some(({ role }: { role: WorkspaceMemberRole }) => role !== 'owner')
      ? (['workspace-member'] as const)
      : []),
  ];
};

/**
 * The contact state for a member the caller is acting on, read through
 * `app_member_audience_state` because RLS hides the target's other workspaces.
 *
 * @param memberId - The member being acted on, not the caller.
 * @returns The target's contact details and segments, or null when the function
 *   returned nothing: no such member, or the caller may not act on them.
 */
export const audienceStateForMember = async (transaction: DbHandle, memberId: string) => {
  const result = await transaction.execute<MemberAudienceRow>(
    sql`SELECT * FROM app_member_audience_state(${memberId})`
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    segments: [
      'all-accounts',
      ...(row.is_owner ? (['workspace-owner'] as const) : []),
      ...(row.is_member ? (['workspace-member'] as const) : []),
    ] satisfies AudienceSegment[],
  };
};
