CREATE TABLE "feature" (
	"key" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Feature switch privileges
--
-- `feature` carries no row-level security, because the sign-in and sign-up checks
-- read it before a caller is known. Its privileges are therefore the only thing
-- scoping the table, and the API reads it and nothing else: the reader in
-- `apps/api/src/services/feature.ts` only ever selects.
--
-- `ordre_app` is left with SELECT. Writing a switch is an owner-role operation -
-- the seed connects with `DATABASE_OWNER_URL` (see `packages/db/src/seed.ts`), and
-- opening or closing a switch by hand is a statement run as the owner.
--
-- Guarded on the role existing, matching `0003_grants.sql`, because `ordre_app` is
-- provisioned outside migrations - see the Database Roles page.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ordre_app') THEN
    REVOKE INSERT, UPDATE, DELETE ON "feature" FROM ordre_app;
  END IF;
END $$;
