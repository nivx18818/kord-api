/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { createMockPrismaService, mockReaction } from 'test/utils';

import { PrismaService } from '@/modules/prisma/prisma.service';
import { CreateReactionDto } from '@/modules/reactions/dto/create-reaction.dto';
import { UpdateReactionDto } from '@/modules/reactions/dto/update-reaction.dto';
import { ReactionsService } from '@/modules/reactions/reactions.service';

describe('ReactionsService', () => {
  let service: ReactionsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ReactionsService>(ReactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a reaction', async () => {
      const createReactionDto: CreateReactionDto = {
        emoji: '👍',
        messageId: 1,
        userId: 1,
      };

      const reactionWithRelations = { ...mockReaction, message: {}, user: {} };
      prisma.reaction.create.mockResolvedValue(reactionWithRelations);

      const result = await service.create(createReactionDto);

      expect(result).toEqual(reactionWithRelations);
      expect(prisma.reaction.create.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('findAll', () => {
    it('should return an array of reactions', async () => {
      const reactions = [mockReaction];
      prisma.reaction.findMany.mockResolvedValue(reactions);

      const result = await service.findAll();

      expect(result).toEqual(reactions);
      expect(prisma.reaction.findMany.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('findOne', () => {
    it('should return a reaction by composite key', async () => {
      prisma.reaction.findUnique.mockResolvedValue(mockReaction);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockReaction);
      expect(prisma.reaction.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            messageId_userId: {
              messageId: 1,
              userId: 1,
            },
          },
        }),
      );
    });
  });

  describe('update', () => {
    it('should update a reaction', async () => {
      const updateReactionDto: UpdateReactionDto = {
        emoji: '❤️',
      };

      const updatedReaction = {
        ...mockReaction,
        emoji: '❤️',
      };
      prisma.reaction.update.mockResolvedValue(updatedReaction);

      const result = await service.update(1, 1, updateReactionDto);

      expect(result.emoji).toBe('❤️');
      expect(prisma.reaction.update.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('remove', () => {
    it('should delete a reaction', async () => {
      prisma.reaction.delete.mockResolvedValue(mockReaction);

      const result = await service.remove(1, 1);

      expect(result).toEqual(mockReaction);
      expect(prisma.reaction.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            messageId_userId: {
              messageId: 1,
              userId: 1,
            },
          },
        }),
      );
    });
  });
});
