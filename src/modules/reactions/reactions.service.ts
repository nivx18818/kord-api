import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';

import {
  AlreadyReactedException,
  MessageNotFoundException,
} from '@/common/exceptions/kord.exceptions';

import { PrismaService } from '../prisma/prisma.service';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { UpdateReactionDto } from './dto/update-reaction.dto';

@Injectable()
export class ReactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createReactionDto: CreateReactionDto) {
    try {
      return await this.prisma.reaction.create({
        include: {
          message: true,
          user: true,
        },
        data: createReactionDto,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AlreadyReactedException();
      }
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new MessageNotFoundException(createReactionDto.messageId);
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.reaction.findMany({
      include: {
        message: true,
        user: true,
      },
    });
  }

  async findOne(messageId: number, userId: number) {
    return this.prisma.reaction.findUnique({
      include: {
        message: true,
        user: true,
      },
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
    });
  }

  async update(
    messageId: number,
    userId: number,
    updateReactionDto: UpdateReactionDto,
  ) {
    try {
      return await this.prisma.reaction.update({
        include: {
          message: true,
          user: true,
        },
        where: {
          messageId_userId: {
            messageId,
            userId,
          },
        },
        data: updateReactionDto,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new MessageNotFoundException(messageId);
      }
      throw error;
    }
  }

  async remove(messageId: number, userId: number) {
    try {
      return await this.prisma.reaction.delete({
        where: {
          messageId_userId: {
            messageId,
            userId,
          },
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new MessageNotFoundException(messageId);
      }
      throw error;
    }
  }
}
