ALTER TABLE `User` ADD COLUMN `sessionVersion` INTEGER NOT NULL DEFAULT 0;

CREATE TABLE `LoginAttempt` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(191) NOT NULL,
  `ipAddress` VARCHAR(191) NOT NULL,
  `success` BOOLEAN NOT NULL DEFAULT false,
  `reason` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `LoginAttempt_email_createdAt_idx`(`email`, `createdAt`),
  INDEX `LoginAttempt_ipAddress_createdAt_idx`(`ipAddress`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AuditLog` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NULL,
  `userEmail` VARCHAR(191) NULL,
  `action` VARCHAR(191) NOT NULL,
  `details` VARCHAR(191) NULL,
  `ipAddress` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `AuditLog_createdAt_idx`(`createdAt`),
  INDEX `AuditLog_userId_idx`(`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
