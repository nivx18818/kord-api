import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ChannelsModule } from '../channels/channels.module';
import { UsersModule } from '../users/users.module';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { MessagesService } from './messages.service';

@Module({
  controllers: [MessagesController],
  exports: [MessagesService],
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      signOptions: { expiresIn: process.env.JWT_EXPIRATION as any },
    }),
    UsersModule,
    ChannelsModule,
  ],
  providers: [MessagesService, MessagesGateway],
})
export class MessagesModule {}
