-- CreateTable
CREATE TABLE "workout_program" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "coach_user_id" UUID,
    "title" TEXT NOT NULL,
    "goal" TEXT,
    "notes" TEXT,
    "days" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "archived_at" TIMESTAMPTZ(3),

    CONSTRAINT "workout_program_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workout_program_gym_id_member_id_created_at_idx" ON "workout_program"("gym_id", "member_id", "created_at");

-- CreateIndex
CREATE INDEX "workout_program_gym_id_coach_user_id_idx" ON "workout_program"("gym_id", "coach_user_id");

-- AddForeignKey
ALTER TABLE "workout_program" ADD CONSTRAINT "workout_program_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ───────── Hand-written additions ─────────
CREATE UNIQUE INDEX "workout_program_one_active" ON "workout_program"("member_id") WHERE "is_active";
ALTER TABLE "workout_program" ADD CONSTRAINT "workout_program_days_chk" CHECK (jsonb_typeof("days") = 'array');

ALTER TABLE "workout_program" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "workout_program" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smartgym_app') THEN
    GRANT SELECT, INSERT, UPDATE ON "workout_program" TO smartgym_app;
    REVOKE DELETE ON "workout_program" FROM smartgym_app;
  END IF;
END $$;
