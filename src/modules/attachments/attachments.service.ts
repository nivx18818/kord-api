import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';

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
        data: createAttachmentDto,
        include: this.includeOptions,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new NotFoundException('Message not found');
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
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }
    return attachment;
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
        throw new NotFoundException(`Attachment with ID ${id} not found`);
      }
      throw error;
    }
  }

  async update(id: number, updateAttachmentDto: UpdateAttachmentDto) {
    try {
      return await this.prisma.attachment.update({
        data: updateAttachmentDto,
        include: this.includeOptions,
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Attachment with ID ${id} not found`);
      }
      throw error;
    }
  }
}
