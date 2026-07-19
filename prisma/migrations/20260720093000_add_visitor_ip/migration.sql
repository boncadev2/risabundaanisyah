ALTER TABLE `VisitorEvent` ADD COLUMN `ipAddress` VARCHAR(191) NULL;
CREATE INDEX `VisitorEvent_ipAddress_idx` ON `VisitorEvent`(`ipAddress`);
