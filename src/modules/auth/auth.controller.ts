import type { Request, Response } from 'express';

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import {
  COOKIE_NAMES,
  getAccessTokenCookieOptions,
  getClearCookieOptions,
  getRefreshTokenCookieOptions,
} from '@/common/constants/cookie-config';
import { RefreshTokenInvalidException } from '@/common/exceptions/kord.exceptions';

import { AuthService } from './auth.service';
import {
  CurrentUser,
  type RequestUser,
} from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  getProfile(@CurrentUser() user: RequestUser): RequestUser {
    return user;
  }

  @Get('check-email')
  @HttpCode(HttpStatus.OK)
  async checkEmail(
    @Query('email') email: string,
  ): Promise<{ available: boolean }> {
    return this.authService.checkEmail(email);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const { accessToken, refreshToken } =
      await this.authService.login(loginDto);

    // Set cookies
    response.cookie(
      COOKIE_NAMES.ACCESS_TOKEN,
      accessToken,
      getAccessTokenCookieOptions(),
    );
    response.cookie(
      COOKIE_NAMES.REFRESH_TOKEN,
      refreshToken,
      getRefreshTokenCookieOptions(),
    );

    return { message: 'Login successful' };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const refreshToken = request.cookies[COOKIE_NAMES.REFRESH_TOKEN] as string;

    // Invalidate refresh token in database if present
    if (refreshToken) {
      await this.authService.logout(user.id, refreshToken);
    }

    // Clear cookies
    response.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, getClearCookieOptions());
    response.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
      ...getClearCookieOptions(),
      path: '/api/v1/auth/refresh', // Must match original path
    });

    return { message: 'Logout successful' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    // Extract refresh token from cookie
    const refreshToken = request.cookies[COOKIE_NAMES.REFRESH_TOKEN] as string;

    if (!refreshToken) {
      throw new RefreshTokenInvalidException();
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refresh(refreshToken);

    // Set new cookies
    response.cookie(
      COOKIE_NAMES.ACCESS_TOKEN,
      accessToken,
      getAccessTokenCookieOptions(),
    );
    response.cookie(
      COOKIE_NAMES.REFRESH_TOKEN,
      newRefreshToken,
      getRefreshTokenCookieOptions(),
    );

    return { message: 'Token refreshed' };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const { accessToken, refreshToken } =
      await this.authService.register(registerDto);

    // Set cookies
    response.cookie(
      COOKIE_NAMES.ACCESS_TOKEN,
      accessToken,
      getAccessTokenCookieOptions(),
    );
    response.cookie(
      COOKIE_NAMES.REFRESH_TOKEN,
      refreshToken,
      getRefreshTokenCookieOptions(),
    );

    return { message: 'Registration successful' };
  }
}
