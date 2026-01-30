/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from 'generated/prisma/internal/prismaNamespace';
import {
  createMockMessageWithRelations,
  createMockPrismaService,
  mockMessage,
} from 'test/utils';

import { CreateMessageDto } from '@/modules/messages/dto/create-message.dto';
import { UpdateMessageDto } from '@/modules/messages/dto/update-message.dto';
import { MessagesGateway } from '@/modules/messages/messages.gateway';
import { MessagesService } from '@/modules/messages/messages.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

describe('MessagesService', () => {
  let service: MessagesService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let messagesGateway: jest.Mocked<MessagesGateway>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    // Create a mock for MessagesGateway
    messagesGateway = {
      broadcastMessageCreated: jest.fn(),
      broadcastMessageDeleted: jest.fn(),
      broadcastMessageUpdated: jest.fn(),
    } as unknown as jest.Mocked<MessagesGateway>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: MessagesGateway,
          useValue: messagesGateway,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a message', async () => {
      const createMessageDto: CreateMessageDto = {
        channelId: 1,
        content: { text: 'Hello, world!' },
        userId: 1,
      };

      const messageWithRelations = createMockMessageWithRelations();
      prisma.message.create.mockResolvedValue(messageWithRelations);

      const result = await service.create(createMessageDto);

      expect(result).toEqual(messageWithRelations);
      expect(prisma.message.create.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when user or channel not found', async () => {
      const createMessageDto: CreateMessageDto = {
        channelId: 999,
        content: { text: 'Hello!' },
        userId: 1,
      };

      const prismaError = new PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          clientVersion: '5.0.0',
          code: 'P2003',
          meta: {},
        },
      );

      prisma.message.create.mockRejectedValue(prismaError);

      await expect(service.create(createMessageDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createMessageDto)).rejects.toThrow(
        'User or channel not found',
      );
    });
  });

  describe('findAll', () => {
    it('should return only non-deleted messages', async () => {
      const messages = [createMockMessageWithRelations()];
      prisma.message.findMany.mockResolvedValue(messages);

      const result = await service.findAll();

      expect(result.items).toEqual(messages);
      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a non-deleted message', async () => {
      const message = createMockMessageWithRelations();
      prisma.message.findUnique.mockResolvedValue(message);

      const result = await service.findOne(1);

      expect(result).toEqual(message);
      expect(prisma.message.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            id: 1,
          },
        }),
      );
    });

    it('should throw NotFoundException when message not found or deleted', async () => {
      prisma.message.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Message not found');
    });
  });

  describe('update', () => {
    it('should update a message', async () => {
      const updateMessageDto: UpdateMessageDto = {
        content: { text: 'Updated message' },
      };

      const existingMessage = {
        userId: 1,
      };

      const updatedMessage = {
        ...createMockMessageWithRelations(),
        content: { text: 'Updated message' },
      };

      /* eslint-disable @typescript-eslint/no-unsafe-argument */
      prisma.message.findUnique.mockResolvedValue(existingMessage as any);
      /* eslint-enable @typescript-eslint/no-unsafe-argument */
      prisma.message.update.mockResolvedValue(updatedMessage);

      const result = await service.update(1, updateMessageDto, 1);

      expect(result.content).toEqual({ text: 'Updated message' });
      expect(prisma.message.findUnique).toHaveBeenCalledWith({
        select: { userId: true },
        where: { id: 1 },
      });
      expect(prisma.message.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when message not found', async () => {
      const updateMessageDto: UpdateMessageDto = {
        content: { text: 'Updated message' },
      };

      prisma.message.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updateMessageDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a message', async () => {
      const existingMessage = {
        userId: 1,
      };

      const softDeletedMessage = {
        ...mockMessage,
        deletedAt: new Date(),
      };

      /* eslint-disable @typescript-eslint/no-unsafe-argument */
      prisma.message.findUnique.mockResolvedValue(existingMessage as any);
      /* eslint-enable @typescript-eslint/no-unsafe-argument */
      prisma.message.update.mockResolvedValue(softDeletedMessage);

      const result = await service.remove(1, 1);

      expect(result.deletedAt).toBeDefined();
      expect(prisma.message.findUnique).toHaveBeenCalledWith({
        select: { userId: true },
        where: { id: 1 },
      });
      expect(prisma.message.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            deletedAt: expect.any(Date),
          },
          where: {
            deletedAt: null,
            id: 1,
          },
        }),
      );
    });

    it('should throw NotFoundException when message not found', async () => {
      prisma.message.findUnique.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
