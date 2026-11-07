-- CreateEnum
CREATE TYPE "TicketScope" AS ENUM ('PLATFORM', 'GYM');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'ANSWERED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketSide" AS ENUM ('REQUESTER', 'SUPPORT');

-- CreateTable
CREATE TABLE "ticket" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "scope" "TicketScope" NOT NULL,
    "member_id" UUID,
    "opened_by_user_id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "last_message_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_message" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "side" "TicketSide" NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_scope_status_last_message_at_idx" ON "ticket"("scope", "status", "last_message_at");

-- CreateIndex
CREATE INDEX "ticket_gym_id_scope_status_idx" ON "ticket"("gym_id", "scope", "status");

-- CreateIndex
CREATE INDEX "ticket_member_id_idx" ON "ticket"("member_id");

-- CreateIndex
CREATE INDEX "ticket_message_ticket_id_created_at_idx" ON "ticket_message"("ticket_id", "created_at");

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_message" ADD CONSTRAINT "ticket_message_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ───────── Hand-written additions ─────────
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_scope_member_chk" CHECK ((scope = 'GYM') = (member_id IS NOT NULL));
ALTER TABLE "ticket_message" ADD CONSTRAINT "ticket_message_body_chk" CHECK (length(body) BETWEEN 1 AND 5000);

ALTER TABLE "ticket" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "ticket" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));
ALTER TABLE "ticket_message" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "ticket_message" USING (app_gym_allowed(gym_id)) WITH CHECK (app_gym_allowed(gym_id));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smartgym_app') THEN
    GRANT SELECT, INSERT ON "ticket", "ticket_message" TO smartgym_app;
    REVOKE UPDATE, DELETE ON "ticket", "ticket_message" FROM smartgym_app;
    GRANT UPDATE ("status", "last_message_at", "closed_at", "updated_at") ON "ticket" TO smartgym_app;
  END IF;
END $$;
