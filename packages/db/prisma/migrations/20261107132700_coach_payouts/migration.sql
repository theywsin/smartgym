-- CreateTable
CREATE TABLE "coach_payout" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "coach_user_id" UUID NOT NULL,
    "period_year" INTEGER NOT NULL,
    "period_month" INTEGER NOT NULL,
    "amount_rial" BIGINT NOT NULL,
    "expense_id" UUID NOT NULL,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coach_payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coach_payout_expense_id_key" ON "coach_payout"("expense_id");

-- CreateIndex
CREATE INDEX "coach_payout_gym_id_period_year_period_month_idx" ON "coach_payout"("gym_id", "period_year", "period_month");

-- AddForeignKey
ALTER TABLE "coach_payout" ADD CONSTRAINT "coach_payout_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ───────── Hand-written additions ─────────
ALTER TABLE "coach_payout"
  ADD CONSTRAINT "coach_payout_amount_chk" CHECK ("amount_rial" > 0),
  ADD CONSTRAINT "coach_payout_month_chk" CHECK ("period_month" BETWEEN 1 AND 12),
  ADD CONSTRAINT "coach_payout_expense_fkey" FOREIGN KEY ("expense_id") REFERENCES "expense"("id");

ALTER TABLE "coach_payout" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "coach_payout" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smartgym_app') THEN
    GRANT SELECT, INSERT ON "coach_payout" TO smartgym_app;
    REVOKE UPDATE, DELETE ON "coach_payout" FROM smartgym_app;
  END IF;
END $$;
