import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from 'generated/prisma/internal/prismaNamespace';

import {
  Permission,
  PermissionsMap,
} from '@/common/constants/permissions.enum';
import {
  KordForbiddenException,
  MissingPermissionsException,
  NotMemberOfServerException,
  RoleNotFoundException,
  RolesNotFoundException,
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

  async getUserRoles(serverId: number, userId: number) {
    const membershipRoles = await this.prisma.membershipRole.findMany({
      include: {
        role: true,
      },
      where: {
        serverId,
        userId,
      },
    });

    return membershipRoles.map((mr) => mr.role);
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

  async removeAllRolesFromUser(serverId: number, userId: number) {
    return await this.prisma.membershipRole.deleteMany({
      where: {
        serverId,
        userId,
      },
    });
  }

  async removeRolesFromUser(
    serverId: number,
    userId: number,
    roleIds: number[],
  ) {
    try {
      await this.prisma.membershipRole.deleteMany({
        where: {
          roleId: { in: roleIds },
          serverId,
          userId,
        },
      });

      return this.getUserRoles(userId, serverId);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new RolesNotFoundException(roleIds);
      }
      throw error;
    }
  }

  async assignRolesToUser(serverId: number, userId: number, roleIds: number[]) {
    const membership = await this.prisma.membership.findUnique({
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

    const roles = await this.prisma.role.findMany({
      where: {
        id: { in: roleIds },
        serverId,
      },
    });

    if (roles.length !== roleIds.length) {
      throw new RolesNotFoundException(roleIds);
    }

    const createOperations = roleIds.map((roleId) =>
      this.prisma.membershipRole.upsert({
        create: {
          roleId,
          serverId,
          userId,
        },
        update: {},
        where: {
          userId_serverId_roleId: {
            roleId,
            serverId,
            userId,
          },
        },
      }),
    );

    await this.prisma.$transaction(createOperations);

    return this.getUserRoles(userId, serverId);
  }

  /**
   * Checks if user has required permissions in a server
   * Aggregates permissions across all assigned roles
   */
  async checkServerPermissions(
    serverId: number,
    userId: number,
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

    const membershipRoles = await this.prisma.membershipRole.findMany({
      include: {
        role: true,
      },
      where: {
        serverId,
        userId,
      },
    });

    if (membershipRoles.length === 0) {
      throw new KordForbiddenException('User has no roles assigned');
    }

    const aggregatedPermissions: PermissionsMap = {};

    for (const mr of membershipRoles) {
      const rolePermissions: PermissionsMap =
        typeof mr.role.permissions === 'string'
          ? (JSON.parse(mr.role.permissions) as PermissionsMap)
          : (mr.role.permissions as PermissionsMap);

      Object.entries(rolePermissions).forEach(([key, value]) => {
        if (value === true) {
          aggregatedPermissions[key as Permission] = true;
        }
      });
    }

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(
      (permission) => aggregatedPermissions[permission] === true,
    );

    if (!hasAllPermissions) {
      throw new MissingPermissionsException(requiredPermissions);
    }

    return true;
  }
}
