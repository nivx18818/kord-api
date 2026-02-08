-- CreateTable
CREATE TABLE `user_blocks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `target_id` INTEGER NOT NULL,

    INDEX `user_blocks_user_id_idx`(`user_id`),
    INDEX `user_blocks_target_id_idx`(`target_id`),
    UNIQUE INDEX `user_blocks_user_id_target_id_key`(`user_id`, `target_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_blocks` ADD CONSTRAINT `user_blocks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_blocks` ADD CONSTRAINT `user_blocks_target_id_fkey` FOREIGN KEY (`target_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
