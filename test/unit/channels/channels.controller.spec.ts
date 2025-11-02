/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import {
  createMockChannelWithRelations,
  createMockPrismaService,
  mockChannel,
} from 'test/utils';

import { RolesGuard } from '@/common/guards/roles.guard';
import { ChannelsController } from '@/modules/channels/channels.controller';
import { ChannelsService } from '@/modules/channels/channels.service';
import { CreateChannelDto } from '@/modules/channels/dto/create-channel.dto';
import { UpdateChannelDto } from '@/modules/channels/dto/update-channel.dto';
import { PrismaService } from '@/modules/prisma/prisma.service';

describe('ChannelsController', () => {
  let controller: ChannelsController;
  let service: ChannelsService;

  const mockChannelsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  const mockRolesGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChannelsController],
      providers: [
        {
          provide: ChannelsService,
          useValue: mockChannelsService,
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<ChannelsController>(ChannelsController);
    service = module.get<ChannelsService>(ChannelsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new channel', async () => {
      const createChannelDto: CreateChannelDto = {
        name: 'general',
        serverId: 1,
      };

      const channel = createMockChannelWithRelations();
      mockChannelsService.create.mockResolvedValue(channel);

      const result = await controller.create(createChannelDto);

      expect(result).toEqual(channel);
      expect(service.create).toHaveBeenCalledWith(createChannelDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of channels', async () => {
      const channels = [createMockChannelWithRelations()];
      mockChannelsService.findAll.mockResolvedValue(channels);

      const result = await controller.findAll();

      expect(result).toEqual(channels);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a channel by id', async () => {
      const channel = createMockChannelWithRelations();
      mockChannelsService.findOne.mockResolvedValue(channel);

      const result = await controller.findOne('1');

      expect(result).toEqual(channel);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a channel', async () => {
      const updateChannelDto: UpdateChannelDto = {
        name: 'Updated Channel',
      };

      const updatedChannel = { ...mockChannel, name: 'Updated Channel' };
      mockChannelsService.update.mockResolvedValue(updatedChannel);

      const result = await controller.update('1', updateChannelDto);

      expect(result).toEqual(updatedChannel);
      expect(service.update).toHaveBeenCalledWith(1, updateChannelDto);
    });
  });

  describe('remove', () => {
    it('should delete a channel', async () => {
      mockChannelsService.remove.mockResolvedValue(mockChannel);

      const result = await controller.remove('1');

      expect(result).toEqual(mockChannel);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
