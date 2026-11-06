/*
  Warnings:

  - You are about to drop the `oskisearch` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `oskisearch`;

-- CreateTable
CREATE TABLE `OskiSearch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userLat` DOUBLE NULL,
    `userLng` DOUBLE NULL,
    `query` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `lat` DOUBLE NULL,
    `lng` DOUBLE NULL,
    `pitch` TEXT NULL,
    `debugSteps` JSON NULL,
    `output` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
