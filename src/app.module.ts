import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { MessagesModule } from './modules/messages/messages.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { ReactionsModule } from './modules/reactions/reactions.module';
import { RolesModule } from './modules/roles/roles.module';
import { ServersModule } from './modules/servers/servers.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  controllers: [AppController],
  imports: [
    AttachmentsModule,
    AuthModule,
    ChannelsModule,
    MembershipsModule,
    MessagesModule,
    PrismaModule,
    ProfilesModule,
    ReactionsModule,
    RolesModule,
    ServersModule,
    UsersModule,
  ],
  providers: [],
})
export class AppModule {}
