import { Module } from '@nestjs/common';

import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';

@Module({
  controllers: [ChannelsController],
  exports: [ChannelsService],
  providers: [ChannelsService],
})
export class ChannelsModule {}
