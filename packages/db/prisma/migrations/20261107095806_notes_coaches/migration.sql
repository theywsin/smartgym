-- CreateTable
CREATE TABLE "member_note" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_profile" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "bio" TEXT,
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "commission_rate_bp" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "coach_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_athlete" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "coach_user_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(3),
    "assigned_by" UUID,

    CONSTRAINT "coach_athlete_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "member_note_member_id_created_at_idx" ON "member_note"("member_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "coach_profile_gym_id_user_id_key" ON "coach_profile"("gym_id", "user_id");

-- CreateIndex
CREATE INDEX "coach_athlete_gym_id_coach_user_id_ended_at_idx" ON "coach_athlete"("gym_id", "coach_user_id", "ended_at");

-- CreateIndex
CREATE INDEX "coach_athlete_member_id_idx" ON "coach_athlete"("member_id");

-- AddForeignKey
ALTER TABLE "member_note" ADD CONSTRAINT "member_note_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_note" ADD CONSTRAINT "member_note_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_profile" ADD CONSTRAINT "coach_profile_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_athlete" ADD CONSTRAINT "coach_athlete_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_athlete" ADD CONSTRAINT "coach_athlete_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ───────── Hand-written additions ─────────

-- At most one current coach per member.
CREATE UNIQUE INDEX "coach_athlete_current_key" ON "coach_athlete"("member_id") WHERE "ended_at" IS NULL;
ALTER TABLE "coach_profile" ADD CONSTRAINT "coach_profile_commission_chk" CHECK ("commission_rate_bp" IS NULL OR ("commission_rate_bp" BETWEEN 0 AND 10000));
ALTER TABLE "member_note" ADD CONSTRAINT "member_note_body_chk" CHECK (length("body") BETWEEN 1 AND 4000);

ALTER TABLE "member_note" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "member_note" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));
ALTER TABLE "coach_profile" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "coach_profile" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));
ALTER TABLE "coach_athlete" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "coach_athlete" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smartgym_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "member_note", "coach_profile", "coach_athlete" TO smartgym_app;
    -- Notes are append-only for the app.
    REVOKE UPDATE, DELETE ON "member_note" FROM smartgym_app;
  END IF;
END $$;
