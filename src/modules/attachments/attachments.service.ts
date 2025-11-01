import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';

import {
  AttachmentNotFoundException,
  MessageNotFoundException,
} from '@/common/exceptions/kord.exceptions';

import { PrismaService } from '../prisma/prisma.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';

@Injectable()
export class AttachmentsService {
  private readonly includeOptions = {
    message: true,
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(createAttachmentDto: CreateAttachmentDto) {
    try {
      return await this.prisma.attachment.create({
        include: this.includeOptions,
        data: createAttachmentDto,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new MessageNotFoundException(createAttachmentDto.messageId);
      }
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.attachment.findMany({
      include: this.includeOptions,
    });
  }

  async findOne(id: number) {
    const attachment = await this.prisma.attachment.findUnique({
      include: this.includeOptions,
      where: { id },
    });
    if (!attachment) {
      throw new AttachmentNotFoundException(id);
    }
    return attachment;
  }

  async update(id: number, updateAttachmentDto: UpdateAttachmentDto) {
    try {
      return await this.prisma.attachment.update({
        include: this.includeOptions,
        where: { id },
        data: updateAttachmentDto,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new AttachmentNotFoundException(id);
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.attachment.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new AttachmentNotFoundException(id);
      }
      throw error;
    }
  }
}
