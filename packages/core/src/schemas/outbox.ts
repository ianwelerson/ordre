import { z } from 'zod';

import { DEFAULT_LOCALE, LOCALES } from '../enums/locale.ts';
import {
  OUTBOX_VARIABLES,
  type OutboxChannel,
  type OutboxTopic,
  type OutboxVariable,
} from '../enums/outbox.ts';
import { WORKSPACE_MEMBER_ROLES } from '../enums/workspace.ts';
import type { EmailDelivery, OutboxDelivery } from '../types/outbox.ts';

/**
 * The schema one variable is validated with, chosen by the suffix in its name.
 *
 * The naming convention is `<subject>_<attribute>`, and the attribute already
 * says what the value is, so it can say how to check it too. Without this every
 * variable was `z.string().min(1)`, which let a malformed URL through validation
 * and into a live message as a broken link - the failure the payload registry
 * exists to prevent.
 */
// `protocol` restricts the scheme: `new URL()` alone accepts `javascript:` and
// `data:`, and every `_url` variable is rendered into an email `href`.
const URL_SCHEMA = z.url({ protocol: /^https?$/ });
const EMAIL_SCHEMA = z.email();
const ROLE_SCHEMA = z.enum(WORKSPACE_MEMBER_ROLES);
const TEXT_SCHEMA = z.string().min(1);

const schemaFor = (variable: OutboxVariable) => {
  if (variable.endsWith('_url')) {
    return URL_SCHEMA;
  }

  if (variable.endsWith('_email')) {
    return EMAIL_SCHEMA;
  }

  if (variable.endsWith('_role')) {
    return ROLE_SCHEMA;
  }

  return TEXT_SCHEMA;
};

/**
 * The same choice at the type level, so `invited_role` infers as the role union
 * rather than widening to the union of every branch's return.
 */
type SchemaFor<K extends OutboxVariable> = K extends `${string}_url`
  ? typeof URL_SCHEMA
  : K extends `${string}_email`
    ? typeof EMAIL_SCHEMA
    : K extends `${string}_role`
      ? typeof ROLE_SCHEMA
      : typeof TEXT_SCHEMA;

/**
 * The whole variable vocabulary as a schema, so each template can `.pick` the
 * subset it renders. Built from `OUTBOX_VARIABLES` to keep the enum the single
 * source of truth - the cast just re-states what `Object.fromEntries` erases.
 */
const OutboxVariablesSchema = z.object(
  Object.fromEntries(OUTBOX_VARIABLES.map((variable) => [variable, schemaFor(variable)])) as {
    [K in OutboxVariable]: SchemaFor<K>;
  }
);

/**
 * The locale the message renders in, on every payload.
 *
 * `.catch` rather than `.default`: it covers an unrecognised locale as well as a
 * missing one, so a queued row naming a locale this build does not have falls
 * back to {@link DEFAULT_LOCALE} rather than failing validation in the channel
 * service, consuming all five attempts and dead-lettering a deliverable message.
 */
const OutboxLocaleSchema = z.enum(LOCALES).catch(DEFAULT_LOCALE);

/** Narrows a `<channel>:<topic>` string to a declared delivery. */
const isOutboxDelivery = (value: string): value is OutboxDelivery => {
  return value in OUTBOX_PAYLOAD_SCHEMAS;
};

/**
 * Narrows a `<channel>:<topic>` string to a delivery the email channel carries.
 *
 * The channel half has to be checked as well as the pair being declared, because a
 * topic no longer implies every channel: `contact:sync` is a real topic with no
 * email template behind it.
 */
export const isEmailDelivery = (value: string): value is EmailDelivery => {
  return isOutboxDelivery(value) && value.startsWith('email:');
};

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
    locale: OutboxLocaleSchema,
    variables: OutboxVariablesSchema.pick({
      user_name: true,
      user_email: true,
      dashboard_login_url: true,
      help_url: true,
      privacy_url: true,
    }),
  }),
  'email:account:verify-email': z.object({
    to: z.email(),
    locale: OutboxLocaleSchema,
    variables: OutboxVariablesSchema.pick({
      user_email: true,
      verify_url: true,
      help_url: true,
      privacy_url: true,
    }),
  }),
  'email:account:reset-password': z.object({
    to: z.email(),
    locale: OutboxLocaleSchema,
    variables: OutboxVariablesSchema.pick({
      user_email: true,
      reset_url: true,
      help_url: true,
      privacy_url: true,
    }),
  }),
  'email:workspace:created': z.object({
    to: z.email(),
    locale: OutboxLocaleSchema,
    variables: OutboxVariablesSchema.pick({
      workspace_name: true,
      workspace_industry: true,
      workspace_plan: true,
      owner_email: true,
      dashboard_url: true,
      help_url: true,
      privacy_url: true,
    }),
  }),
  'email:invite:created': z.object({
    to: z.email(),
    locale: OutboxLocaleSchema,
    variables: OutboxVariablesSchema.pick({
      workspace_name: true,
      inviter_name: true,
      invitee_email: true,
      invited_role: true,
      invite_url: true,
      help_url: true,
      privacy_url: true,
    }),
  }),
} as const satisfies Partial<Record<`${OutboxChannel}:${OutboxTopic}`, z.ZodType>>;
