import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeOptions = {
    user: true,
    channel: true,
    parentMessage: true,
    replies: {
      include: {
        user: true,
        attachments: true,
        reacts: {
          include: {
            user: true,
          },
        },
      },
    },
    attachments: true,
    reacts: {
      include: {
        user: true,
      },
    },
  };

  async create(createMessageDto: CreateMessageDto) {
    try {
      return await this.prisma.message.create({
        data: createMessageDto,
        include: this.includeOptions,
      });
    } catch (error) {
      if (error.code === 'P2003') {
        throw new NotFoundException('User or channel not found');
      }
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.message.findMany({
      where: {
        deletedAt: null,
      },
      include: this.includeOptions,
    });
  }

  async findOne(id: number) {
    const message = await this.prisma.message.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: this.includeOptions,
    });
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    return message;
  }

  async update(id: number, updateMessageDto: UpdateMessageDto) {
    try {
      return await this.prisma.message.update({
        where: {
          id,
          deletedAt: null,
        },
        data: updateMessageDto,
        include: this.includeOptions,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Message with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.message.update({
        where: {
          id,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
        include: this.includeOptions,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Message with ID ${id} not found`);
      }
      throw error;
    }
  }
}
