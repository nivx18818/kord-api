import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  controllers: [AuthController],
  imports: [
    JwtModule.register({
      global: false,
      secret: process.env.JWT_ACCESS_SECRET,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      signOptions: { expiresIn: process.env.JWT_EXPIRATION as any },
    }),
    PrismaModule,
    UsersModule,
  ],
  providers: [AuthService, JwtAuthGuard, JwtStrategy],
})
export class AuthModule {}
