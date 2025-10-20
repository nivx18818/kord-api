/*
  Warnings:

  - You are about to drop the `reacts_message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_server` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `reacts_message` DROP FOREIGN KEY `reacts_message_message_id_fkey`;

-- DropForeignKey
ALTER TABLE `reacts_message` DROP FOREIGN KEY `reacts_message_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_server` DROP FOREIGN KEY `user_server_role_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_server` DROP FOREIGN KEY `user_server_server_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_server` DROP FOREIGN KEY `user_server_user_id_fkey`;

-- DropTable
DROP TABLE `reacts_message`;

-- DropTable
DROP TABLE `user_server`;

-- CreateTable
CREATE TABLE `memberships` (
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `user_id` INTEGER NOT NULL,
    `server_id` INTEGER NOT NULL,
    `role_id` INTEGER NULL,

    INDEX `memberships_role_id_idx`(`role_id`),
    PRIMARY KEY (`user_id`, `server_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reactions` (
    `emoji` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `message_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,

    INDEX `reactions_emoji_idx`(`emoji`),
    PRIMARY KEY (`message_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_server_id_fkey` FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reactions` ADD CONSTRAINT `reactions_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reactions` ADD CONSTRAINT `reactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
