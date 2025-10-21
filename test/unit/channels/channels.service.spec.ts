import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';
import {
  createMockChannelWithRelations,
  createMockPrismaService,
  mockChannel,
} from 'test/utils';

import { ChannelsService } from '@/modules/channels/channels.service';
import { CreateChannelDto } from '@/modules/channels/dto/create-channel.dto';
import { UpdateChannelDto } from '@/modules/channels/dto/update-channel.dto';
import { PrismaService } from '@/modules/prisma/prisma.service';

describe('ChannelsService', () => {
  let service: ChannelsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ChannelsService>(ChannelsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a channel', async () => {
      const createChannelDto: CreateChannelDto = {
        name: 'general',
        serverId: 1,
      };

      const channelWithRelations = createMockChannelWithRelations();
      prisma.channel.create.mockResolvedValue(channelWithRelations);

      const result = await service.create(createChannelDto);

      expect(result).toEqual(channelWithRelations);
      expect(prisma.channel.create.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when server not found', async () => {
      const createChannelDto: CreateChannelDto = {
        name: 'general',
        serverId: 999,
      };

      const prismaError = new PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          clientVersion: '5.0.0',
          code: 'P2003',
        },
      );

      prisma.channel.create.mockRejectedValue(prismaError);

      await expect(service.create(createChannelDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createChannelDto)).rejects.toThrow(
        'Server not found',
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of channels with relations', async () => {
      const channels = [createMockChannelWithRelations()];
      prisma.channel.findMany.mockResolvedValue(channels);

      const result = await service.findAll();

      expect(result).toEqual(channels);
      expect(prisma.channel.findMany.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('findOne', () => {
    it('should return a channel with relations', async () => {
      const channel = createMockChannelWithRelations();
      prisma.channel.findUnique.mockResolvedValue(channel);

      const result = await service.findOne(1);

      expect(result).toEqual(channel);
      expect(prisma.channel.findUnique.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when channel not found', async () => {
      prisma.channel.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Channel with ID 999 not found',
      );
    });
  });

  describe('update', () => {
    it('should update a channel', async () => {
      const updateChannelDto: UpdateChannelDto = {
        name: 'Updated Channel',
      };

      const updatedChannel = {
        ...createMockChannelWithRelations(),
        name: 'Updated Channel',
      };
      prisma.channel.update.mockResolvedValue(updatedChannel);

      const result = await service.update(1, updateChannelDto);

      expect(result.name).toBe('Updated Channel');
      expect(prisma.channel.update.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when channel not found', async () => {
      const updateChannelDto: UpdateChannelDto = {
        name: 'Updated Channel',
      };

      const prismaError = new PrismaClientKnownRequestError(
        'Record not found',
        {
          clientVersion: '5.0.0',
          code: 'P2025',
        },
      );

      prisma.channel.update.mockRejectedValue(prismaError);

      await expect(service.update(999, updateChannelDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a channel', async () => {
      prisma.channel.delete.mockResolvedValue(mockChannel);

      const result = await service.remove(1);

      expect(result).toEqual(mockChannel);
      expect(prisma.channel.delete.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when channel not found', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Record not found',
        {
          clientVersion: '5.0.0',
          code: 'P2025',
        },
      );

      prisma.channel.delete.mockRejectedValue(prismaError);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
