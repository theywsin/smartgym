-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD_POS', 'TRANSFER', 'ONLINE');

-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('INCOME', 'REFUND', 'EXPENSE');

-- CreateTable
CREATE TABLE "payment" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "branch_id" UUID,
    "member_id" UUID,
    "subscription_id" UUID,
    "amount_rial" BIGINT NOT NULL,
    "refunded_amount_rial" BIGINT NOT NULL DEFAULT 0,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "received_by_user_id" UUID,
    "idempotency_key" TEXT,
    "paid_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entry" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "branch_id" UUID,
    "type" "LedgerType" NOT NULL,
    "amount_rial" BIGINT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "member_id" UUID,
    "payment_id" UUID,
    "description" TEXT,
    "created_by_user_id" UUID,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_gym_id_paid_at_idx" ON "payment"("gym_id", "paid_at");

-- CreateIndex
CREATE INDEX "payment_subscription_id_idx" ON "payment"("subscription_id");

-- CreateIndex
CREATE INDEX "payment_member_id_idx" ON "payment"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_gym_id_idempotency_key_key" ON "payment"("gym_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "ledger_entry_gym_id_occurred_at_idx" ON "ledger_entry"("gym_id", "occurred_at");

-- CreateIndex
CREATE INDEX "ledger_entry_gym_id_branch_id_occurred_at_idx" ON "ledger_entry"("gym_id", "branch_id", "occurred_at");

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "member_subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ───────── Hand-written additions ─────────
ALTER TABLE "payment"
  ADD CONSTRAINT "payment_amount_chk" CHECK ("amount_rial" > 0),
  ADD CONSTRAINT "payment_refund_chk" CHECK ("refunded_amount_rial" >= 0 AND "refunded_amount_rial" <= "amount_rial");
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_sign_chk" CHECK (
  ("type" = 'INCOME' AND "amount_rial" > 0) OR ("type" IN ('REFUND', 'EXPENSE') AND "amount_rial" < 0));

ALTER TABLE "payment" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "payment" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));
ALTER TABLE "ledger_entry" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "ledger_entry" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smartgym_app') THEN
    GRANT SELECT, INSERT, UPDATE ON "payment" TO smartgym_app;
    REVOKE DELETE ON "payment" FROM smartgym_app;
    GRANT SELECT, INSERT ON "ledger_entry" TO smartgym_app;
    REVOKE UPDATE, DELETE ON "ledger_entry" FROM smartgym_app;
  END IF;
END $$;
