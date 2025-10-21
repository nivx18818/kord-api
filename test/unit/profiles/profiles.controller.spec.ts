/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { mockProfile } from 'test/utils';

import { CreateProfileDto } from '@/modules/profiles/dto/create-profile.dto';
import { UpdateProfileDto } from '@/modules/profiles/dto/update-profile.dto';
import { ProfilesController } from '@/modules/profiles/profiles.controller';
import { ProfilesService } from '@/modules/profiles/profiles.service';

describe('ProfilesController', () => {
  let controller: ProfilesController;
  let service: ProfilesService;

  const mockProfilesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        {
          provide: ProfilesService,
          useValue: mockProfilesService,
        },
      ],
    }).compile();

    controller = module.get<ProfilesController>(ProfilesController);
    service = module.get<ProfilesService>(ProfilesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new profile', async () => {
      const createProfileDto: CreateProfileDto = {
        bio: 'Test bio',
        userId: 1,
      };

      mockProfilesService.create.mockResolvedValue(mockProfile);

      const result = await controller.create(createProfileDto);

      expect(result).toEqual(mockProfile);
      expect(service.create).toHaveBeenCalledWith(createProfileDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of profiles', async () => {
      const profiles = [mockProfile];
      mockProfilesService.findAll.mockResolvedValue(profiles);

      const result = await controller.findAll();

      expect(result).toEqual(profiles);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a profile by id', async () => {
      mockProfilesService.findOne.mockResolvedValue(mockProfile);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockProfile);
      expect(service.findOne).toHaveBeenCalledWith(1);
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
      mockProfilesService.update.mockResolvedValue(updatedProfile);

      const result = await controller.update('1', updateProfileDto);

      expect(result).toEqual(updatedProfile);
      expect(service.update).toHaveBeenCalledWith(1, updateProfileDto);
    });
  });

  describe('remove', () => {
    it('should delete a profile', async () => {
      mockProfilesService.remove.mockResolvedValue(mockProfile);

      const result = await controller.remove('1');

      expect(result).toEqual(mockProfile);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
