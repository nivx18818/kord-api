import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { MessagesModule } from './modules/messages/messages.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { RolesModule } from './modules/roles/roles.module';
import { ServersModule } from './modules/servers/servers.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  controllers: [AppController],
  imports: [
    PrismaModule,
    UsersModule,
    ProfilesModule,
    ServersModule,
    ChannelsModule,
    RolesModule,
    MessagesModule,
    AttachmentsModule,
  ],
  providers: [],
})
export class AppModule {}
