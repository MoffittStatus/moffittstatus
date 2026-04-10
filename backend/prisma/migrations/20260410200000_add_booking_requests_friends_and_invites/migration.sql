-- CreateTable
CREATE TABLE `UserBookingRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requestedStart` DATETIME(3) NOT NULL,
    `requestedEnd` DATETIME(3) NOT NULL,
    `locationType` ENUM('LIBRARY', 'CAMPUS_SPACE', 'OTHER') NOT NULL DEFAULT 'LIBRARY',
    `locationName` VARCHAR(255) NULL,
    `locationCode` VARCHAR(100) NULL,
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
    INDEX `UserBookingRequest_locationType_locationName_requestedStart_idx`(`locationType`, `locationName`, `requestedStart`),
    INDEX `UserBookingRequest_libcalLibraryId_requestedStart_requestedE_idx`(`libcalLibraryId`, `requestedStart`, `requestedEnd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserFriend` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `friendEmail` VARCHAR(255) NOT NULL,
    `friendUserId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `UserFriend_userId_friendEmail_key`(`userId`, `friendEmail`),
    INDEX `UserFriend_friendUserId_idx`(`friendUserId`),
    INDEX `UserFriend_friendEmail_idx`(`friendEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BookingInvite` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bookingRequestId` INTEGER NOT NULL,
    `inviteeEmail` VARCHAR(255) NOT NULL,
    `inviteeUserId` INTEGER NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BookingInvite_bookingRequestId_inviteeEmail_key`(`bookingRequestId`, `inviteeEmail`),
    INDEX `BookingInvite_inviteeUserId_idx`(`inviteeUserId`),
    INDEX `BookingInvite_inviteeEmail_idx`(`inviteeEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserBookingRequest` ADD CONSTRAINT `UserBookingRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserBookingRequest` ADD CONSTRAINT `UserBookingRequest_libraryId_fkey` FOREIGN KEY (`libraryId`) REFERENCES `Library`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserBookingRequest` ADD CONSTRAINT `UserBookingRequest_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserFriend` ADD CONSTRAINT `UserFriend_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserFriend` ADD CONSTRAINT `UserFriend_friendUserId_fkey` FOREIGN KEY (`friendUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookingInvite` ADD CONSTRAINT `BookingInvite_bookingRequestId_fkey` FOREIGN KEY (`bookingRequestId`) REFERENCES `UserBookingRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookingInvite` ADD CONSTRAINT `BookingInvite_inviteeUserId_fkey` FOREIGN KEY (`inviteeUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
