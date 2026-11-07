-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "notification_log" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "member_id" UUID,
    "kind" TEXT NOT NULL,
    "dedupe_key" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'sms',
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "provider_ref" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ(3),

    CONSTRAINT "notification_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_log_gym_id_created_at_idx" ON "notification_log"("gym_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_log_kind_dedupe_key_key" ON "notification_log"("kind", "dedupe_key");

-- AddForeignKey
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ───────── Hand-written additions ─────────
ALTER TABLE "notification_log" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "notification_log" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smartgym_app') THEN
    GRANT SELECT, INSERT ON "notification_log" TO smartgym_app;
    REVOKE UPDATE, DELETE ON "notification_log" FROM smartgym_app;
    GRANT UPDATE ("status", "provider_ref", "error", "sent_at") ON "notification_log" TO smartgym_app;
  END IF;
END $$;
