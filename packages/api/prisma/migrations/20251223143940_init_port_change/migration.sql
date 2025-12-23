/*
  Warnings:

  - You are about to alter the column `total_protein` on the `diary_entries` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `total_fat` on the `diary_entries` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `total_carbs` on the `diary_entries` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `total_fiber` on the `diary_entries` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `comment` on the `meal_entries` table. All the data in the column will be lost.
  - The `time` column on the `meal_entries` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `protein` on the `meal_entries` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `fat` on the `meal_entries` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `carbs` on the `meal_entries` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `fiber` on the `meal_entries` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Added the required column `name` to the `meal_entries` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "diary_entries" ALTER COLUMN "total_protein" SET DEFAULT 0,
ALTER COLUMN "total_protein" SET DATA TYPE INTEGER,
ALTER COLUMN "total_fat" SET DEFAULT 0,
ALTER COLUMN "total_fat" SET DATA TYPE INTEGER,
ALTER COLUMN "total_carbs" SET DEFAULT 0,
ALTER COLUMN "total_carbs" SET DATA TYPE INTEGER,
ALTER COLUMN "total_fiber" SET DEFAULT 0,
ALTER COLUMN "total_fiber" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "meal_entries" DROP COLUMN "comment",
ADD COLUMN     "name" TEXT NOT NULL,
DROP COLUMN "time",
ADD COLUMN     "time" TIMESTAMP(3),
ALTER COLUMN "protein" SET DATA TYPE INTEGER,
ALTER COLUMN "fat" SET DATA TYPE INTEGER,
ALTER COLUMN "carbs" SET DATA TYPE INTEGER,
ALTER COLUMN "fiber" SET DATA TYPE INTEGER;
