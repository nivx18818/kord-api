import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './modules/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { ProfilesModule } from './modules/profiles/profiles.module';

@Module({
  imports: [PrismaModule, UsersModule, ProfilesModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
