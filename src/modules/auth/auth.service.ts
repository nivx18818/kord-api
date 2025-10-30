import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';

import { PrismaService } from '../prisma/prisma.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async checkEmail(email: string): Promise<{ available: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return { available: !user };
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Check if input is email or username
    const isEmail = loginDto.usernameOrEmail.includes('@');

    // Find user by email or username
    const user = await this.prisma.user.findUnique({
      select: {
        email: true,
        id: true,
        password: true,
        username: true,
      },
      where: isEmail
        ? { email: loginDto.usernameOrEmail }
        : { username: loginDto.usernameOrEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    return this.generateTokens(user.id, user.email, user.username);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    try {
      // Verify refresh token - note: we use the same secret as access token for simplicity
      // In production, you might want to use a separate refresh token secret
      const payload = this.jwtService.verify<{
        email: string;
        sub: number;
        username: string;
      }>(refreshToken);

      // Check if refresh token exists in database
      const storedToken = await this.prisma.refreshToken.findFirst({
        where: {
          expiresAt: {
            gt: new Date(),
          },
          token: refreshToken,
          userId: payload.sub,
        },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Get user info
      const user = await this.prisma.user.findUnique({
        select: {
          email: true,
          id: true,
          username: true,
        },
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Delete old refresh token
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      // Generate new tokens
      return this.generateTokens(user.id, user.email, user.username);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Check if username already exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: registerDto.username },
    });

    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // Create user with profile
    try {
      const user = await this.prisma.user.create({
        select: {
          email: true,
          id: true,
          username: true,
        },
        data: {
          dateOfBirth: new Date(registerDto.dateOfBirth),
          email: registerDto.email,
          name: registerDto.name,
          password: hashedPassword,
          username: registerDto.username,
        },
      });

      // Generate tokens
      return this.generateTokens(user.id, user.email, user.username);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Username or email already exists');
      }
      throw error;
    }
  }

  async validateUser(
    usernameOrEmail: string,
    password: string,
  ): Promise<null | { email: string; id: number; username: string }> {
    // Check if input is email or username
    const isEmail = usernameOrEmail.includes('@');

    const user = await this.prisma.user.findUnique({
      select: {
        email: true,
        id: true,
        password: true,
        username: true,
      },
      where: isEmail
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  private async generateTokens(
    userId: number,
    email: string,
    username: string,
  ): Promise<AuthResponseDto> {
    const payload = { email, sub: userId, username };

    // Generate access token
    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token (longer expiration) with unique jti to avoid collisions
    const refreshToken = this.jwtService.sign({
      ...payload,
      jti: `${userId}-${Date.now()}-${Math.random()}`,
    });

    // Calculate expiration date
    const expiresIn = process.env.JWT_REFRESH_EXPIRATION || '7d';
    const expiresAt = new Date();

    // Parse expiration string (e.g., "7d", "30d")
    const match = expiresIn.match(/^(\d+)([dhms])$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];

      switch (unit) {
        case 'd':
          expiresAt.setDate(expiresAt.getDate() + value);
          break;
        case 'h':
          expiresAt.setHours(expiresAt.getHours() + value);
          break;
        case 'm':
          expiresAt.setMinutes(expiresAt.getMinutes() + value);
          break;
        case 's':
          expiresAt.setSeconds(expiresAt.getSeconds() + value);
          break;
      }
    } else {
      // Default to 7 days if parsing fails
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        expiresAt,
        token: refreshToken,
        userId,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
