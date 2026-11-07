-- CreateEnum
CREATE TYPE "OnlinePaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "online_payment_request" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "branch_id" UUID,
    "member_id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "amount_rial" BIGINT NOT NULL,
    "res_num" TEXT NOT NULL,
    "gateway" TEXT NOT NULL DEFAULT 'saman',
    "token" TEXT,
    "status" "OnlinePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "ref_num" TEXT,
    "rrn" TEXT,
    "card_mask" TEXT,
    "failure_reason" TEXT,
    "payment_id" UUID,
    "created_by_user_id" UUID,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settled_at" TIMESTAMPTZ(3),

    CONSTRAINT "online_payment_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "online_payment_request_res_num_key" ON "online_payment_request"("res_num");

-- CreateIndex
CREATE UNIQUE INDEX "online_payment_request_ref_num_key" ON "online_payment_request"("ref_num");

-- CreateIndex
CREATE UNIQUE INDEX "online_payment_request_payment_id_key" ON "online_payment_request"("payment_id");

-- CreateIndex
CREATE INDEX "online_payment_request_gym_id_created_at_idx" ON "online_payment_request"("gym_id", "created_at");

-- CreateIndex
CREATE INDEX "online_payment_request_subscription_id_idx" ON "online_payment_request"("subscription_id");

-- AddForeignKey
ALTER TABLE "online_payment_request" ADD CONSTRAINT "online_payment_request_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ───────── Hand-written additions ─────────
ALTER TABLE "online_payment_request"
  ADD CONSTRAINT "online_payment_amount_chk" CHECK ("amount_rial" >= 10000),
  ADD CONSTRAINT "online_payment_paid_chk" CHECK ("status" <> 'PAID' OR ("payment_id" IS NOT NULL AND "ref_num" IS NOT NULL));

ALTER TABLE "online_payment_request" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "online_payment_request" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smartgym_app') THEN
    GRANT SELECT, INSERT, UPDATE ON "online_payment_request" TO smartgym_app;
    REVOKE DELETE ON "online_payment_request" FROM smartgym_app;
  END IF;
END $$;
