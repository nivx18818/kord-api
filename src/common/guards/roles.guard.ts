import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  KordForbiddenException,
  MissingAuthenticationException,
} from '@/common/exceptions/kord.exceptions';
import { RequestUser } from '@/modules/auth/decorators/current-user.decorator';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { RolesService } from '@/modules/roles/roles.service';

import { Permission } from '../constants/permissions.enum';
import { PERMISSIONS_KEY } from '../decorators/required-permissions.decorator';

interface Request {
  body?: { channelId?: string; serverId?: string };
  method?: string;
  params?: {
    channelId?: string;
    id?: string;
    messageId?: string;
    roleId?: string;
    serverId?: string;
  };
  query?: { channelId?: string; serverId?: string };
  route?: { path?: string };
  url?: string;
  user: RequestUser;
}

interface ServerResolution {
  isDM: boolean;
  serverId: null | number;
}

/**
 * Custom decorator to explicitly define server context source
 */
export const ServerContext = (
  source: 'body' | 'channelId' | 'messageId' | 'params' | 'roleId',
) => SetMetadata('serverContext', source);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly rolesService: RolesService,
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

    // Resolve serverId from various sources
    const resolution = await this.resolveServerId(context, request);

    // If DM channel was already validated, allow access
    if (resolution.isDM) {
      return true;
    }

    if (!resolution.serverId) {
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
    return this.rolesService.checkServerPermissions(
      user.id,
      resolution.serverId,
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

  private async resolveServerFromChannel(
    channelId: string | undefined,
    userId: number,
  ): Promise<ServerResolution> {
    if (!channelId) return { isDM: false, serverId: null };

    const channel = await this.prisma.channel.findUnique({
      select: { isDM: true, serverId: true },
      where: { id: parseInt(channelId, 10) },
    });

    if (!channel) return { isDM: false, serverId: null };

    if (channel.isDM) {
      await this.checkDMParticipation(userId, parseInt(channelId, 10));
      return { isDM: true, serverId: null };
    }

    return { isDM: false, serverId: channel.serverId };
  }

  /**
   * Resolves serverId from a message ID
   */
  private async resolveServerFromMessage(
    messageId: string | undefined,
    userId: number,
  ): Promise<ServerResolution> {
    if (!messageId) return { isDM: false, serverId: null };

    const message = await this.prisma.message.findUnique({
      include: {
        channel: {
          select: { isDM: true, serverId: true },
        },
      },
      where: { id: parseInt(messageId, 10) },
    });

    if (!message?.channel) return { isDM: false, serverId: null };

    if (message.channel.isDM) {
      await this.checkDMParticipation(userId, message.channelId);
      return { isDM: true, serverId: null };
    }

    return { isDM: false, serverId: message.channel.serverId };
  }

  /**
   * Resolves serverId from a role ID
   */
  private async resolveServerFromRole(
    roleId: string | undefined,
  ): Promise<ServerResolution> {
    if (!roleId) return { isDM: false, serverId: null };

    const role = await this.prisma.role.findUnique({
      select: { serverId: true },
      where: { id: parseInt(roleId, 10) },
    });

    if (!role) return { isDM: false, serverId: null };

    return { isDM: false, serverId: role.serverId };
  }

  /**
   * Resolves serverId from request parameters, body, or related entities
   */
  private async resolveServerId(
    context: ExecutionContext,
    request: Request,
  ): Promise<ServerResolution> {
    const params = request.params || {};
    const body = request.body || {};
    const query = request.query || {};

    // Priority 1: Explicit serverId in params or body
    if (params.serverId) {
      return { isDM: false, serverId: parseInt(params.serverId, 10) };
    }
    if (body.serverId) {
      return { isDM: false, serverId: parseInt(body.serverId, 10) };
    }

    // Priority 2: Resolve from explicit parameter names
    if (params.channelId) {
      return this.resolveServerFromChannel(params.channelId, request.user.id);
    }
    if (params.messageId) {
      return this.resolveServerFromMessage(params.messageId, request.user.id);
    }
    if (params.roleId) {
      return this.resolveServerFromRole(params.roleId);
    }

    // Priority 3: Check channelId in body or query (for POST/PATCH operations)
    const targetChannelId = body.channelId || query.channelId;
    if (targetChannelId) {
      return this.resolveServerFromChannel(targetChannelId, request.user.id);
    }

    // Priority 4: Check for explicit decorator hint as fallback
    const contextSource = this.reflector.get<string>(
      'serverContext',
      context.getHandler(),
    );

    if (contextSource) {
      switch (contextSource) {
        case 'body':
          return body.serverId
            ? { isDM: false, serverId: parseInt(body.serverId, 10) }
            : { isDM: false, serverId: null };
        case 'params':
          return params.id
            ? { isDM: false, serverId: parseInt(params.id, 10) }
            : { isDM: false, serverId: null };
      }
    }

    return { isDM: false, serverId: null };
  }
}
