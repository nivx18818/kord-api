import { ChannelStatus, ChannelType } from 'generated/prisma/enums';

export const mockUser = {
  createdAt: new Date(),
  dateOfBirth: new Date('1990-01-01'),
  email: 'test@example.com',
  id: 1,
  name: 'Test User',
  password: 'hashedpassword',
  updatedAt: new Date(),
  username: 'testuser',
};

export const mockProfile = {
  avatar: 'https://example.com/avatar.jpg',
  banner: 'https://example.com/banner.jpg',
  bio: 'Test bio',
  createdAt: new Date(),
  facebook: 'testuser',
  github: 'testuser',
  linkedin: 'testuser',
  updatedAt: new Date(),
  userId: 1,
  website: 'https://testuser.com',
  xTwitter: '@testuser',
};

export const mockServer = {
  createdAt: new Date(),
  id: 1,
  name: 'Test Server',
  servername: 'testserver',
  updatedAt: new Date(),
};

export const mockChannel = {
  createdAt: new Date(),
  id: 1,
  isDM: false,
  name: 'general',
  serverId: 1,
  status: ChannelStatus.PUBLIC,
  type: ChannelType.TEXT,
  updatedAt: new Date(),
};

export const mockMessage = {
  channelId: 1,
  content: { text: 'Hello, world!' },
  createdAt: new Date(),
  deletedAt: null,
  id: 1,
  parentMessageId: null,
  updatedAt: new Date(),
  userId: 1,
};

export const mockAttachment = {
  createdAt: new Date(),
  id: 1,
  messageId: 1,
  size: 1024,
  type: 'image/jpeg',
  updatedAt: new Date(),
  url: 'https://example.com/file.jpg',
};

export const mockRole = {
  id: 1,
  name: 'Admin',
  permissions: { kickUsers: true, manageChannels: true },
  serverId: 1,
};

export const mockMembership = {
  createdAt: new Date(),
  roleId: 1,
  serverId: 1,
  updatedAt: new Date(),
  userId: 1,
};

export const mockReaction = {
  createdAt: new Date(),
  emoji: '👍',
  messageId: 1,
  updatedAt: new Date(),
  userId: 1,
};

export const createMockUserWithProfile = () => ({
  ...mockUser,
  profile: mockProfile,
});

export const createMockServerWithRelations = () => ({
  ...mockServer,
  channels: [mockChannel],
  members: [{ ...mockMembership, role: mockRole, user: mockUser }],
  roles: [mockRole],
});

export const createMockChannelWithRelations = () => ({
  ...mockChannel,
  messages: [],
  server: mockServer,
});

export const createMockMessageWithRelations = () => ({
  ...mockMessage,
  attachments: [mockAttachment],
  channel: mockChannel,
  parentMessage: null,
  reacts: [],
  replies: [],
  user: mockUser,
});
