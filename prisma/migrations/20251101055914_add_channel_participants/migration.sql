-- CreateTable
CREATE TABLE `channel_participants` (
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `channel_id` INTEGER NOT NULL,

    INDEX `channel_participants_channel_id_idx`(`channel_id`),
    INDEX `channel_participants_user_id_idx`(`user_id`),
    PRIMARY KEY (`user_id`, `channel_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `channel_participants` ADD CONSTRAINT `channel_participants_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `channel_participants` ADD CONSTRAINT `channel_participants_channel_id_fkey` FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
