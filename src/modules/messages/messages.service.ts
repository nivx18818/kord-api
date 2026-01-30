import { ForbiddenException, Injectable } from '@nestjs/common';
import { Message } from 'generated/prisma';
import { PrismaClientKnownRequestError } from 'generated/prisma/internal/prismaNamespace';

import {
  buildCursorPaginatedResponse,
  MessagePaginationDto,
} from '@/common/dto/pagination.dto';
import {
  ChannelNotFoundException,
  MessageNotFoundException,
  UserNotFoundException,
} from '@/common/exceptions/kord.exceptions';

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
        const meta = error.meta as { field_name?: string };
        if (meta?.field_name?.includes('userId')) {
          throw new UserNotFoundException(createMessageDto.userId);
        } else if (meta?.field_name?.includes('channelId')) {
          throw new ChannelNotFoundException(createMessageDto.channelId);
        }
        // Generic message when we can't determine which FK failed
        throw new MessageNotFoundException('User or channel not found');
      }
      throw error;
    }
  }

  async findAll(channelId?: number, pagination?: MessagePaginationDto) {
    const limit = pagination?.limit ?? 50;
    const after = pagination?.after ? new Date(pagination.after) : undefined;
    const before = pagination?.before ? new Date(pagination.before) : undefined;

    const messages = await this.prisma.message.findMany({
      include: this.includeOptions,
      where: {
        channelId,
        deletedAt: null,
        ...(after && {
          createdAt: {
            lt: after,
          },
        }),
        ...(before && {
          createdAt: {
            gt: before,
          },
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;

    const newAfter =
      items.length > 0
        ? items[items.length - 1]?.createdAt?.toISOString()
        : undefined;
    const newBefore =
      items.length > 0 ? items[0]?.createdAt?.toISOString() : undefined;

    return buildCursorPaginatedResponse<Message>(
      items,
      limit,
      hasMore,
      newBefore,
      newAfter,
    );
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
      throw new MessageNotFoundException(id);
    }
    return message;
  }

  async update(id: number, updateMessageDto: UpdateMessageDto, userId: number) {
    try {
      // First, fetch the message to check ownership
      const existingMessage = await this.prisma.message.findUnique({
        select: { userId: true },
        where: { id },
      });

      if (!existingMessage) {
        throw new MessageNotFoundException(id);
      }

      // Check if the user owns the message
      if (existingMessage.userId !== userId) {
        throw new ForbiddenException('You can only edit your own messages');
      }

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
        throw new MessageNotFoundException(id);
      }
      throw error;
    }
  }

  async remove(id: number, userId: number) {
    try {
      // First, fetch the message to check ownership
      const existingMessage = await this.prisma.message.findUnique({
        select: { userId: true },
        where: { id },
      });

      if (!existingMessage) {
        throw new MessageNotFoundException(id);
      }

      // Check if the user owns the message
      if (existingMessage.userId !== userId) {
        throw new ForbiddenException('You can only delete your own messages');
      }

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
        throw new MessageNotFoundException(id);
      }
      throw error;
    }
  }
}
