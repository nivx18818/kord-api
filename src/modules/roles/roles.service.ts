import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';

import {
  Permission,
  PermissionsMap,
} from '@/common/constants/permissions.enum';
import {
  KordForbiddenException,
  MissingPermissionsException,
  NotMemberOfServerException,
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

  /**
   * Checks if user has required permissions in a server
   */
  async checkServerPermissions(
    userId: number,
    serverId: number,
    requiredPermissions: Permission[],
  ): Promise<boolean> {
    // First check if the server exists to differentiate 404 from 403
    const serverExists = await this.prisma.server.findUnique({
      select: { id: true },
      where: { id: serverId },
    });

    // If server doesn't exist, allow the request through
    // The controller/service layer will throw proper NotFoundException
    if (!serverExists) {
      return true;
    }

    // Get user's membership with role
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

    if (!membership) {
      throw new NotMemberOfServerException();
    }

    // If no role is assigned, user has no permissions
    if (!membership.role) {
      throw new KordForbiddenException('User has no role assigned');
    }

    // Parse permissions from role JSON
    const permissionsRaw = membership.role.permissions;
    const userPermissions: PermissionsMap =
      typeof permissionsRaw === 'string'
        ? (JSON.parse(permissionsRaw) as PermissionsMap)
        : (permissionsRaw as PermissionsMap);

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(
      (permission) => userPermissions[permission] === true,
    );

    if (!hasAllPermissions) {
      throw new MissingPermissionsException(requiredPermissions);
    }

    return true;
  }
}
