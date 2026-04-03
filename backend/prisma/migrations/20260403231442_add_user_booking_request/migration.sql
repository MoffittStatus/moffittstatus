-- CreateTable
CREATE TABLE `UserBookingRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requestedStart` DATETIME(3) NOT NULL,
    `requestedEnd` DATETIME(3) NOT NULL,
    `libcalLibraryId` VARCHAR(50) NULL,
    `libcalRoomId` VARCHAR(50) NULL,
    `slotChecksum` VARCHAR(255) NULL,
    `status` ENUM('RECEIVED', 'COMPLETED', 'FAILED', 'ABANDONED') NOT NULL DEFAULT 'RECEIVED',
    `userId` INTEGER NULL,
    `libraryId` INTEGER NULL,
    `bookingId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserBookingRequest_bookingId_key`(`bookingId`),
    INDEX `UserBookingRequest_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `UserBookingRequest_libraryId_createdAt_idx`(`libraryId`, `createdAt`),
    INDEX `UserBookingRequest_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `UserBookingRequest_libcalLibraryId_requestedStart_requestedE_idx`(`libcalLibraryId`, `requestedStart`, `requestedEnd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserBookingRequest` ADD CONSTRAINT `UserBookingRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserBookingRequest` ADD CONSTRAINT `UserBookingRequest_libraryId_fkey` FOREIGN KEY (`libraryId`) REFERENCES `Library`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserBookingRequest` ADD CONSTRAINT `UserBookingRequest_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
