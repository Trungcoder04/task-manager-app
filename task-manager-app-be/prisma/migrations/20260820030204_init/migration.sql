-- CreateTable
CREATE TABLE `Users` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `Username` VARCHAR(50) NOT NULL,
    `Password` VARCHAR(255) NOT NULL,
    `FullName` VARCHAR(100) NOT NULL,
    `Email` VARCHAR(100) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `Avatar` VARCHAR(191) NULL,

    UNIQUE INDEX `Users_Username_key`(`Username`),
    UNIQUE INDEX `Users_Email_key`(`Email`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Projects` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(255) NOT NULL,
    `Description` TEXT NULL,
    `OwnerId` INTEGER NOT NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectMembers` (
    `ProjectId` INTEGER NOT NULL,
    `UserId` INTEGER NOT NULL,
    `Role` INTEGER NOT NULL DEFAULT 2,
    `JoinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`ProjectId`, `UserId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tasks` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `ProjectId` INTEGER NOT NULL,
    `Title` VARCHAR(255) NOT NULL,
    `Description` TEXT NULL,
    `Status` INTEGER NOT NULL DEFAULT 1,
    `Priority` INTEGER NOT NULL DEFAULT 2,
    `DueDate` DATETIME(3) NULL,
    `AssigneeId` INTEGER NULL,
    `OrderIndex` DOUBLE NOT NULL DEFAULT 0,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Labels` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `ProjectId` INTEGER NOT NULL,
    `Name` VARCHAR(100) NOT NULL,
    `ColorCode` VARCHAR(20) NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TaskLabels` (
    `TaskId` INTEGER NOT NULL,
    `LabelId` INTEGER NOT NULL,

    PRIMARY KEY (`TaskId`, `LabelId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TaskAttachments` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `TaskId` INTEGER NOT NULL,
    `UploaderId` INTEGER NOT NULL,
    `FileName` VARCHAR(255) NOT NULL,
    `FileUrl` TEXT NOT NULL,
    `UploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TaskComments` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `TaskId` INTEGER NOT NULL,
    `UserId` INTEGER NOT NULL,
    `Content` TEXT NOT NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TaskActivities` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `TaskId` INTEGER NOT NULL,
    `UserId` INTEGER NOT NULL,
    `Action` VARCHAR(255) NOT NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Projects` ADD CONSTRAINT `Projects_OwnerId_fkey` FOREIGN KEY (`OwnerId`) REFERENCES `Users`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectMembers` ADD CONSTRAINT `ProjectMembers_ProjectId_fkey` FOREIGN KEY (`ProjectId`) REFERENCES `Projects`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectMembers` ADD CONSTRAINT `ProjectMembers_UserId_fkey` FOREIGN KEY (`UserId`) REFERENCES `Users`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tasks` ADD CONSTRAINT `Tasks_ProjectId_fkey` FOREIGN KEY (`ProjectId`) REFERENCES `Projects`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tasks` ADD CONSTRAINT `Tasks_AssigneeId_fkey` FOREIGN KEY (`AssigneeId`) REFERENCES `Users`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Labels` ADD CONSTRAINT `Labels_ProjectId_fkey` FOREIGN KEY (`ProjectId`) REFERENCES `Projects`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskLabels` ADD CONSTRAINT `TaskLabels_TaskId_fkey` FOREIGN KEY (`TaskId`) REFERENCES `Tasks`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskLabels` ADD CONSTRAINT `TaskLabels_LabelId_fkey` FOREIGN KEY (`LabelId`) REFERENCES `Labels`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskAttachments` ADD CONSTRAINT `TaskAttachments_TaskId_fkey` FOREIGN KEY (`TaskId`) REFERENCES `Tasks`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskAttachments` ADD CONSTRAINT `TaskAttachments_UploaderId_fkey` FOREIGN KEY (`UploaderId`) REFERENCES `Users`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskComments` ADD CONSTRAINT `TaskComments_TaskId_fkey` FOREIGN KEY (`TaskId`) REFERENCES `Tasks`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskComments` ADD CONSTRAINT `TaskComments_UserId_fkey` FOREIGN KEY (`UserId`) REFERENCES `Users`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskActivities` ADD CONSTRAINT `TaskActivities_TaskId_fkey` FOREIGN KEY (`TaskId`) REFERENCES `Tasks`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskActivities` ADD CONSTRAINT `TaskActivities_UserId_fkey` FOREIGN KEY (`UserId`) REFERENCES `Users`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;
