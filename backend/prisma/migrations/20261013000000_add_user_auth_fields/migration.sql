-- AlterTable
ALTER TABLE `User` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `googleId` VARCHAR(255) NULL,
    ADD COLUMN `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastLoginAt` DATETIME(3) NULL,
    ADD COLUMN `picture` TEXT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_googleId_key` ON `User`(`googleId`);

