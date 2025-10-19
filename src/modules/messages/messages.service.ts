import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';

import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  private readonly includeOptions = {
    attachments: true,
    channel: true,
    parentMessage: true,
    reacts: {
      include: {
        user: true,
      },
    },
    replies: {
      include: {
        attachments: true,
        reacts: {
          include: {
            user: true,
          },
        },
        user: true,
      },
    },
    user: true,
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(createMessageDto: CreateMessageDto) {
    try {
      return await this.prisma.message.create({
        include: this.includeOptions,
        data: createMessageDto,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new NotFoundException('User or channel not found');
      }
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.message.findMany({
      include: this.includeOptions,
      where: {
        deletedAt: null,
      },
    });
  }

  async findOne(id: number) {
    const message = await this.prisma.message.findUnique({
      include: this.includeOptions,
      where: {
        deletedAt: null,
        id,
      },
    });
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    return message;
  }

  async remove(id: number) {
    try {
      return await this.prisma.message.update({
        include: this.includeOptions,
        where: {
          deletedAt: null,
          id,
        },
        data: {
          deletedAt: new Date(),
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Message with ID ${id} not found`);
      }
      throw error;
    }
  }

  async update(id: number, updateMessageDto: UpdateMessageDto) {
    try {
      return await this.prisma.message.update({
        include: this.includeOptions,
        where: {
          deletedAt: null,
          id,
        },
        data: updateMessageDto,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Message with ID ${id} not found`);
      }
      throw error;
    }
  }
}
