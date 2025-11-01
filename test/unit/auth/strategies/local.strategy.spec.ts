/* eslint-disable @typescript-eslint/unbound-method */

import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from 'generated/prisma';
import { mockDeep } from 'jest-mock-extended';

import { KordUnauthorizedException } from '@/common/exceptions/kord.exceptions';
import { AuthService } from '@/modules/auth/auth.service';
import {
  LocalStrategy,
  ValidatedUser,
} from '@/modules/auth/strategies/local.strategy';
import { PrismaService } from '@/modules/prisma/prisma.service';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
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

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object when credentials are valid', async () => {
      const mockUser: ValidatedUser = {
        email: 'test@example.com',
        id: 1,
        username: 'testuser',
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);

      const result = await strategy.validate('testuser', 'password123');

      expect(result).toEqual(mockUser);
      expect(authService.validateUser).toHaveBeenCalledWith(
        'testuser',
        'password123',
      );
    });

    it('should return user when validating with email', async () => {
      const mockUser: ValidatedUser = {
        email: 'test@example.com',
        id: 1,
        username: 'testuser',
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);

      const result = await strategy.validate('test@example.com', 'password123');

      expect(result).toEqual(mockUser);
      expect(authService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
    });

    it('should throw KordUnauthorizedException when user is not found', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      await expect(
        strategy.validate('invaliduser', 'wrongpassword'),
      ).rejects.toThrow(KordUnauthorizedException);

      await expect(
        strategy.validate('invaliduser', 'wrongpassword'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw KordUnauthorizedException when password is incorrect', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      await expect(
        strategy.validate('testuser', 'wrongpassword'),
      ).rejects.toThrow(KordUnauthorizedException);
    });
  });
});
