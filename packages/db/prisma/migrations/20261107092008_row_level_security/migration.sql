-- Row-level security for tenant-owned tables (docs/ARCHITECTURE.md ADR-3).
--
-- The application connects as a NON-owner role (default name: smartgym_app), so these
-- policies apply to it. Migrations run as the owner role, which bypasses RLS.
-- Each request sets, inside its transaction:
--   app.gym_id      the active gym (tenant context)
--   app.user_id     the signed-in user (for "my gyms" lookups)
--   app.bypass_rls  'on' only for audited platform/system operations
-- RLS is a second line of defence: services also filter by gym id explicitly.

CREATE FUNCTION app_current_gym() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('app.gym_id', true), '')::uuid $$;

CREATE FUNCTION app_current_user() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('app.user_id', true), '')::uuid $$;

CREATE FUNCTION app_bypass_rls() RETURNS boolean LANGUAGE sql STABLE AS
$$ SELECT coalesce(current_setting('app.bypass_rls', true), '') = 'on' $$;

CREATE FUNCTION app_gym_allowed(g uuid) RETURNS boolean LANGUAGE sql STABLE AS
$$ SELECT app_bypass_rls() OR (g IS NOT NULL AND g = app_current_gym()) $$;

-- gym_membership: visible in the active gym, or to the user it belongs to.
ALTER TABLE "gym_membership" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "gym_membership"
  USING (app_gym_allowed(gym_id) OR user_id = app_current_user())
  WITH CHECK (app_gym_allowed(gym_id));

-- gym: the active gym, or gyms the current user belongs to.
ALTER TABLE "gym" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "gym"
  USING (
    app_gym_allowed(id)
    OR id IN (SELECT gm.gym_id FROM "gym_membership" gm
              WHERE gm.user_id = app_current_user() AND gm.status <> 'DISABLED')
  )
  WITH CHECK (app_gym_allowed(id));

-- Plain gym-scoped tables.
ALTER TABLE "branch" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "branch" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));

ALTER TABLE "branch_staff" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "branch_staff" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));

ALTER TABLE "gym_setting" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "gym_setting" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));

ALTER TABLE "gym_subscription" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "gym_subscription" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));

ALTER TABLE "file_asset" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "file_asset" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));

-- role: system roles (gym_id IS NULL) are readable by everyone; custom roles per gym.
ALTER TABLE "role" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "role"
  USING (gym_id IS NULL OR app_gym_allowed(gym_id))
  WITH CHECK (app_bypass_rls() OR (gym_id IS NOT NULL AND gym_id = app_current_gym()));

-- audit_log: append-only; gym rows visible only inside that gym, platform rows only to system context.
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_read ON "audit_log" FOR SELECT
  USING (app_bypass_rls() OR (gym_id IS NOT NULL AND gym_id = app_current_gym()));
CREATE POLICY audit_insert ON "audit_log" FOR INSERT
  WITH CHECK (app_bypass_rls() OR gym_id IS NULL OR gym_id = app_current_gym());

-- Grants for the runtime role, when it exists (create it once per environment:
--   CREATE ROLE smartgym_app LOGIN PASSWORD '...';).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smartgym_app') THEN
    GRANT USAGE ON SCHEMA public TO smartgym_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO smartgym_app;
    REVOKE UPDATE, DELETE ON "audit_log" FROM smartgym_app;
    IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
      REVOKE ALL ON "_prisma_migrations" FROM smartgym_app;
    END IF;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO smartgym_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO smartgym_app;
  END IF;
END $$;
