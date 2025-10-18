import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';

@Injectable()
export class ServersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeOptions = {
    channels: true,
    members: {
      include: {
        user: true,
        role: true,
      },
    },
    roles: true,
  };

  async create(createServerDto: CreateServerDto) {
    try {
      return await this.prisma.server.create({
        data: createServerDto,
        include: this.includeOptions,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Servername already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.server.findMany({
      include: this.includeOptions,
    });
  }

  async findOne(id: number) {
    const server = await this.prisma.server.findUnique({
      where: { id },
      include: this.includeOptions,
    });
    if (!server) {
      throw new NotFoundException(`Server with ID ${id} not found`);
    }
    return server;
  }

  async update(id: number, updateServerDto: UpdateServerDto) {
    try {
      return await this.prisma.server.update({
        where: { id },
        data: updateServerDto,
        include: this.includeOptions,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Server with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Servername already exists');
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.server.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Server with ID ${id} not found`);
      }
      throw error;
    }
  }
}
