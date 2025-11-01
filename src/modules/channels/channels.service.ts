import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';

import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  private readonly includeOptions = {
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
        throw new NotFoundException('Server not found');
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
      throw new NotFoundException(`Channel with ID ${id} not found`);
    }
    return channel;
  }

  async findOrCreateDM(user1Id: number, user2Id: number, serverId: number) {
    // Look for existing DM between these two users
    const existingChannel = await this.prisma.channel.findFirst({
      include: this.includeOptions,
      where: {
        isDM: true,
        serverId,
        // For DMs, we'd need a participant relation table, but for now use messages
      },
    });

    if (existingChannel) {
      return existingChannel;
    }

    // Create new DM channel
    return await this.prisma.channel.create({
      include: this.includeOptions,
      data: {
        isDM: true,
        name: `DM-${user1Id}-${user2Id}`,
        serverId,
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
        throw new NotFoundException(`Channel with ID ${id} not found`);
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
        throw new NotFoundException(`Channel with ID ${id} not found`);
      }
      throw error;
    }
  }

  async blockDM(userId: number, channelId: number) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException(`Channel with ID ${channelId} not found`);
    }

    if (!channel.isDM) {
      throw new ConflictException('Can only block DM channels');
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
        throw new ConflictException('DM already blocked');
      }
      throw error;
    }
  }

  async unblockDM(userId: number, channelId: number) {
    const block = await this.prisma.channelBlock.findFirst({
      where: { channelId, userId },
    });

    if (!block) {
      throw new NotFoundException('DM block not found');
    }

    return await this.prisma.channelBlock.delete({
      where: { id: block.id },
    });
  }
}
