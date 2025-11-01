import { Module } from '@nestjs/common';

import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { MessagesService } from './messages.service';

@Module({
  controllers: [MessagesController],
  exports: [MessagesService],
  providers: [MessagesService, MessagesGateway],
})
export class MessagesModule {}
