import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';

import {
  Permission,
  PermissionsMap,
} from '@/common/constants/permissions.enum';
import {
  RoleNotFoundException,
  ServerNotFoundException,
} from '@/common/exceptions/kord.exceptions';

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
        throw new ServerNotFoundException(createRoleDto.serverId);
      }
      throw error;
    }
  }

  async findAll(serverId?: number) {
    return await this.prisma.role.findMany({
      include: this.includeOptions,
      where: serverId ? { serverId } : undefined,
    });
  }

  async findOne(id: number) {
    const role = await this.prisma.role.findUnique({
      include: this.includeOptions,
      where: { id },
    });
    if (!role) {
      throw new RoleNotFoundException(id);
    }
    return role;
  }

  async getUserRole(userId: number, serverId: number) {
    const membership = await this.prisma.membership.findUnique({
      include: {
        role: true,
      },
      where: {
        userId_serverId: {
          serverId,
          userId,
        },
      },
    });

    return membership?.role || null;
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
        throw new RoleNotFoundException(id);
      }
      throw error;
    }
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
        throw new RoleNotFoundException(id);
      }
      throw error;
    }
  }

  async removeRoleFromUser(userId: number, serverId: number) {
    try {
      return await this.prisma.membership.update({
        include: {
          role: true,
          server: true,
          user: true,
        },
        where: {
          userId_serverId: {
            serverId,
            userId,
          },
        },
        data: {
          roleId: null,
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new RoleNotFoundException(userId);
      }
      throw error;
    }
  }

  async assignRoleToUser(userId: number, serverId: number, roleId: number) {
    try {
      return await this.prisma.membership.update({
        include: {
          role: true,
          server: true,
          user: true,
        },
        where: {
          userId_serverId: {
            serverId,
            userId,
          },
        },
        data: {
          roleId,
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new RoleNotFoundException(roleId);
      }
      throw error;
    }
  }

  async checkUserPermissions(
    userId: number,
    serverId: number,
    requiredPermissions: Permission[],
  ): Promise<boolean> {
    const membership = await this.prisma.membership.findUnique({
      include: {
        role: true,
      },
      where: {
        userId_serverId: {
          serverId,
          userId,
        },
      },
    });

    if (!membership || !membership.role) {
      return false;
    }

    const userPermissions = membership.role.permissions as PermissionsMap;

    return requiredPermissions.every(
      (permission) => userPermissions[permission] === true,
    );
  }
}
