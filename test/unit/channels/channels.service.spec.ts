import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from 'generated/prisma/internal/prismaNamespace';
import {
  createMockChannelWithRelations,
  createMockPrismaService,
  mockChannel,
} from 'test/utils';

import { ChannelsService } from '@/modules/channels/channels.service';
import { CreateChannelDto } from '@/modules/channels/dto/create-channel.dto';
import { UpdateChannelDto } from '@/modules/channels/dto/update-channel.dto';
import { PrismaService } from '@/modules/prisma/prisma.service';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */

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
      await expect(service.findOne(999)).rejects.toThrow('Channel not found');
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

  describe('findOrCreateDM', () => {
    it('should return existing DM channel if found', async () => {
      const mockChannel = {
        ...createMockChannelWithRelations(),
        isDM: true,
        name: 'DM-1-2',
        participants: [{ userId: 1 }, { userId: 2 }],
        status: 'PRIVATE' as const,
      };

      prisma.channel.findMany.mockResolvedValue([mockChannel as any]);

      const result = await service.findOrCreateDM(1, 2, 1);

      expect(result).toEqual(mockChannel);
      expect(prisma.channel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isDM: true,
            serverId: 1,
          },
        }),
      );
    });

    it('should create new DM channel if not found', async () => {
      const mockNewChannel = {
        ...createMockChannelWithRelations(),
        isDM: true,
        name: 'DM-1-2',
        participants: [{ userId: 1 }, { userId: 2 }],
        status: 'PRIVATE' as const,
      };

      prisma.channel.findMany.mockResolvedValue([]);
      prisma.channel.create.mockResolvedValue(mockNewChannel as any);

      const result = await service.findOrCreateDM(1, 2, 1);

      expect(result).toEqual(mockNewChannel);
      expect(prisma.channel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isDM: true,
            name: 'DM-1-2',
            participants: {
              create: [{ userId: 1 }, { userId: 2 }],
            },
            serverId: 1,
            status: 'PRIVATE',
            type: 'TEXT',
          }),
        }),
      );
    });
  });

  describe('getUserDMs', () => {
    it('should return all DM channels for a user', async () => {
      const mockDMs = [
        {
          ...createMockChannelWithRelations(),
          id: 1,
          isDM: true,
          name: 'DM-1-2',
          participants: [{ userId: 1 }, { userId: 2 }],
        },
        {
          ...createMockChannelWithRelations(),
          id: 2,
          isDM: true,
          name: 'DM-1-3',
          participants: [{ userId: 1 }, { userId: 3 }],
        },
      ];

      prisma.channel.findMany.mockResolvedValue(mockDMs as any);

      const result = await service.getUserDMs(1);

      expect(result).toEqual(mockDMs);
      expect(prisma.channel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isDM: true,
            participants: {
              some: {
                userId: 1,
              },
            },
          },
        }),
      );
    });
  });

  describe('addParticipant', () => {
    it('should add a participant to a channel', async () => {
      const mockChannel = createMockChannelWithRelations();
      const mockParticipant = {
        channelId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 2,
      };

      prisma.channel.findUnique.mockResolvedValue(mockChannel as any);
      prisma.channelParticipant.create.mockResolvedValue(
        mockParticipant as any,
      );

      const result = await service.addParticipant(1, 2);

      expect(result).toEqual(mockParticipant);
      expect(prisma.channelParticipant.create).toHaveBeenCalledWith({
        data: {
          channelId: 1,
          userId: 2,
        },
      });
    });

    it('should throw NotFoundException if channel does not exist', async () => {
      prisma.channel.findUnique.mockResolvedValue(null);

      await expect(service.addParticipant(999, 2)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if user is already a participant', async () => {
      const mockChannel = createMockChannelWithRelations();
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          clientVersion: '5.0.0',
          code: 'P2002',
        },
      );

      prisma.channel.findUnique.mockResolvedValue(mockChannel as any);
      prisma.channelParticipant.create.mockRejectedValue(prismaError);

      await expect(service.addParticipant(1, 2)).rejects.toThrow(
        'User is already a participant',
      );
    });
  });

  describe('removeParticipant', () => {
    it('should remove a participant from a channel', async () => {
      const mockParticipant = {
        channelId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 2,
      };

      prisma.channelParticipant.delete.mockResolvedValue(
        mockParticipant as any,
      );

      const result = await service.removeParticipant(1, 2);

      expect(result).toEqual(mockParticipant);
      expect(prisma.channelParticipant.delete).toHaveBeenCalledWith({
        where: {
          userId_channelId: {
            channelId: 1,
            userId: 2,
          },
        },
      });
    });

    it('should throw NotFoundException if participant does not exist', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Record not found',
        {
          clientVersion: '5.0.0',
          code: 'P2025',
        },
      );

      prisma.channelParticipant.delete.mockRejectedValue(prismaError);

      await expect(service.removeParticipant(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
