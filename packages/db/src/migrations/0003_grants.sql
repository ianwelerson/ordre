-- Function privileges
--
-- Postgres grants EXECUTE to PUBLIC on every function at creation. Every `app_*`
-- function in this schema is SECURITY DEFINER, so that default offers the owner's
-- privileges to any role that can reach the database. Narrowing it to `ordre_app`
-- keeps a role added here later - a reporting login, an analytics user - from being
-- able to call them at all.
--
-- This runs last because it can only act on functions that already exist, so it has
-- to follow both files that create them.
--
-- `ordre_app` is provisioned outside migrations (see the Database Roles page), so
-- every grant is guarded on the role existing. The revoke is not: removing PUBLIC's
-- access is correct whether or not the runtime role is there yet, and a database
-- that gets the role afterwards picks up its grants from the default privileges
-- below.

-- 1. Every `app_*` function that exists now. Discovered from the catalog rather than
--    listed, so a function added to an earlier migration is covered without anyone
--    remembering to add it here. `regprocedure` renders the argument types, which is
--    what REVOKE needs to identify an overload.
DO $$
DECLARE
  fn record;
  has_app_role boolean := EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ordre_app');
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname LIKE 'app\_%'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', fn.signature);

    IF has_app_role THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO ordre_app', fn.signature);
    END IF;
  END LOOP;
END $$;--> statement-breakpoint

-- 2. Every function a later migration creates, so the rule above does not have to be
--    remembered. Default privileges only cover objects made by the role that sets
--    them, and migrations run as the owner, so this names no role that differs
--    between local and Neon.
--
--    Neither statement is `IN SCHEMA public`, and both for the same reason.
--
--    PUBLIC's EXECUTE on a new function comes from a built-in default rather than a
--    stored per-schema entry, so only the unqualified revoke removes it: the
--    schema-qualified form has nothing to subtract and silently does nothing.
--
--    The grant has to match it, because a per-schema default privilege is dropped
--    with the schema it names while a database-wide one is not. Scoping the grant to
--    `public` and leaving the revoke global gives the two different lifetimes: after
--    a `DROP SCHEMA public CASCADE` the revoke survives and the grant does not, so
--    until this migration runs again every new function is callable by nobody. Both
--    are database-wide, so they live and die together.
DO $$
BEGIN
  ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ordre_app') THEN
    ALTER DEFAULT PRIVILEGES GRANT EXECUTE ON FUNCTIONS TO ordre_app;
  END IF;
END $$;
