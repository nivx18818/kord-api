/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */

import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from 'generated/prisma';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { AuthService } from '@/modules/auth/auth.service';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import { PrismaService } from '@/modules/prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaClient>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaClient>(),
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      dateOfBirth: '1990-01-01',
      email: 'test@example.com',
      password: 'Password123!',
      username: 'testuser',
    };

    it('should successfully register a new user', async () => {
      // Arrange
      prisma.user.findUnique
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(null); // username check

      const mockUser = {
        email: registerDto.email,
        id: 1,
        username: registerDto.username,
      };

      prisma.user.create.mockResolvedValue(mockUser as any);
      prisma.refreshToken.create.mockResolvedValue({} as any);

      jest.spyOn(jwtService, 'sign').mockReturnValue('mock-token');

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue({
        email: registerDto.email,
        id: 1,
      } as any);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        'Email already exists',
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if username already exists', async () => {
      // Arrange
      prisma.user.findUnique
        .mockResolvedValueOnce(null) // email check passes
        .mockResolvedValue({
          id: 1,
          username: registerDto.username,
        } as any); // username check fails

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        'Username already exists',
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      password: 'Password123!',
      usernameOrEmail: 'test@example.com',
    };

    it('should successfully login with valid credentials using email', async () => {
      // Arrange
      const hashedPassword = await bcrypt.hash(loginDto.password, 12);
      const mockUser = {
        email: 'test@example.com',
        id: 1,
        password: hashedPassword,
        username: 'testuser',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.refreshToken.create.mockResolvedValue({} as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock-token');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    it('should successfully login with valid credentials using username', async () => {
      // Arrange
      const loginWithUsername = {
        password: 'Password123!',
        usernameOrEmail: 'testuser',
      };
      const hashedPassword = await bcrypt.hash(loginWithUsername.password, 12);
      const mockUser = {
        email: 'test@example.com',
        id: 1,
        password: hashedPassword,
        username: 'testuser',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.refreshToken.create.mockResolvedValue({} as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock-token');

      // Act
      const result = await service.login(loginWithUsername);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      // Arrange
      const mockUser = {
        email: 'test@example.com',
        id: 1,
        password: await bcrypt.hash('WrongPassword', 12),
        username: 'testuser',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('refresh', () => {
    const refreshToken = 'valid-refresh-token';
    const payload = { email: 'test@example.com', sub: 1, username: 'testuser' };

    it('should successfully refresh tokens with valid refresh token', async () => {
      // Arrange
      jest.spyOn(jwtService, 'verify').mockReturnValue(payload as any);
      prisma.refreshToken.findFirst.mockResolvedValue({
        expiresAt: new Date(Date.now() + 1000000),
        id: 1,
        token: refreshToken,
        userId: 1,
      } as any);

      prisma.user.findUnique.mockResolvedValue({
        email: payload.email,
        id: payload.sub,
        username: payload.username,
      } as any);

      prisma.refreshToken.delete.mockResolvedValue({} as any);
      prisma.refreshToken.create.mockResolvedValue({} as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('new-token');

      // Act
      const result = await service.refresh(refreshToken);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prisma.refreshToken.delete).toHaveBeenCalled();
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      // Arrange
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token not found in database', async () => {
      // Arrange
      jest.spyOn(jwtService, 'verify').mockReturnValue(payload as any);
      prisma.refreshToken.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refresh(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refresh(refreshToken)).rejects.toThrow(
        'Invalid refresh token',
      );
    });
  });

  describe('checkEmail', () => {
    it('should return available: true if email does not exist', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.checkEmail('test@example.com');

      // Assert
      expect(result).toEqual({ available: true });
    });

    it('should return available: false if email exists', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue({
        email: 'test@example.com',
        id: 1,
      } as any);

      // Act
      const result = await service.checkEmail('test@example.com');

      // Assert
      expect(result).toEqual({ available: false });
    });
  });

  describe('validateUser', () => {
    const email = 'test@example.com';
    const password = 'Password123!';

    it('should return user without password if credentials are valid', async () => {
      // Arrange
      const hashedPassword = await bcrypt.hash(password, 12);
      const mockUser = {
        email,
        id: 1,
        password: hashedPassword,
        username: 'testuser',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(result).toEqual({
        email,
        id: 1,
        username: 'testuser',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should return null if user not found', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      // Arrange
      const mockUser = {
        email,
        id: 1,
        password: await bcrypt.hash('WrongPassword', 12),
        username: 'testuser',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(result).toBeNull();
    });
  });
});
