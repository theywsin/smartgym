-- AlterTable
ALTER TABLE "ledger_entry" ADD COLUMN     "expense_id" UUID;

-- CreateTable
CREATE TABLE "expense_category" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "branch_id" UUID,
    "category_id" UUID NOT NULL,
    "amount_rial" BIGINT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "description" TEXT,
    "spent_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voided_at" TIMESTAMPTZ(3),
    "voided_by_user_id" UUID,
    "void_reason" TEXT,

    CONSTRAINT "expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expense_category_gym_id_name_key" ON "expense_category"("gym_id", "name");

-- CreateIndex
CREATE INDEX "expense_gym_id_spent_at_idx" ON "expense"("gym_id", "spent_at");

-- AddForeignKey
ALTER TABLE "expense_category" ADD CONSTRAINT "expense_category_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "expense_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ───────── Hand-written additions ─────────
ALTER TABLE "ledger_entry" DROP CONSTRAINT "ledger_sign_chk";
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_sign_chk" CHECK (
  ("type" IN ('INCOME', 'EXPENSE_VOID') AND "amount_rial" > 0) OR ("type" IN ('REFUND', 'EXPENSE') AND "amount_rial" < 0));
ALTER TABLE "expense" ADD CONSTRAINT "expense_amount_chk" CHECK ("amount_rial" > 0);
ALTER TABLE "expense" ADD CONSTRAINT "expense_void_chk" CHECK (("voided_at" IS NULL) = ("void_reason" IS NULL));

ALTER TABLE "expense_category" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "expense_category" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));
ALTER TABLE "expense" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "expense" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smartgym_app') THEN
    GRANT SELECT, INSERT, UPDATE ON "expense_category" TO smartgym_app;
    REVOKE DELETE ON "expense_category" FROM smartgym_app;
    GRANT SELECT, INSERT ON "expense" TO smartgym_app;
    REVOKE UPDATE ON "expense" FROM smartgym_app;
    GRANT UPDATE ("voided_at", "voided_by_user_id", "void_reason") ON "expense" TO smartgym_app;
    REVOKE DELETE ON "expense" FROM smartgym_app;
    REVOKE UPDATE, DELETE ON "ledger_entry" FROM smartgym_app;
  END IF;
END $$;
