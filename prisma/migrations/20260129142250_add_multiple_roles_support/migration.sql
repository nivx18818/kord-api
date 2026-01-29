/*
  Warnings:

  - You are about to drop the column `role_id` on the `memberships` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `memberships` DROP FOREIGN KEY `memberships_role_id_fkey`;

-- DropIndex
DROP INDEX `memberships_role_id_idx` ON `memberships`;

-- AlterTable
ALTER TABLE `memberships` DROP COLUMN `role_id`;

-- CreateTable
CREATE TABLE `membership_roles` (
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `server_id` INTEGER NOT NULL,
    `role_id` INTEGER NOT NULL,

    INDEX `membership_roles_user_id_server_id_idx`(`user_id`, `server_id`),
    INDEX `membership_roles_role_id_idx`(`role_id`),
    PRIMARY KEY (`user_id`, `server_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `membership_roles` ADD CONSTRAINT `membership_roles_user_id_server_id_fkey` FOREIGN KEY (`user_id`, `server_id`) REFERENCES `memberships`(`user_id`, `server_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `membership_roles` ADD CONSTRAINT `membership_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
