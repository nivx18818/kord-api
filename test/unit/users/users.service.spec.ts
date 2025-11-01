/* eslint-disable @typescript-eslint/unbound-method */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';
import {
  createMockPrismaService,
  createMockUserWithProfile,
  mockUser,
} from 'test/utils';

import { PrismaService } from '@/modules/prisma/prisma.service';
import { CreateUserDto } from '@/modules/users/dto/create-user.dto';
import { UpdateUserDto } from '@/modules/users/dto/update-user.dto';
import { UsersService } from '@/modules/users/users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto: CreateUserDto = {
        dateOfBirth: '1990-01-01',
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        username: 'testuser',
      };

      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            dateOfBirth: expect.any(Date),
            email: createUserDto.email,
            name: createUserDto.name,
            password: createUserDto.password,
            username: createUserDto.username,
          }),
        }),
      );
    });

    it('should throw ConflictException when username or email already exists', async () => {
      const createUserDto: CreateUserDto = {
        dateOfBirth: '1990-01-01',
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        username: 'testuser',
      };

      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          clientVersion: '5.0.0',
          code: 'P2002',
        },
      );

      prisma.user.create.mockRejectedValue(prismaError);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        'Username or email already exists',
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of users with profiles', async () => {
      const users = [createMockUserWithProfile()];
      prisma.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            profile: true,
          },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a user with profile', async () => {
      const user = createMockUserWithProfile();
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findOne(1);

      expect(result).toEqual(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            profile: true,
          },
          where: { id: 1 },
        }),
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'User with ID 999 not found',
      );
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      prisma.user.update.mockResolvedValue({
        ...mockUser,
        name: 'Updated Name',
      });

      const result = await service.update(1, updateUserDto);

      expect(result.name).toBe('Updated Name');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: updateUserDto,
          where: { id: 1 },
        }),
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const prismaError = new PrismaClientKnownRequestError(
        'Record not found',
        {
          clientVersion: '5.0.0',
          code: 'P2025',
        },
      );

      prisma.user.update.mockRejectedValue(prismaError);

      await expect(service.update(999, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when updating to existing username/email', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'existing@example.com',
      };

      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          clientVersion: '5.0.0',
          code: 'P2002',
        },
      );

      prisma.user.update.mockRejectedValue(prismaError);

      await expect(service.update(1, updateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      prisma.user.delete.mockResolvedValue(mockUser);

      const result = await service.remove(1);

      expect(result).toEqual(mockUser);
      expect(prisma.user.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
        }),
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Record not found',
        {
          clientVersion: '5.0.0',
          code: 'P2025',
        },
      );

      prisma.user.delete.mockRejectedValue(prismaError);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
