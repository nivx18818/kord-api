import { Injectable } from '@nestjs/common';
import {
  type ChannelInclude,
  PrismaClientKnownRequestError,
} from 'generated/prisma/internal/prismaNamespace';

import {
  CanOnlyBlockDMChannelsException,
  ChannelNotFoundException,
  ChannelParticipantNotFoundException,
  DMAlreadyBlockedException,
  DMBlockNotFoundException,
  ServerNotFoundException,
  UserAlreadyParticipantException,
} from '@/common/exceptions/kord.exceptions';

import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  private readonly includeOptions: ChannelInclude = {
    messages: {
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
    participants: {
      include: {
        user: {
          select: {
            email: true,
            id: true,
            name: true,
            username: true,
          },
        },
      },
    },
    server: true,
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(createChannelDto: CreateChannelDto) {
    try {
      return await this.prisma.channel.create({
        include: this.includeOptions,
        data: createChannelDto,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ServerNotFoundException(createChannelDto.serverId!);
      }
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.channel.findMany({
      include: this.includeOptions,
    });
  }

  async findOne(id: number) {
    const channel = await this.prisma.channel.findUnique({
      include: this.includeOptions,
      where: { id },
    });
    if (!channel) {
      throw new ChannelNotFoundException(id);
    }
    return channel;
  }

  async findOrCreateDM(userId: number, otherParticipantIds: number[]) {
    const allParticipantIds = [userId, ...otherParticipantIds].sort();

    // Look for existing DM with exact same participants
    const channels = await this.prisma.channel.findMany({
      include: {
        participants: {
          select: {
            userId: true,
          },
        },
      },
      where: {
        isDM: true,
      },
    });

    // Filter to find channel with exactly these two participants
    for (const channel of channels) {
      const channelParticipantIds = channel.participants
        .map((p) => p.userId)
        .sort();

      if (
        channelParticipantIds.length === allParticipantIds.length &&
        channelParticipantIds.every(
          (id, index) => id === allParticipantIds[index],
        )
      ) {
        return await this.findOne(channel.id);
      }
    }

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
      },
      where: {
        id: { in: allParticipantIds },
      },
    });

    const otherUsernames = otherParticipantIds
      .map((id) => users.find((u) => u.id === id)?.username)
      .filter(Boolean);

    const groupDMName = otherUsernames.join(', ');

    // Create new DM channel with participants
    return await this.prisma.channel.create({
      include: this.includeOptions,
      data: {
        isDM: true,
        name: groupDMName,
        participants: {
          create: allParticipantIds.map((id) => ({ userId: id })),
        },
        status: 'PRIVATE',
        type: 'TEXT',
      },
    });
  }

  async getBlockedDMs(userId: number) {
    return await this.prisma.channelBlock.findMany({
      include: {
        channel: true,
      },
      where: { userId },
    });
  }

  async getUserDMs(userId: number) {
    return await this.prisma.channel.findMany({
      include: this.includeOptions,
      where: {
        isDM: true,
        participants: {
          some: {
            userId,
          },
        },
      },
    });
  }

  async update(id: number, updateChannelDto: UpdateChannelDto) {
    try {
      return await this.prisma.channel.update({
        include: this.includeOptions,
        where: { id },
        data: updateChannelDto,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new ChannelNotFoundException(id);
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.channel.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new ChannelNotFoundException(id);
      }
      throw error;
    }
  }

  async removeParticipant(channelId: number, userId: number) {
    try {
      return await this.prisma.channelParticipant.delete({
        where: {
          userId_channelId: {
            channelId,
            userId,
          },
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new ChannelParticipantNotFoundException(userId, channelId);
      }
      throw error;
    }
  }

  async addParticipant(channelId: number, userId: number) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new ChannelNotFoundException(channelId);
    }

    try {
      return await this.prisma.channelParticipant.create({
        data: {
          channelId,
          userId,
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new UserAlreadyParticipantException();
      }
      throw error;
    }
  }

  async blockDM(channelId: number, userId: number) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new ChannelNotFoundException(channelId);
    }

    if (!channel.isDM) {
      throw new CanOnlyBlockDMChannelsException();
    }

    try {
      return await this.prisma.channelBlock.create({
        data: {
          channelId,
          userId,
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new DMAlreadyBlockedException();
      }
      throw error;
    }
  }

  async unblockDM(channelId: number, userId: number) {
    const block = await this.prisma.channelBlock.findFirst({
      where: { channelId, userId },
    });

    if (!block) {
      throw new DMBlockNotFoundException();
    }

    return await this.prisma.channelBlock.delete({
      where: { id: block.id },
    });
  }
}
