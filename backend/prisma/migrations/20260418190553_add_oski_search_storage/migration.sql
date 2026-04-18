-- CreateTable
CREATE TABLE `OskiSearch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userLat` DOUBLE NULL,
    `userLng` DOUBLE NULL,
    `query` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `lat` DOUBLE NULL,
    `lng` DOUBLE NULL,
    `pitch` VARCHAR(191) NULL,
    `debugSteps` JSON NULL,
    `output` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
