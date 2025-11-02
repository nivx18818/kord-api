import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  ChannelNotFoundException,
  KordForbiddenException,
  MissingAuthenticationException,
  MissingPermissionsException,
  NotMemberOfServerException,
} from '@/common/exceptions/kord.exceptions';
import { RequestUser } from '@/modules/auth/decorators/current-user.decorator';
import { PrismaService } from '@/modules/prisma/prisma.service';

import { Permission, PermissionsMap } from '../constants/permissions.enum';
import { PERMISSIONS_KEY } from '../decorators/required-permissions.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      body?: { channelId?: string; serverId?: string };
      params?: { channelId?: string; id?: string; serverId?: string };
      route?: { path?: string };
      url?: string;
      user: RequestUser;
    }>();
    const user = request.user;

    if (!user) {
      throw new MissingAuthenticationException();
    }

    // Extract serverId or channelId from request params or body
    const { channelId, id, serverId } = request.params || {};
    const bodyServerId = request.body?.serverId;
    const bodyChannelId = request.body?.channelId;

    const targetServerId = serverId || bodyServerId;
    const targetChannelId = channelId || bodyChannelId;

    // If channelId is provided, resolve serverId from channel
    let resolvedServerId = targetServerId;
    if (targetChannelId && !resolvedServerId) {
      const channel = await this.prisma.channel.findUnique({
        select: { isDM: true, serverId: true },
        where: { id: parseInt(targetChannelId, 10) },
      });

      if (!channel) {
        throw new ChannelNotFoundException(parseInt(targetChannelId, 10));
      }

      // For DM channels, check participant membership instead of server roles
      if (channel.isDM) {
        return this.checkDMParticipation(
          user.id,
          parseInt(targetChannelId, 10),
        );
      }

      resolvedServerId = channel.serverId.toString();
    }

    // If operating on a server resource directly
    if (!resolvedServerId && id) {
      // Check if the id param is a server being accessed
      const urlPath = request.route?.path || request.url || '';
      if (urlPath.includes('/servers/')) {
        resolvedServerId = id;
      }
    }

    if (!resolvedServerId) {
      throw new KordForbiddenException(
        'Cannot determine server context for permission check',
      );
    }

    // Check user membership and permissions in the server
    return this.checkServerPermissions(
      user.id,
      parseInt(resolvedServerId, 10),
      requiredPermissions,
    );
  }

  /**
   * Checks if user is a participant in a DM channel
   */
  private async checkDMParticipation(
    userId: number,
    channelId: number,
  ): Promise<boolean> {
    const participant = await this.prisma.channelParticipant.findUnique({
      where: {
        userId_channelId: {
          channelId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new KordForbiddenException(
        'User is not a participant in this channel',
      );
    }

    return true;
  }

  /**
   * Checks if user has required permissions in a server
   */
  private async checkServerPermissions(
    userId: number,
    serverId: number,
    requiredPermissions: Permission[],
  ): Promise<boolean> {
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
    const userPermissions = membership.role.permissions as PermissionsMap;

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
