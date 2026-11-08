-- AlterEnum
ALTER TYPE "SessionKind" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "admin_username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_admin_username_key" ON "user"("admin_username");

