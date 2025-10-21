/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { mockReaction } from 'test/utils';

import { CreateReactionDto } from '@/modules/reactions/dto/create-reaction.dto';
import { UpdateReactionDto } from '@/modules/reactions/dto/update-reaction.dto';
import { ReactionsController } from '@/modules/reactions/reactions.controller';
import { ReactionsService } from '@/modules/reactions/reactions.service';

describe('ReactionsController', () => {
  let controller: ReactionsController;
  let service: ReactionsService;

  const mockReactionsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReactionsController],
      providers: [
        {
          provide: ReactionsService,
          useValue: mockReactionsService,
        },
      ],
    }).compile();

    controller = module.get<ReactionsController>(ReactionsController);
    service = module.get<ReactionsService>(ReactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new reaction', async () => {
      const createReactionDto: CreateReactionDto = {
        emoji: '👍',
        messageId: 1,
        userId: 1,
      };

      mockReactionsService.create.mockResolvedValue(mockReaction);

      const result = await controller.create(createReactionDto);

      expect(result).toEqual(mockReaction);
      expect(service.create).toHaveBeenCalledWith(createReactionDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of reactions', async () => {
      const reactions = [mockReaction];
      mockReactionsService.findAll.mockResolvedValue(reactions);

      const result = await controller.findAll();

      expect(result).toEqual(reactions);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a reaction by composite key', async () => {
      mockReactionsService.findOne.mockResolvedValue(mockReaction);

      const result = await controller.findOne('1', '1');

      expect(result).toEqual(mockReaction);
      expect(service.findOne).toHaveBeenCalledWith(1, 1);
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
      mockReactionsService.update.mockResolvedValue(updatedReaction);

      const result = await controller.update('1', '1', updateReactionDto);

      expect(result).toEqual(updatedReaction);
      expect(service.update).toHaveBeenCalledWith(1, 1, updateReactionDto);
    });
  });

  describe('remove', () => {
    it('should delete a reaction', async () => {
      mockReactionsService.remove.mockResolvedValue(mockReaction);

      const result = await controller.remove('1', '1');

      expect(result).toEqual(mockReaction);
      expect(service.remove).toHaveBeenCalledWith(1, 1);
    });
  });
});
