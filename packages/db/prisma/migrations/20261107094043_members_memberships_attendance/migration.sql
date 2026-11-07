-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "MemberSubscriptionStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CheckinMethod" AS ENUM ('MANUAL', 'QR');

-- CreateTable
CREATE TABLE "member" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "user_id" UUID,
    "home_branch_id" UUID,
    "code" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "gender" "Gender",
    "birth_date" DATE,
    "national_code" TEXT,
    "emergency_contact" JSONB,
    "notes" TEXT,
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "archived_at" TIMESTAMPTZ(3),

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_plan" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration_days" INTEGER NOT NULL,
    "price_amount_rial" BIGINT NOT NULL,
    "entry_limit" INTEGER,
    "allowed_branch_ids" UUID[] DEFAULT ARRAY[]::UUID[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "membership_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_subscription" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "branch_id" UUID,
    "status" "MemberSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "entry_limit" INTEGER,
    "entries_used" INTEGER NOT NULL DEFAULT 0,
    "allowed_branch_ids" UUID[] DEFAULT ARRAY[]::UUID[],
    "price_amount_rial" BIGINT NOT NULL,
    "discount_amount_rial" BIGINT NOT NULL DEFAULT 0,
    "suspended_at" TIMESTAMPTZ(3),
    "cancelled_at" TIMESTAMPTZ(3),
    "renewed_from_id" UUID,
    "note" TEXT,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "member_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "checked_in_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checked_out_at" TIMESTAMPTZ(3),
    "method" "CheckinMethod" NOT NULL DEFAULT 'MANUAL',
    "recorded_by_user_id" UUID,
    "idempotency_key" TEXT,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "member_gym_id_status_idx" ON "member"("gym_id", "status");

-- CreateIndex
CREATE INDEX "member_gym_id_phone_idx" ON "member"("gym_id", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "member_gym_id_code_key" ON "member"("gym_id", "code");

-- CreateIndex
CREATE INDEX "membership_plan_gym_id_is_active_idx" ON "membership_plan"("gym_id", "is_active");

-- CreateIndex
CREATE INDEX "member_subscription_gym_id_status_ends_at_idx" ON "member_subscription"("gym_id", "status", "ends_at");

-- CreateIndex
CREATE INDEX "member_subscription_member_id_starts_at_idx" ON "member_subscription"("member_id", "starts_at" DESC);

-- CreateIndex
CREATE INDEX "attendance_gym_id_branch_id_checked_in_at_idx" ON "attendance"("gym_id", "branch_id", "checked_in_at" DESC);

-- CreateIndex
CREATE INDEX "attendance_member_id_checked_in_at_idx" ON "attendance"("member_id", "checked_in_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_gym_id_idempotency_key_key" ON "attendance"("gym_id", "idempotency_key");

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_home_branch_id_fkey" FOREIGN KEY ("home_branch_id") REFERENCES "branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_plan" ADD CONSTRAINT "membership_plan_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_subscription" ADD CONSTRAINT "member_subscription_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_subscription" ADD CONSTRAINT "member_subscription_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_subscription" ADD CONSTRAINT "member_subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "membership_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_subscription" ADD CONSTRAINT "member_subscription_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "member_subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ───────── Hand-written additions ─────────

-- One active member per phone number in a gym (archived members may share it).
CREATE UNIQUE INDEX "member_gym_phone_active_key" ON "member"("gym_id", "phone")
  WHERE "phone" IS NOT NULL AND "status" = 'ACTIVE';

-- Sanity checks the application also enforces.
ALTER TABLE "membership_plan"
  ADD CONSTRAINT "membership_plan_duration_chk" CHECK ("duration_days" > 0),
  ADD CONSTRAINT "membership_plan_price_chk" CHECK ("price_amount_rial" >= 0),
  ADD CONSTRAINT "membership_plan_entry_limit_chk" CHECK ("entry_limit" IS NULL OR "entry_limit" > 0);
ALTER TABLE "member_subscription"
  ADD CONSTRAINT "member_subscription_period_chk" CHECK ("ends_at" > "starts_at"),
  ADD CONSTRAINT "member_subscription_amounts_chk" CHECK ("price_amount_rial" >= 0 AND "discount_amount_rial" >= 0 AND "discount_amount_rial" <= "price_amount_rial"),
  ADD CONSTRAINT "member_subscription_entries_chk" CHECK ("entries_used" >= 0 AND ("entry_limit" IS NULL OR "entries_used" <= "entry_limit"));

-- Row-level security (same policy as the Phase 1 tenant tables).
ALTER TABLE "member" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "member" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));

ALTER TABLE "membership_plan" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "membership_plan" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));

ALTER TABLE "member_subscription" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "member_subscription" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));

ALTER TABLE "attendance" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "attendance" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smartgym_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "member", "membership_plan", "member_subscription", "attendance" TO smartgym_app;
  END IF;
END $$;
