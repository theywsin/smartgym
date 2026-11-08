-- CreateTable
CREATE TABLE "platform_setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "platform_setting_pkey" PRIMARY KEY ("key")
);


-- Platform settings are public-ish content written only by super admins through the app (RLS bypass path).
GRANT SELECT, INSERT, UPDATE ON "platform_setting" TO smartgym_app;
REVOKE DELETE ON "platform_setting" FROM smartgym_app;
