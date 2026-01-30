import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from 'generated/prisma/internal/prismaNamespace';
import { createMockPrismaService, mockProfile } from 'test/utils';

import { PrismaService } from '@/modules/prisma/prisma.service';
import { CreateProfileDto } from '@/modules/profiles/dto/create-profile.dto';
import { UpdateProfileDto } from '@/modules/profiles/dto/update-profile.dto';
import { ProfilesService } from '@/modules/profiles/profiles.service';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a profile', async () => {
      const createProfileDto: CreateProfileDto = {
        bio: 'Test bio',
        userId: 1,
      };

      const profileWithUser = { ...mockProfile, user: {} };
      prisma.profile.create.mockResolvedValue(profileWithUser);

      const result = await service.create(createProfileDto);

      expect(result).toEqual(profileWithUser);
      expect(prisma.profile.create.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throw ConflictException when profile already exists', async () => {
      const createProfileDto: CreateProfileDto = {
        userId: 1,
      };

      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          clientVersion: '5.0.0',
          code: 'P2002',
        },
      );

      prisma.profile.create.mockRejectedValue(prismaError);

      await expect(service.create(createProfileDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of profiles', async () => {
      const profiles = [mockProfile];
      prisma.profile.findMany.mockResolvedValue(profiles);

      const result = await service.findAll();

      expect(result).toEqual(profiles);
      expect(prisma.profile.findMany.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('findOne', () => {
    it('should return a profile by userId', async () => {
      prisma.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.findOne(1);

      expect(result).toEqual(mockProfile);
      expect(prisma.profile.findUnique.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('update', () => {
    it('should update a profile', async () => {
      const updateProfileDto: UpdateProfileDto = {
        bio: 'Updated bio',
      };

      const updatedProfile = {
        ...mockProfile,
        bio: 'Updated bio',
      };
      prisma.profile.update.mockResolvedValue(updatedProfile);

      const result = await service.update(1, updateProfileDto);

      expect(result.bio).toBe('Updated bio');
      expect(prisma.profile.update.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when profile not found', async () => {
      const updateProfileDto: UpdateProfileDto = {};

      const prismaError = new PrismaClientKnownRequestError(
        'Record not found',
        {
          clientVersion: '5.0.0',
          code: 'P2025',
        },
      );

      prisma.profile.update.mockRejectedValue(prismaError);

      await expect(service.update(999, updateProfileDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a profile', async () => {
      prisma.profile.delete.mockResolvedValue(mockProfile);

      const result = await service.remove(1);

      expect(result).toEqual(mockProfile);
      expect(prisma.profile.delete.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when profile not found', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Record not found',
        {
          clientVersion: '5.0.0',
          code: 'P2025',
        },
      );

      prisma.profile.delete.mockRejectedValue(prismaError);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
