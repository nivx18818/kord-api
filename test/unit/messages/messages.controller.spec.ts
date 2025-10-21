/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { createMockMessageWithRelations, mockMessage } from 'test/utils';

import { CreateMessageDto } from '@/modules/messages/dto/create-message.dto';
import { UpdateMessageDto } from '@/modules/messages/dto/update-message.dto';
import { MessagesController } from '@/modules/messages/messages.controller';
import { MessagesService } from '@/modules/messages/messages.service';

describe('MessagesController', () => {
  let controller: MessagesController;
  let service: MessagesService;

  const mockMessagesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        {
          provide: MessagesService,
          useValue: mockMessagesService,
        },
      ],
    }).compile();

    controller = module.get<MessagesController>(MessagesController);
    service = module.get<MessagesService>(MessagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new message', async () => {
      const createMessageDto: CreateMessageDto = {
        channelId: 1,
        content: { text: 'Hello, world!' },
        userId: 1,
      };

      const message = createMockMessageWithRelations();
      mockMessagesService.create.mockResolvedValue(message);

      const result = await controller.create(createMessageDto);

      expect(result).toEqual(message);
      expect(service.create).toHaveBeenCalledWith(createMessageDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of messages', async () => {
      const messages = [createMockMessageWithRelations()];
      mockMessagesService.findAll.mockResolvedValue(messages);

      const result = await controller.findAll();

      expect(result).toEqual(messages);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a message by id', async () => {
      const message = createMockMessageWithRelations();
      mockMessagesService.findOne.mockResolvedValue(message);

      const result = await controller.findOne('1');

      expect(result).toEqual(message);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a message', async () => {
      const updateMessageDto: UpdateMessageDto = {
        content: { text: 'Updated message' },
      };

      const updatedMessage = {
        ...mockMessage,
        content: { text: 'Updated message' },
      };
      mockMessagesService.update.mockResolvedValue(updatedMessage);

      const result = await controller.update('1', updateMessageDto);

      expect(result).toEqual(updatedMessage);
      expect(service.update).toHaveBeenCalledWith(1, updateMessageDto);
    });
  });

  describe('remove', () => {
    it('should soft delete a message', async () => {
      const deletedMessage = { ...mockMessage, deletedAt: new Date() };
      mockMessagesService.remove.mockResolvedValue(deletedMessage);

      const result = await controller.remove('1');

      expect(result).toEqual(deletedMessage);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
