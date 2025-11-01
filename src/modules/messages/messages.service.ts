import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';

import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessagesGateway } from './messages.gateway';

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  async create(createMessageDto: CreateMessageDto) {
    try {
      const message = await this.prisma.message.create({
        include: this.includeOptions,
        data: createMessageDto,
      });

      // Broadcast the new message to all clients in the channel
      this.messagesGateway.broadcastMessageCreated({
        channelId: message.channelId,
        message,
      });

      return message;
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

  async findAll(channelId?: number, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    return await this.prisma.message.findMany({
      include: this.includeOptions,
      where: {
        channelId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
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

  async update(id: number, updateMessageDto: UpdateMessageDto) {
    try {
      const message = await this.prisma.message.update({
        include: this.includeOptions,
        where: {
          deletedAt: null,
          id,
        },
        data: updateMessageDto,
      });

      // Broadcast the updated message
      this.messagesGateway.broadcastMessageUpdated({
        channelId: message.channelId,
        message,
      });

      return message;
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

  async remove(id: number) {
    try {
      const message = await this.prisma.message.update({
        include: this.includeOptions,
        where: {
          deletedAt: null,
          id,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      // Broadcast the deletion
      this.messagesGateway.broadcastMessageDeleted({
        channelId: message.channelId,
        messageId: message.id,
      });

      return message;
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
