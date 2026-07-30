import { z } from 'zod';

import {
  WorkspaceCreateSchema,
  WorkspaceInviteCreateSchema,
  WorkspaceInvitePreviewSchema,
  WorkspaceInviteSchema,
  WorkspaceLocationBaseSchema,
  WorkspaceLocationCreateSchema,
  WorkspaceLocationMemberRemoveSchema,
  WorkspaceLocationSchema,
  WorkspaceLocationUpdateSchema,
  WorkspaceMemberBaseSchema,
  WorkspaceMemberRemoveSchema,
  WorkspaceMemberRoleUpdateSchema,
  WorkspaceMemberSchema,
  WorkspaceMemberUpdateSchema,
  WorkspaceSchema,
  WorkspaceSummarySchema,
  WorkspaceUpdateSchema,
} from './../schemas/index.ts';

/** --- Workspace --- */
export type Workspace = z.infer<typeof WorkspaceSchema>;
export type WorkspaceCreate = z.infer<typeof WorkspaceCreateSchema>;
export type WorkspaceUpdate = z.infer<typeof WorkspaceUpdateSchema>;
// A minimal workspace projection for listing the workspaces a user belongs to.
export type WorkspaceSummary = z.infer<typeof WorkspaceSummarySchema>;

/** --- Workspace Member --- */
export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>;
export type WorkspaceMemberUpdate = z.infer<typeof WorkspaceMemberUpdateSchema>;
export type WorkspaceMemberRemove = z.infer<typeof WorkspaceMemberRemoveSchema>;
export type WorkspaceMemberRoleUpdate = z.infer<typeof WorkspaceMemberRoleUpdateSchema>;
// A workspace member's own columns, with no embedded relations (used for embeds)
export type WorkspaceMemberBase = z.infer<typeof WorkspaceMemberBaseSchema>;

/** --- Workspace Location --- */
export type WorkspaceLocation = z.infer<typeof WorkspaceLocationSchema>;
export type WorkspaceLocationCreate = z.infer<typeof WorkspaceLocationCreateSchema>;
export type WorkspaceLocationUpdate = z.infer<typeof WorkspaceLocationUpdateSchema>;
export type WorkspaceLocationMemberRemove = z.infer<typeof WorkspaceLocationMemberRemoveSchema>;
// A workspace location's own columns, with no embedded relations (used for embeds).
export type WorkspaceLocationBase = z.infer<typeof WorkspaceLocationBaseSchema>;

/** --- Workspace Invite --- */
export type WorkspaceInvite = z.infer<typeof WorkspaceInviteSchema>;
export type WorkspaceInviteCreate = z.infer<typeof WorkspaceInviteCreateSchema>;
export type WorkspaceInvitePreview = z.infer<typeof WorkspaceInvitePreviewSchema>;
