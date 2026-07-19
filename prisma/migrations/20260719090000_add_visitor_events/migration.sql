CREATE TABLE `VisitorEvent` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `visitorId` VARCHAR(191) NOT NULL,
  `path` VARCHAR(191) NOT NULL,
  `referrer` TEXT NULL,
  `userAgent` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `VisitorEvent_createdAt_idx`(`createdAt`),
  INDEX `VisitorEvent_visitorId_idx`(`visitorId`),
  INDEX `VisitorEvent_path_idx`(`path`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
