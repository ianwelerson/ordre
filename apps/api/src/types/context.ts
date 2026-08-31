import type { Locale, WorkspaceMemberRole } from '@ordre/core/enums';

/** The authenticated user attached to a request by the `authenticate` middleware. */
export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
}

/**
 * The workspace a request is scoped to, resolved from the route (`:id` or
 * `:slug`) and attached by the `requireWorkspaceAccess` middleware.
 *
 * This is the request's tenant scope, kept separate from {@link MemberContext}
 * on purpose: most handlers need to know *which workspace* they operate on
 * without caring *who* is calling, and taking only this context makes that
 * explicit in their signature. It's also where workspace-wide state (plan
 * entitlements, cached workspace fields) belongs as it's added.
 */
export interface WorkspaceContext {
  id: string;
  name: string;
}

/**
 * The caller's membership in the workspace the request is scoped to, attached by
 * the `requireWorkspaceAccess` middleware.
 *
 * Deliberately carries no `workspaceId` - that lives in {@link WorkspaceContext},
 * so the two can't drift and a handler that only needs the tenant scope never
 * receives the caller's identity.
 */
export interface MemberContext {
  id: string;
  role: WorkspaceMemberRole;
  /**
   * The language this membership reads in, used to render any message the caller
   * produces for someone else - an invite is the case that matters, since the
   * recipient has no membership of their own to read yet.
   */
  locale: Locale;
}
