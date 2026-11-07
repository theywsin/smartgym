-- Payments are immutable except for the refunded total.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smartgym_app') THEN
    REVOKE UPDATE ON "payment" FROM smartgym_app;
    GRANT UPDATE ("refunded_amount_rial") ON "payment" TO smartgym_app;
  END IF;
END $$;
