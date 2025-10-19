import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';

import { PrismaService } from '../prisma/prisma.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';

@Injectable()
export class ServersService {
  private readonly includeOptions = {
    channels: true,
    members: {
      include: {
        role: true,
        user: true,
      },
    },
    roles: true,
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(createServerDto: CreateServerDto) {
    try {
      return await this.prisma.server.create({
        include: this.includeOptions,
        data: createServerDto,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
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
      include: this.includeOptions,
      where: { id },
    });
    if (!server) {
      throw new NotFoundException(`Server with ID ${id} not found`);
    }
    return server;
  }

  async remove(id: number) {
    try {
      return await this.prisma.server.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Server with ID ${id} not found`);
      }
      throw error;
    }
  }

  async update(id: number, updateServerDto: UpdateServerDto) {
    try {
      return await this.prisma.server.update({
        include: this.includeOptions,
        where: { id },
        data: updateServerDto,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Server with ID ${id} not found`);
      }
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Servername already exists');
      }
      throw error;
    }
  }
}
