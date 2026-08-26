CREATE TYPE "public"."locale" AS ENUM('en', 'pt');--> statement-breakpoint
ALTER TABLE "workspace_member" ADD COLUMN "locale" "locale" DEFAULT 'en' NOT NULL;