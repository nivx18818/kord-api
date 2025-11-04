import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'socket.io';

import type { AuthenticatedSocket } from '@/modules/messages/types/socket-data.type';

import { MessagesGateway } from '@/modules/messages/messages.gateway';

describe('MessagesGateway', () => {
  let gateway: MessagesGateway;
  let mockServer: Partial<Server>;
  let mockSocket: Partial<AuthenticatedSocket>;
  let mockJwtService: Partial<JwtService>;

  beforeEach(async () => {
    // Create mock JWT service
    mockJwtService = {
      verify: jest.fn(),
    };

    // Create mock server
    mockServer = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };

    // Create mock socket with user data
    mockSocket = {
      data: {
        user: {
          email: 'test@example.com',
          id: 1,
          username: 'testuser',
        },
      },
      disconnect: jest.fn(),
      emit: jest.fn(),
      id: 'test-socket-id',
      join: jest.fn(),
      leave: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesGateway,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    gateway = module.get<MessagesGateway>(MessagesGateway);
    gateway.server = mockServer as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('broadcastMessageCreated', () => {
    it('should emit message-created event to channel room', () => {
      const payload = {
        channelId: 1,
        message: {
          content: { text: 'Hello' },
          id: 123,
          userId: 1,
        },
      };

      gateway.broadcastMessageCreated(payload);

      expect(mockServer.to).toHaveBeenCalledWith('channel-1');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'message-created',
        payload.message,
      );
    });
  });

  describe('broadcastMessageDeleted', () => {
    it('should emit message-deleted event to channel room', () => {
      const payload = {
        channelId: 2,
        messageId: 456,
      };

      gateway.broadcastMessageDeleted(payload);

      expect(mockServer.to).toHaveBeenCalledWith('channel-2');
      expect(mockServer.emit).toHaveBeenCalledWith('message-deleted', {
        messageId: 456,
      });
    });
  });

  describe('broadcastMessageUpdated', () => {
    it('should emit message-updated event to channel room', () => {
      const payload = {
        channelId: 3,
        message: {
          content: { text: 'Updated' },
          id: 789,
          userId: 1,
        },
      };

      gateway.broadcastMessageUpdated(payload);

      expect(mockServer.to).toHaveBeenCalledWith('channel-3');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'message-updated',
        payload.message,
      );
    });
  });

  describe('handleConnection', () => {
    it('should authenticate and log client connection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Mock the JWT verification
      (mockJwtService.verify as jest.Mock).mockReturnValue({
        email: 'test@example.com',
        sub: 1,
        username: 'testuser',
      });

      // Add handshake with headers and cookies
      const socketWithHandshake = {
        ...mockSocket,
        handshake: {
          headers: {
            cookie: 'kord_access_token=valid-token',
          },
        },
      };

      gateway.handleConnection(socketWithHandshake as AuthenticatedSocket);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Client connected: test-socket-id (User: testuser)',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('handleDisconnect', () => {
    it('should log client disconnection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      gateway.handleDisconnect(mockSocket as any);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Client disconnected: test-socket-id',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('handleJoinChannel', () => {
    it('should join client to channel room', () => {
      const data = { channelId: 1 };

      const result = gateway.handleJoinChannel(
        data,
        mockSocket as AuthenticatedSocket,
      );

      expect(mockSocket.join).toHaveBeenCalledWith('channel-1');
      expect(result).toEqual({
        data: { channelId: 1 },
        event: 'joined-channel',
      });
    });
  });

  describe('handleLeaveChannel', () => {
    it('should remove client from channel room', () => {
      const data = { channelId: 2 };

      const result = gateway.handleLeaveChannel(
        data,
        mockSocket as AuthenticatedSocket,
      );

      expect(mockSocket.leave).toHaveBeenCalledWith('channel-2');
      expect(result).toEqual({
        data: { channelId: 2 },
        event: 'left-channel',
      });
    });
  });

  describe('handleTyping', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should broadcast typing event to channel', () => {
      const data = {
        channelId: 1,
        userId: 10,
        username: 'testuser',
      };

      gateway.handleTyping(data, mockSocket as AuthenticatedSocket);

      expect(mockSocket.to).toHaveBeenCalledWith('channel-1');
      expect(mockSocket.emit).toHaveBeenCalledWith('user-typing', {
        channelId: 1,
        userId: 1,
        username: 'testuser',
      });
    });

    it('should emit stopped-typing event after 3 seconds', () => {
      const data = {
        channelId: 1,
        userId: 10,
        username: 'testuser',
      };

      gateway.handleTyping(data, mockSocket as AuthenticatedSocket);

      jest.advanceTimersByTime(3000);

      expect(mockSocket.emit).toHaveBeenCalledWith('user-stopped-typing', {
        channelId: 1,
        userId: 1,
      });
    });

    it('should clear existing timeout when user types again', () => {
      const data = {
        channelId: 1,
        userId: 10,
        username: 'testuser',
      };

      // First typing event
      gateway.handleTyping(data, mockSocket as AuthenticatedSocket);
      jest.advanceTimersByTime(1000);

      // Second typing event before timeout
      gateway.handleTyping(data, mockSocket as AuthenticatedSocket);
      jest.advanceTimersByTime(2000);

      // Only the first typing event should be emitted
      expect(mockSocket.emit).toHaveBeenCalledTimes(2);

      // Complete the full 3 seconds for the second timeout
      jest.advanceTimersByTime(1000);

      // Now stopped-typing should be emitted (uses authenticated user id: 1)
      expect(mockSocket.emit).toHaveBeenCalledWith('user-stopped-typing', {
        channelId: 1,
        userId: 1,
      });
    });
  });
});
