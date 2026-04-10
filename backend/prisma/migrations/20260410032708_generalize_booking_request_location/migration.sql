-- AlterTable
ALTER TABLE `userbookingrequest` ADD COLUMN `locationCode` VARCHAR(100) NULL,
    ADD COLUMN `locationName` VARCHAR(255) NULL,
    ADD COLUMN `locationType` ENUM('LIBRARY', 'CAMPUS_SPACE', 'OTHER') NOT NULL DEFAULT 'LIBRARY';

-- CreateIndex
CREATE INDEX `UserBookingRequest_locationType_locationName_requestedStart_idx` ON `UserBookingRequest`(`locationType`, `locationName`, `requestedStart`);
