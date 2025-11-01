import { UseFilters } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { WsExceptionFilter } from '@/common/filters/ws-exception.filter';

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
@WebSocketGateway()
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private typingTimeouts = new Map<string, NodeJS.Timeout>();

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

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-channel')
  handleJoinChannel(
    @MessageBody() data: { channelId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `channel-${data.channelId}`;
    void client.join(room);
    return { data: { channelId: data.channelId }, event: 'joined-channel' };
  }

  @SubscribeMessage('leave-channel')
  handleLeaveChannel(
    @MessageBody() data: { channelId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `channel-${data.channelId}`;
    void client.leave(room);
    return { data: { channelId: data.channelId }, event: 'left-channel' };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: TypingPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `channel-${data.channelId}`;
    const key = `${data.userId}-${data.channelId}`;

    // Clear existing timeout
    if (this.typingTimeouts.has(key)) {
      clearTimeout(this.typingTimeouts.get(key));
    }

    // Broadcast typing event
    void client.to(room).emit('user-typing', {
      channelId: data.channelId,
      userId: data.userId,
      username: data.username,
    });

    // Set timeout to clear typing after 3 seconds
    const timeout = setTimeout(() => {
      void client.to(room).emit('user-stopped-typing', {
        channelId: data.channelId,
        userId: data.userId,
      });
      this.typingTimeouts.delete(key);
    }, 3000);

    this.typingTimeouts.set(key, timeout);
  }
}
