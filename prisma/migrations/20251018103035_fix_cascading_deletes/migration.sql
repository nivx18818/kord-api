-- DropForeignKey
ALTER TABLE `roles` DROP FOREIGN KEY `roles_server_id_fkey`;

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_server_id_fkey` FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
