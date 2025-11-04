import { UseFilters } from '@nestjs/common';
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
import { Server, Socket } from 'socket.io';

import { WsExceptionFilter } from '@/common/filters/ws-exception.filter';

import type { AuthenticatedSocket } from './types/socket-data.type';

import { extractTokenFromSocket } from './utils/ws-cookie-extractor';

interface MessageCreatedPayload {
  channelId: number;
  message: unknown;
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

  private typingTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(private readonly jwtService: JwtService) {}

  // Called by MessagesService when a new message is created
  broadcastMessageCreated(payload: MessageCreatedPayload) {
    const room = `channel-${payload.channelId}`;
    this.server.to(room).emit('message-created', payload.message);
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
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-channel')
  handleJoinChannel(
    @MessageBody() data: { channelId: number },
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
    @MessageBody() data: { channelId: number },
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
