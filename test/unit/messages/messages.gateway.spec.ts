import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';

import { MessagesGateway } from '@/modules/messages/messages.gateway';

describe('MessagesGateway', () => {
  let gateway: MessagesGateway;
  let mockServer: Partial<Server>;
  let mockSocket: Partial<Socket>;

  beforeEach(async () => {
    // Create mock server
    mockServer = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };

    // Create mock socket
    mockSocket = {
      emit: jest.fn(),
      id: 'test-socket-id',
      join: jest.fn(),
      leave: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MessagesGateway],
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
    it('should log client connection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.handleConnection(mockSocket as Socket);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Client connected: test-socket-id',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('handleDisconnect', () => {
    it('should log client disconnection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.handleDisconnect(mockSocket as Socket);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Client disconnected: test-socket-id',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('handleJoinChannel', () => {
    it('should join client to channel room', () => {
      const data = { channelId: 1 };

      const result = gateway.handleJoinChannel(data, mockSocket as Socket);

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

      const result = gateway.handleLeaveChannel(data, mockSocket as Socket);

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

      gateway.handleTyping(data, mockSocket as Socket);

      expect(mockSocket.to).toHaveBeenCalledWith('channel-1');
      expect(mockSocket.emit).toHaveBeenCalledWith('user-typing', {
        channelId: 1,
        userId: 10,
        username: 'testuser',
      });
    });

    it('should emit stopped-typing event after 3 seconds', () => {
      const data = {
        channelId: 1,
        userId: 10,
        username: 'testuser',
      };

      gateway.handleTyping(data, mockSocket as Socket);

      jest.advanceTimersByTime(3000);

      expect(mockSocket.emit).toHaveBeenCalledWith('user-stopped-typing', {
        channelId: 1,
        userId: 10,
      });
    });

    it('should clear existing timeout when user types again', () => {
      const data = {
        channelId: 1,
        userId: 10,
        username: 'testuser',
      };

      // First typing event
      gateway.handleTyping(data, mockSocket as Socket);
      jest.advanceTimersByTime(1000);

      // Second typing event before timeout
      gateway.handleTyping(data, mockSocket as Socket);
      jest.advanceTimersByTime(2000);

      // Only the first typing event should be emitted
      expect(mockSocket.emit).toHaveBeenCalledTimes(2);

      // Complete the full 3 seconds for the second timeout
      jest.advanceTimersByTime(1000);

      // Now stopped-typing should be emitted
      expect(mockSocket.emit).toHaveBeenCalledWith('user-stopped-typing', {
        channelId: 1,
        userId: 10,
      });
    });
  });
});
