import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';

import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  private readonly includeOptions = {
    server: true,
    users: {
      include: {
        server: true,
        user: true,
      },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    try {
      return await this.prisma.role.create({
        include: this.includeOptions,
        data: createRoleDto,
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
    return await this.prisma.role.findMany({
      include: this.includeOptions,
    });
  }

  async findOne(id: number) {
    const role = await this.prisma.role.findUnique({
      include: this.includeOptions,
      where: { id },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async remove(id: number) {
    try {
      return await this.prisma.role.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }
      throw error;
    }
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    try {
      return await this.prisma.role.update({
        include: this.includeOptions,
        where: { id },
        data: updateRoleDto,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }
      throw error;
    }
  }
}
