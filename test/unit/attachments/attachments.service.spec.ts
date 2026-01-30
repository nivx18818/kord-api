import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from 'generated/prisma/internal/prismaNamespace';
import { createMockPrismaService, mockAttachment } from 'test/utils';

import { AttachmentsService } from '@/modules/attachments/attachments.service';
import { CreateAttachmentDto } from '@/modules/attachments/dto/create-attachment.dto';
import { UpdateAttachmentDto } from '@/modules/attachments/dto/update-attachment.dto';
import { PrismaService } from '@/modules/prisma/prisma.service';

describe('AttachmentsService', () => {
  let service: AttachmentsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AttachmentsService>(AttachmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an attachment', async () => {
      const createAttachmentDto: CreateAttachmentDto = {
        messageId: 1,
        size: 1024,
        type: 'image/jpeg',
        url: 'https://example.com/file.jpg',
      };

      const attachmentWithMessage = { ...mockAttachment, message: {} };
      prisma.attachment.create.mockResolvedValue(attachmentWithMessage);

      const result = await service.create(createAttachmentDto);

      expect(result).toEqual(attachmentWithMessage);
      expect(prisma.attachment.create.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when message not found', async () => {
      const createAttachmentDto: CreateAttachmentDto = {
        messageId: 999,
        url: 'https://example.com/file.jpg',
      };

      const prismaError = new PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          clientVersion: '5.0.0',
          code: 'P2003',
        },
      );

      prisma.attachment.create.mockRejectedValue(prismaError);

      await expect(service.create(createAttachmentDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of attachments', async () => {
      const attachments = [mockAttachment];
      prisma.attachment.findMany.mockResolvedValue(attachments);

      const result = await service.findAll();

      expect(result).toEqual(attachments);
      expect(prisma.attachment.findMany.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('findOne', () => {
    it('should return an attachment', async () => {
      prisma.attachment.findUnique.mockResolvedValue(mockAttachment);

      const result = await service.findOne(1);

      expect(result).toEqual(mockAttachment);
      expect(prisma.attachment.findUnique.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when attachment not found', async () => {
      prisma.attachment.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
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
      prisma.attachment.update.mockResolvedValue(updatedAttachment);

      const result = await service.update(1, updateAttachmentDto);

      expect(result.url).toBe('https://example.com/updated.jpg');
      expect(prisma.attachment.update.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when attachment not found', async () => {
      const updateAttachmentDto: UpdateAttachmentDto = {};

      const prismaError = new PrismaClientKnownRequestError(
        'Record not found',
        {
          clientVersion: '5.0.0',
          code: 'P2025',
        },
      );

      prisma.attachment.update.mockRejectedValue(prismaError);

      await expect(service.update(999, updateAttachmentDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete an attachment', async () => {
      prisma.attachment.delete.mockResolvedValue(mockAttachment);

      const result = await service.remove(1);

      expect(result).toEqual(mockAttachment);
      expect(prisma.attachment.delete.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when attachment not found', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Record not found',
        {
          clientVersion: '5.0.0',
          code: 'P2025',
        },
      );

      prisma.attachment.delete.mockRejectedValue(prismaError);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
