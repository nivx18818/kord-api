import { Module } from '@nestjs/common';

import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';

@Module({
  controllers: [ChannelsController],
  exports: [ChannelsService],
  imports: [UsersModule, RolesModule],
  providers: [ChannelsService],
})
export class ChannelsModule {}
