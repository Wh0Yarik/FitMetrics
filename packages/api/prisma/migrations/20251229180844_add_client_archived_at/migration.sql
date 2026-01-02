-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "archived_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "clients_archived_at_idx" ON "clients"("archived_at");
