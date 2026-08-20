import { z } from 'zod';

import {
  OUTBOX_VARIABLES,
  type OutboxChannel,
  type OutboxTopic,
  type OutboxVariable,
} from '../enums/outbox.ts';

/**
 * The whole variable vocabulary as a schema, so each template can `.pick` the
 * subset it renders. Built from `OUTBOX_VARIABLES` to keep the enum the single
 * source of truth - the cast just re-states what `Object.fromEntries` erases.
 */
const OutboxVariablesSchema = z.object(
  Object.fromEntries(OUTBOX_VARIABLES.map((variable) => [variable, z.string().min(1)])) as {
    [K in OutboxVariable]: z.ZodString;
  }
);

/**
 * Every deliverable thing, keyed `<channel>:<topic>` - the registry that decides
 * which events a channel can actually deliver, and what each needs to render.
 *
 * Payloads are self-contained by design: the worker runs with no user context and
 * (under RLS) cannot read tenant tables, so everything is denormalized into the row
 * at write time. Nothing is optional, because a missing variable is a bug rather
 * than a default and the failure mode is an email that delivers *successfully* with
 * a blank link.
 *
 * Keyed rather than a discriminated union because the payload does not carry its
 * own key - the row's `channel` and `topic` columns name it at send time.
 *
 * `Partial<Record<...>>` is the deliberate half of the constraint: keys have to be
 * a real channel and a real topic, but a channel need not cover every event.
 */
export const OUTBOX_PAYLOAD_SCHEMAS = {
  'email:account:created': z.object({
    to: z.email(),
    variables: OutboxVariablesSchema.pick({
      user_name: true,
      user_email: true,
      base_url: true,
      dashboard_url: true,
      dashboard_login_url: true,
      help_url: true,
      privacy_url: true,
    }),
  }),
  'email:account:verify-email': z.object({
    to: z.email(),
    variables: OutboxVariablesSchema.pick({
      user_email: true,
      verify_url: true,
      base_url: true,
      help_url: true,
      privacy_url: true,
    }),
  }),
  'email:account:reset-password': z.object({
    to: z.email(),
    variables: OutboxVariablesSchema.pick({
      user_email: true,
      reset_url: true,
      base_url: true,
      help_url: true,
      privacy_url: true,
    }),
  }),
  'email:workspace:created': z.object({
    to: z.email(),
    variables: OutboxVariablesSchema.pick({
      workspace_name: true,
      workspace_industry: true,
      workspace_plan: true,
      owner_email: true,
      base_url: true,
      dashboard_url: true,
      dashboard_login_url: true,
      help_url: true,
      privacy_url: true,
    }),
  }),
  'email:invite:created': z.object({
    to: z.email(),
    variables: OutboxVariablesSchema.pick({
      workspace_name: true,
      invitee_name: true,
      invitee_email: true,
      invited_name: true,
      invited_email: true,
      invited_role: true,
      invite_url: true,
      base_url: true,
      dashboard_url: true,
      dashboard_login_url: true,
      help_url: true,
      privacy_url: true,
    }),
  }),
} as const satisfies Partial<Record<`${OutboxChannel}:${OutboxTopic}`, z.ZodType>>;
