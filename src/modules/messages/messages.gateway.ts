import { Logger, UseFilters } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Message } from 'generated/prisma/client';
import { Server, Socket } from 'socket.io';

import { ErrorCode } from '@/common/constants/error-codes';
import { WsExceptionFilter } from '@/common/filters/ws-exception.filter';

import type { AuthenticatedSocket } from './types/socket-data.type';

import { UsersService } from '../users/users.service';
import { extractTokenFromSocket } from './utils/ws-cookie-extractor';

interface JoinChannelPayload {
  channelId: number;
}

interface LeaveChannelPayload {
  channelId: number;
}

interface MessageCreatedPayload {
  channelId: number;
  message: Message;
}

interface TypingPayload {
  channelId: number;
  userId: number;
  username: string;
}

@UseFilters(new WsExceptionFilter())
@WebSocketGateway({
  cors: {
    credentials: true,
    origin: process.env.CLIENT_URL,
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private typingTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  // Called by MessagesService when a new message is created
  async broadcastMessageCreated(payload: MessageCreatedPayload) {
    const room = `channel-${payload.channelId}`;

    try {
      // Get message author ID from payload
      const messageAuthorId = payload.message.userId;

      // Get all sockets in the room
      const sockets = await this.server.in(room).fetchSockets();
      const connectedUserIds = sockets
        .map((s) => (s.data as AuthenticatedSocket['data'])?.user?.id)
        .filter((id): id is number => id !== undefined);

      // Build a map of userId -> Set of blocked user IDs to avoid N+1 queries
      const blockCache = new Map<number, Set<number>>();

      await Promise.all(
        connectedUserIds.map(async (userId) => {
          const blockedUserIds =
            await this.usersService.getBlockedUserIds(userId);
          blockCache.set(userId, new Set(blockedUserIds));
        }),
      );

      // Emit customized payload to each socket based on their block list
      for (const socket of sockets) {
        const socketData = socket.data as AuthenticatedSocket['data'];
        const userId = socketData?.user?.id;

        if (!userId) {
          // If we can't determine user, send message with isBlocked: false
          socket.emit('message-created', {
            ...payload.message,
            isBlocked: false,
          });
          continue;
        }

        const blockedUserIds = blockCache.get(userId);
        const isBlocked = blockedUserIds?.has(messageAuthorId) ?? false;

        socket.emit('message-created', {
          ...payload.message,
          isBlocked,
        });
      }
    } catch (error) {
      // Fallback to room broadcast if channel lookup fails
      this.logger.error('Error in broadcastMessageCreated:', error);
      this.server.to(room).emit('message-created', {
        ...payload.message,
        isBlocked: false,
      });
    }
  }

  // Called by MessagesService when a message is deleted
  broadcastMessageDeleted(payload: { channelId: number; messageId: number }) {
    const room = `channel-${payload.channelId}`;
    this.server.to(room).emit('message-deleted', {
      messageId: payload.messageId,
    });
  }

  // Called by MessagesService when a message is updated
  broadcastMessageUpdated(payload: MessageCreatedPayload) {
    const room = `channel-${payload.channelId}`;
    this.server.to(room).emit('message-updated', payload.message);
  }

  handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract JWT from cookies
      const token = extractTokenFromSocket(client as Socket);

      if (!token) {
        console.log('WebSocket connection rejected: No token provided');
        throw new WsException('Unauthorized');
      }

      // Verify JWT
      const payload = this.jwtService.verify<{
        email: string;
        sub: number;
        username: string;
      }>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      // Store user info in socket data for later use
      client.data.user = {
        email: payload.email,
        id: payload.sub,
        username: payload.username,
      };

      console.log(`Client connected: ${client.id} (User: ${payload.username})`);
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      client.emit('error', {
        code: ErrorCode.UNAUTHORIZED,
        event: 'error',
        message: 'Authentication failed',
      });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-channel')
  handleJoinChannel(
    @MessageBody() data: JoinChannelPayload,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    // Access authenticated user from socket data
    const user = client.data.user;

    if (!user) {
      throw new WsException('Unauthorized');
    }

    const room = `channel-${data.channelId}`;
    void client.join(room);

    console.log(`User ${user.username} joined channel ${data.channelId}`);

    return { data: { channelId: data.channelId }, event: 'joined-channel' };
  }

  @SubscribeMessage('leave-channel')
  handleLeaveChannel(
    @MessageBody() data: LeaveChannelPayload,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = client.data.user;

    if (!user) {
      throw new WsException('Unauthorized');
    }

    const room = `channel-${data.channelId}`;
    void client.leave(room);

    console.log(`User ${user.username} left channel ${data.channelId}`);

    return { data: { channelId: data.channelId }, event: 'left-channel' };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: TypingPayload,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = client.data.user;

    if (!user) {
      throw new WsException('Unauthorized');
    }

    const room = `channel-${data.channelId}`;
    const key = `${user.id}-${data.channelId}`;

    // Clear existing timeout
    if (this.typingTimeouts.has(key)) {
      clearTimeout(this.typingTimeouts.get(key));
    }

    // Broadcast typing event with authenticated user data
    void client.to(room).emit('user-typing', {
      channelId: data.channelId,
      userId: user.id,
      username: user.username,
    });

    // Set timeout to clear typing after 3 seconds
    const timeout = setTimeout(() => {
      void client.to(room).emit('user-stopped-typing', {
        channelId: data.channelId,
        userId: user.id,
      });
      this.typingTimeouts.delete(key);
    }, 3000);

    this.typingTimeouts.set(key, timeout);
  }
}
