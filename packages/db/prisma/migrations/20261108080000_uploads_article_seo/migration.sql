-- AlterTable
ALTER TABLE "article" ADD COLUMN     "canonical_url" TEXT,
ADD COLUMN     "cover_alt" TEXT,
ADD COLUMN     "focus_keyword" TEXT,
ADD COLUMN     "noindex" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "og_image_url" TEXT;

-- CreateTable
CREATE TABLE "platform_upload" (
    "id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "uploaded_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_upload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_upload_file_name_key" ON "platform_upload"("file_name");


-- Written only by super admins through the app (system path).
GRANT SELECT, INSERT ON "platform_upload" TO smartgym_app;
