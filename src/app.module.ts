import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './modules/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { ServersModule } from './modules/servers/servers.module';
import { ChannelsModule } from './modules/channels/channels.module';

@Module({
  imports: [PrismaModule, UsersModule, ProfilesModule, ServersModule, ChannelsModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
