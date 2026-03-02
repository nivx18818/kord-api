/*
  Warnings:

  - You are about to drop the `channel_blocks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `channel_blocks` DROP FOREIGN KEY `channel_blocks_channel_id_fkey`;

-- DropForeignKey
ALTER TABLE `channel_blocks` DROP FOREIGN KEY `channel_blocks_user_id_fkey`;

-- DropTable
DROP TABLE `channel_blocks`;
