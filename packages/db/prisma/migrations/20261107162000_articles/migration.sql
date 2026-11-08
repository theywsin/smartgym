-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "article" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "cover_url" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "seo_title" TEXT,
    "seo_description" TEXT,
    "read_minutes" INTEGER NOT NULL DEFAULT 1,
    "author_user_id" UUID,
    "published_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "article_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "article_slug_key" ON "article"("slug");

-- CreateIndex
CREATE INDEX "article_status_published_at_idx" ON "article"("status", "published_at");


-- ───────── Hand-written additions ─────────
ALTER TABLE "article" ADD CONSTRAINT "article_slug_chk" CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "article" ADD CONSTRAINT "article_published_chk" CHECK (status <> 'PUBLISHED' OR published_at IS NOT NULL);

-- Platform content (not tenant data). Archived instead of deleted.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smartgym_app') THEN
    GRANT SELECT, INSERT, UPDATE ON "article" TO smartgym_app;
    REVOKE DELETE ON "article" FROM smartgym_app;
  END IF;
END $$;
