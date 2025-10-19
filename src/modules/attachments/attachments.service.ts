import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeOptions = {
    message: true,
  };

  async create(createAttachmentDto: CreateAttachmentDto) {
    try {
      return await this.prisma.attachment.create({
        data: createAttachmentDto,
        include: this.includeOptions,
      });
    } catch (error) {
      if (error.code === 'P2003') {
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
      where: { id },
      include: this.includeOptions,
    });
    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }
    return attachment;
  }

  async update(id: number, updateAttachmentDto: UpdateAttachmentDto) {
    try {
      return await this.prisma.attachment.update({
        where: { id },
        data: updateAttachmentDto,
        include: this.includeOptions,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Attachment with ID ${id} not found`);
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
      if (error.code === 'P2025') {
        throw new NotFoundException(`Attachment with ID ${id} not found`);
      }
      throw error;
    }
  }
}
