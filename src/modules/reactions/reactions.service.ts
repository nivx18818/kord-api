import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { UpdateReactionDto } from './dto/update-reaction.dto';

@Injectable()
export class ReactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createReactionDto: CreateReactionDto) {
    return this.prisma.reaction.create({
      include: {
        message: true,
        user: true,
      },
      data: createReactionDto,
    });
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
    return this.prisma.reaction.update({
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
  }

  async remove(messageId: number, userId: number) {
    return this.prisma.reaction.delete({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
    });
  }
}
