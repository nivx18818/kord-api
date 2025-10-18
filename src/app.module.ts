import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './modules/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { ServersModule } from './modules/servers/servers.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { RolesModule } from './modules/roles/roles.module';
import { MessagesModule } from './modules/messages/messages.module';

@Module({
  imports: [PrismaModule, UsersModule, ProfilesModule, ServersModule, ChannelsModule, RolesModule, MessagesModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
