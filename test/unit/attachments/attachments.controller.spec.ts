/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { mockAttachment } from 'test/utils';

import { AttachmentsController } from '@/modules/attachments/attachments.controller';
import { AttachmentsService } from '@/modules/attachments/attachments.service';
import { CreateAttachmentDto } from '@/modules/attachments/dto/create-attachment.dto';
import { UpdateAttachmentDto } from '@/modules/attachments/dto/update-attachment.dto';

describe('AttachmentsController', () => {
  let controller: AttachmentsController;
  let service: AttachmentsService;

  const mockAttachmentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttachmentsController],
      providers: [
        {
          provide: AttachmentsService,
          useValue: mockAttachmentsService,
        },
      ],
    }).compile();

    controller = module.get<AttachmentsController>(AttachmentsController);
    service = module.get<AttachmentsService>(AttachmentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new attachment', async () => {
      const createAttachmentDto: CreateAttachmentDto = {
        messageId: 1,
        url: 'https://example.com/file.jpg',
      };

      mockAttachmentsService.create.mockResolvedValue(mockAttachment);

      const result = await controller.create(createAttachmentDto);

      expect(result).toEqual(mockAttachment);
      expect(service.create).toHaveBeenCalledWith(createAttachmentDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of attachments', async () => {
      const attachments = [mockAttachment];
      mockAttachmentsService.findAll.mockResolvedValue(attachments);

      const result = await controller.findAll();

      expect(result).toEqual(attachments);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an attachment by id', async () => {
      mockAttachmentsService.findOne.mockResolvedValue(mockAttachment);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockAttachment);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update an attachment', async () => {
      const updateAttachmentDto: UpdateAttachmentDto = {
        url: 'https://example.com/updated.jpg',
      };

      const updatedAttachment = {
        ...mockAttachment,
        url: 'https://example.com/updated.jpg',
      };
      mockAttachmentsService.update.mockResolvedValue(updatedAttachment);

      const result = await controller.update('1', updateAttachmentDto);

      expect(result).toEqual(updatedAttachment);
      expect(service.update).toHaveBeenCalledWith(1, updateAttachmentDto);
    });
  });

  describe('remove', () => {
    it('should delete an attachment', async () => {
      mockAttachmentsService.remove.mockResolvedValue(mockAttachment);

      const result = await controller.remove('1');

      expect(result).toEqual(mockAttachment);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
