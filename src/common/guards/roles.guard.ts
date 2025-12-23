import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  KordForbiddenException,
  MissingAuthenticationException,
  MissingPermissionsException,
  NotMemberOfServerException,
} from '@/common/exceptions/kord.exceptions';
import { RequestUser } from '@/modules/auth/decorators/current-user.decorator';
import { PrismaService } from '@/modules/prisma/prisma.service';

import { Permission, PermissionsMap } from '../constants/permissions.enum';
import { PERMISSIONS_KEY } from '../decorators/required-permissions.decorator';

interface Request {
  body?: { channelId?: string; serverId?: string };
  method?: string;
  params?: { channelId?: string; id?: string; serverId?: string };
  query?: { channelId?: string; serverId?: string };
  route?: { path?: string };
  url?: string;
  user: RequestUser;
}

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

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new MissingAuthenticationException();
    }

    // Extract parameters from request
    const params = request.params || {};
    const body = request.body || {};
    const query = request.query || {};

    // Resolve serverId from various sources
    // This method may handle DM channels internally and return a special marker
    const resolutionResult = await this.resolveServerId(
      request,
      params,
      body,
      query,
    );

    // If DM channel was already validated, allow access
    if (resolutionResult === 'DM_VALIDATED') {
      return true;
    }

    if (!resolutionResult) {
      // If we can't resolve serverId, it might be:
      // 1. A validation error (missing required field) - let validation pipes handle it
      // 2. Resource doesn't exist - let controller/service throw 404
      // 3. A permission error (can't determine context) - throw 403

      const method = request.method || '';
      const isMutationWithBody = ['PATCH', 'POST', 'PUT'].includes(method);
      const isGetRequest = method === 'GET';

      // For GET requests, if we can't resolve the server (likely resource doesn't exist),
      // allow the request through so the service can throw proper NotFoundException
      if (isGetRequest) {
        return true;
      }

      // For POST/PATCH/PUT operations, if serverId is expected in body but missing,
      // allow the request through so validation pipes can provide proper 400 error
      if (isMutationWithBody && !body.serverId && !params.serverId) {
        // Missing serverId in mutation - likely a validation error
        // Allow through so DTO validation can handle it
        return true;
      }

      throw new KordForbiddenException(
        'Cannot determine server context for permission check',
      );
    }

    // Check user membership and permissions in the server
    return this.checkServerPermissions(
      user.id,
      parseInt(resolutionResult, 10),
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

  /**
   * Resolves serverId from request parameters, body, or related entities
   */
  private async resolveServerId(
    request: Request,
    params: { channelId?: string; id?: string; serverId?: string },
    body: { channelId?: string; serverId?: string },
    query: { channelId?: string; serverId?: string },
  ): Promise<null | string> {
    // Priority 1: Explicit serverId in params or body
    if (params.serverId) {
      return params.serverId;
    }
    if (body.serverId) {
      return body.serverId;
    }

    // Priority 2: Resolve from channelId (check params, body, and query)
    const targetChannelId =
      params.channelId || body.channelId || query.channelId;
    if (targetChannelId) {
      const channel = await this.prisma.channel.findUnique({
        select: { isDM: true, serverId: true },
        where: { id: parseInt(targetChannelId, 10) },
      });

      if (!channel) {
        // Don't throw here - let the controller handle not found
        return null;
      }

      // For DM channels, check participant membership instead of server roles
      if (channel.isDM) {
        await this.checkDMParticipation(
          request.user.id,
          parseInt(targetChannelId, 10),
        );
        return 'DM_VALIDATED'; // DM channels don't need server permission checks
      }

      return channel.serverId.toString();
    }

    // Priority 3: Infer serverId from route pattern and :id param
    if (params.id) {
      const routePath = request.route?.path || '';
      const url = request.url || '';

      // Pattern 1: Direct server routes (/servers/:id, /servers/:id/invites, etc.)
      if (
        routePath.startsWith('/servers/:id') ||
        url.match(/^\/servers\/\d+/)
      ) {
        return params.id;
      }

      // Pattern 2: Server member/role routes (/servers/:serverId/members/:userId/roles)
      // These should use params.serverId, but check if :id is in a server context
      if (routePath.includes('/servers/')) {
        // Extract serverId from route path structure
        const pathParts = routePath.split('/');
        const serverIndex = pathParts.indexOf('servers');
        if (
          serverIndex !== -1 &&
          pathParts[serverIndex + 1] === ':id' &&
          !routePath.includes('/members/:id')
        ) {
          return params.id;
        }
      }

      // Pattern 3: Channel operations - resolve through channel entity
      if (
        routePath.startsWith('/channels/:id') ||
        url.match(/^\/channels\/\d+/)
      ) {
        if (!params.id) {
          return null;
        }

        const channel = await this.prisma.channel.findUnique({
          select: { isDM: true, serverId: true },
          where: { id: parseInt(params.id, 10) },
        });

        if (!channel) {
          // Don't throw - let the controller handle not found
          return null;
        }

        if (channel.isDM) {
          await this.checkDMParticipation(
            request.user.id,
            parseInt(params.id, 10),
          );
          return 'DM_VALIDATED';
        }

        return channel.serverId.toString();
      }

      // Pattern 4: Message operations - resolve through message -> channel -> server
      if (
        routePath.startsWith('/messages/:id') ||
        url.match(/^\/messages\/\d+/)
      ) {
        if (!params.id) {
          return null;
        }

        const message = await this.prisma.message.findUnique({
          include: {
            channel: {
              select: { isDM: true, serverId: true },
            },
          },
          where: { id: parseInt(params.id, 10) },
        });

        if (!message?.channel) {
          // Don't throw - let the controller handle not found
          return null;
        }

        if (message.channel.isDM) {
          await this.checkDMParticipation(request.user.id, message.channelId);
          return 'DM_VALIDATED';
        }
        return message.channel.serverId.toString();
      }

      // Pattern 5: Role operations - resolve through role entity
      if (routePath.startsWith('/roles/:id') || url.match(/^\/roles\/\d+/)) {
        if (!params.id) {
          return null;
        }

        const role = await this.prisma.role.findUnique({
          select: { serverId: true },
          where: { id: parseInt(params.id, 10) },
        });

        if (!role) {
          // Don't throw - let the controller handle not found
          return null;
        }

        return role.serverId.toString();
      }
    }

    // Priority 4: Resolve from other specific params
    // Handle nested routes like /servers/:serverId/channels/:channelId
    if (params.serverId) {
      return params.serverId;
    }

    return null;
  }
}
