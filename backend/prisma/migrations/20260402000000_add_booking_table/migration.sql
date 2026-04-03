-- CreateEnum
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
  `id` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateEnum (MySQL uses ENUM inline on the column)

-- CreateTable
CREATE TABLE `Booking` (
    `id`              INTEGER      NOT NULL AUTO_INCREMENT,

    -- LibCal identifiers
    `roomId`          VARCHAR(50)  NOT NULL,
    `groupId`         VARCHAR(50)  NOT NULL,
    `libcalLibraryId` VARCHAR(50)  NOT NULL,
    `tempBookingId`   VARCHAR(100) NULL,
    `checksum`        VARCHAR(255) NULL,
    `redirectUrl`     TEXT         NULL,

    -- Time
    `startTime`       DATETIME(3)  NOT NULL,
    `endTime`         DATETIME(3)  NOT NULL,
    `duration`        INTEGER      NOT NULL,

    -- Status (library-side view); PENDING = default
    `status`          ENUM('PENDING','CONFIRMED','CANCELLED','EXPIRED') NOT NULL DEFAULT 'PENDING',

    -- User placeholder (nullable until login is implemented)
    `userId`          INTEGER      NULL,

    -- Library FK
    `libraryId`       INTEGER      NULL,

    `createdAt`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Booking_libraryId_startTime_idx`(`libraryId`, `startTime`),
    INDEX `Booking_status_idx`(`status`),
    INDEX `Booking_roomId_startTime_idx`(`roomId`, `startTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_libraryId_fkey`
    FOREIGN KEY (`libraryId`) REFERENCES `Library`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
