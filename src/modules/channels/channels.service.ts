import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeOptions = {
    server: true,
    messages: {
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
  };

  async create(createChannelDto: CreateChannelDto) {
    try {
      return await this.prisma.channel.create({
        data: createChannelDto,
        include: this.includeOptions,
      });
    } catch (error) {
      if (error.code === 'P2003') {
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
      where: { id },
      include: this.includeOptions,
    });
    if (!channel) {
      throw new NotFoundException(`Channel with ID ${id} not found`);
    }
    return channel;
  }

  async update(id: number, updateChannelDto: UpdateChannelDto) {
    try {
      return await this.prisma.channel.update({
        where: { id },
        data: updateChannelDto,
        include: this.includeOptions,
      });
    } catch (error) {
      if (error.code === 'P2025') {
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
      if (error.code === 'P2025') {
        throw new NotFoundException(`Channel with ID ${id} not found`);
      }
      throw error;
    }
  }
}
