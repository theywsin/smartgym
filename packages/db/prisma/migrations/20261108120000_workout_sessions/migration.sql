-- CreateTable
CREATE TABLE "workout_session" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "day_index" INTEGER NOT NULL,
    "day_title" TEXT NOT NULL,
    "exercises" JSONB NOT NULL,
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ(3),
    "note" TEXT,

    CONSTRAINT "workout_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_set_log" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "exercise_index" INTEGER NOT NULL,
    "set_number" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "weight_kg_x10" INTEGER,
    "note" TEXT,
    "logged_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_set_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workout_session_gym_id_member_id_started_at_idx" ON "workout_session"("gym_id", "member_id", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "workout_set_log_session_id_exercise_index_set_number_key" ON "workout_set_log"("session_id", "exercise_index", "set_number");

-- AddForeignKey
ALTER TABLE "workout_session" ADD CONSTRAINT "workout_session_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_set_log" ADD CONSTRAINT "workout_set_log_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_set_log" ADD CONSTRAINT "workout_set_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "workout_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ───────── Hand-written additions ─────────
CREATE UNIQUE INDEX "workout_session_one_open" ON "workout_session"("member_id") WHERE "finished_at" IS NULL;
ALTER TABLE "workout_set_log" ADD CONSTRAINT "workout_set_log_reps_chk" CHECK ("reps" >= 0 AND ("weight_kg_x10" IS NULL OR "weight_kg_x10" >= 0));

ALTER TABLE "workout_session" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "workout_session" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));
ALTER TABLE "workout_set_log" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "workout_set_log" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smartgym_app') THEN
    GRANT SELECT, INSERT, UPDATE ON "workout_session" TO smartgym_app;
    GRANT SELECT, INSERT, UPDATE ON "workout_set_log" TO smartgym_app;
  END IF;
END $$;
