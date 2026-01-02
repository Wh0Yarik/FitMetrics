-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'CLIENT_ARCHIVED';

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "archived_by_trainer_id" TEXT;

-- CreateIndex
CREATE INDEX "clients_archived_by_trainer_id_idx" ON "clients"("archived_by_trainer_id");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_archived_by_trainer_id_fkey" FOREIGN KEY ("archived_by_trainer_id") REFERENCES "trainers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
