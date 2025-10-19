import { Injectable, NotFoundException } from '@nestjs/common';
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
}
