-- Expenses are immutable except for the void fields (repeats the grant for databases migrated before it was fixed in place).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smartgym_app') THEN
    REVOKE UPDATE ON "expense" FROM smartgym_app;
    GRANT UPDATE ("voided_at", "voided_by_user_id", "void_reason") ON "expense" TO smartgym_app;
  END IF;
END $$;
