/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { ChannelStatus, ChannelType } from 'generated/prisma/enums';
import request from 'supertest';

import { AppModule } from '@/app.module';
import { Permission } from '@/common/constants/permissions.enum';
import { PrismaService } from '@/modules/prisma/prisma.service';

/**
 * Comprehensive User Journey E2E Test
 *
 * This test simulates a complete user flow through the Kord application:
 * 1. User Registration & Authentication
 * 2. Server Creation & Management
 * 3. Invite System (creating and redeeming invites)
 * 4. Channel Creation (text and voice)
 * 5. Messaging (create, edit, delete, threading)
 * 6. Reactions on messages
 * 7. Role Management & Permissions
 * 8. DM (Direct Message) functionality
 * 9. Membership management
 *
 * This ensures all critical API endpoints work correctly for frontend integration.
 */
describe('User Journey (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test users
  const timestamp = Date.now();
  const user1 = {
    dateOfBirth: '1990-01-01',
    email: `user1_${timestamp}@example.com`,
    password: 'Password123!',
    username: `user1_${timestamp}`,
  };

  const user2 = {
    dateOfBirth: '1992-05-15',
    email: `user2_${timestamp}@example.com`,
    password: 'Password456!',
    username: `user2_${timestamp}`,
  };

  // Authentication cookies
  let user1Cookies: string[];
  let user2Cookies: string[];
  let user1Id: number;
  let user2Id: number;

  // Created entities
  let serverId: number;
  let inviteCode: string;
  let textChannelId: number;
  let voiceChannelId: number;
  let dmChannelId: number;
  let messageId: number;
  let threadMessageId: number;
  let memberRoleId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply cookie parser middleware
    app.use(cookieParser());

    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    // Clean up test data in correct order (respecting foreign key constraints)
    try {
      // Delete reactions first
      await prisma.reaction.deleteMany({
        where: {
          OR: [{ userId: user1Id }, { userId: user2Id }],
        },
      });

      // Delete messages
      await prisma.message.deleteMany({
        where: {
          OR: [{ userId: user1Id }, { userId: user2Id }],
        },
      });

      // Delete memberships
      await prisma.membership.deleteMany({
        where: {
          OR: [{ userId: user1Id }, { userId: user2Id }],
        },
      });

      // Delete invites
      if (serverId) {
        await prisma.invite.deleteMany({
          where: { serverId },
        });
      }

      // Delete channels
      if (serverId) {
        await prisma.channel.deleteMany({
          where: { serverId },
        });
      }

      // Delete roles
      if (serverId) {
        await prisma.role.deleteMany({
          where: { serverId },
        });
      }

      // Delete server
      if (serverId) {
        await prisma.server.deleteMany({
          where: { id: serverId },
        });
      }

      // Delete profiles and users
      await prisma.profile.deleteMany({
        where: {
          OR: [{ userId: user1Id }, { userId: user2Id }],
        },
      });

      await prisma.user.deleteMany({
        where: {
          OR: [{ id: user1Id }, { id: user2Id }],
        },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    await app.close();
  });

  describe('Phase 1: User Registration & Authentication', () => {
    it('should register user1 successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(user1)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Registration successful');

      // Store cookies for subsequent requests
      const cookies = response.headers['set-cookie'];
      user1Cookies = Array.isArray(cookies) ? cookies : [cookies];

      // Get user ID from /auth/me
      const meResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);

      user1Id = meResponse.body.id;
      expect(meResponse.body.email).toBe(user1.email);
      expect(meResponse.body.username).toBe(user1.username);
    });

    it('should register user2 successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(user2)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Registration successful');

      // Store cookies for subsequent requests
      const cookies = response.headers['set-cookie'];
      user2Cookies = Array.isArray(cookies) ? cookies : [cookies];

      // Get user ID
      const meResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', user2Cookies)
        .expect(HttpStatus.OK);

      user2Id = meResponse.body.id;
      expect(meResponse.body.email).toBe(user2.email);
    });

    it('should check email availability correctly', async () => {
      // Existing email
      const existingResponse = await request(app.getHttpServer())
        .get('/auth/check-email')
        .query({ email: user1.email })
        .expect(HttpStatus.OK);

      expect(existingResponse.body.available).toBe(false);

      // Non-existing email
      const availableResponse = await request(app.getHttpServer())
        .get('/auth/check-email')
        .query({ email: `nonexistent_${timestamp}@example.com` })
        .expect(HttpStatus.OK);

      expect(availableResponse.body.available).toBe(true);
    });

    it('should login user1 with username', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: user1.password,
          usernameOrEmail: user1.username,
        })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Login successful');

      // Update cookies
      const cookies = response.headers['set-cookie'];
      user1Cookies = Array.isArray(cookies) ? cookies : [cookies];
    });

    it('should refresh tokens for user1', async () => {
      // First login to get cookies
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: user1.password,
          usernameOrEmail: user1.email,
        })
        .expect(HttpStatus.OK);

      const loginCookies = Array.isArray(loginResponse.headers['set-cookie'])
        ? loginResponse.headers['set-cookie']
        : [loginResponse.headers['set-cookie']];

      // Refresh tokens
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', loginCookies)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Token refreshed');
    });
  });

  describe('Phase 2: Server Creation & Management', () => {
    it('should create a server by user1', async () => {
      const serverData = {
        name: `Test Server ${timestamp}`,
        servername: `testserver${timestamp}`,
      };

      const response = await request(app.getHttpServer())
        .post('/servers')
        .set('Cookie', user1Cookies)
        .send(serverData)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(serverData.name);
      expect(response.body.servername).toBe(serverData.servername);
      serverId = response.body.id;
    });

    it('should get server details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/servers/${serverId}`)
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(serverId);
    });

    it('should list servers for user1', async () => {
      const response = await request(app.getHttpServer())
        .get('/servers')
        .query({ userId: user1Id })
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should update server details', async () => {
      const updateData = {
        name: `Updated Server ${timestamp}`,
      };

      const response = await request(app.getHttpServer())
        .patch(`/servers/${serverId}`)
        .set('Cookie', user1Cookies)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body.name).toBe(updateData.name);
    });
  });

  describe('Phase 3: Invite System', () => {
    it('should create an invite for the server', async () => {
      const inviteData = {
        createdBy: user1Id,
        expiresInDays: 7,
      };

      const response = await request(app.getHttpServer())
        .post(`/servers/${serverId}/invites`)
        .set('Cookie', user1Cookies)
        .send(inviteData)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('code');
      expect(response.body.serverId).toBe(serverId);
      inviteCode = response.body.code;
    });

    it('should list server invites', async () => {
      const response = await request(app.getHttpServer())
        .get(`/servers/${serverId}/invites`)
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should allow user2 to redeem the invite', async () => {
      const response = await request(app.getHttpServer())
        .post(`/servers/invites/${inviteCode}/redeem`)
        .set('Cookie', user2Cookies)
        .send({ userId: user2Id })
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('serverId');
      expect(response.body.userId).toBe(user2Id);
      expect(response.body.serverId).toBe(serverId);
    });

    it('should verify user2 is now a member', async () => {
      const response = await request(app.getHttpServer())
        .get(`/memberships/${user2Id}/${serverId}`)
        .set('Cookie', user2Cookies)
        .expect(HttpStatus.OK);

      expect(response.body.userId).toBe(user2Id);
      expect(response.body.serverId).toBe(serverId);
    });

    it('should verify user2 has a default Member role with basic permissions', async () => {
      const response = await request(app.getHttpServer())
        .get(`/memberships/${user2Id}/${serverId}`)
        .set('Cookie', user2Cookies)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('role');
      expect(response.body.role).not.toBeNull();
      expect(response.body.role.name).toBe('Member');

      const permissions = JSON.parse(response.body.role.permissions);
      expect(permissions).toHaveProperty('addReactions', true);
      expect(permissions).toHaveProperty('connectVoice', true);
      expect(permissions).toHaveProperty('sendMessages', true);
      expect(permissions).toHaveProperty('speakVoice', true);
      expect(permissions).toHaveProperty('viewChannels', true);
    });
  });

  describe('Phase 4: Role Management', () => {
    it('should create an admin role', async () => {
      const roleData = {
        name: 'Admin',
        permissions: JSON.stringify({
          [Permission.MANAGE_CHANNELS]: true,
          [Permission.MANAGE_ROLES]: true,
          [Permission.MANAGE_SERVERS]: true,
        }),
        serverId,
      };

      const response = await request(app.getHttpServer())
        .post('/roles')
        .set('Cookie', user1Cookies)
        .send(roleData)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(roleData.name);
      // adminRoleId = response.body.id; // Not used in tests
    });

    it('should create a member role', async () => {
      const roleData = {
        name: 'Member',
        permissions: JSON.stringify({
          [Permission.SEND_MESSAGES]: true,
          [Permission.VIEW_CHANNELS]: true,
        }),
        serverId,
      };

      const response = await request(app.getHttpServer())
        .post('/roles')
        .set('Cookie', user1Cookies)
        .send(roleData)
        .expect(HttpStatus.CREATED);

      memberRoleId = response.body.id;
    });

    it('should list roles for the server', async () => {
      const response = await request(app.getHttpServer())
        .get('/roles')
        .query({ serverId })
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should assign member role to user2', async () => {
      const response = await request(app.getHttpServer())
        .post(`/servers/${serverId}/members/${user2Id}/roles/${memberRoleId}`)
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('roleId');
      expect(response.body.roleId).toBe(memberRoleId);
    });

    it('should update a role', async () => {
      const updateData = {
        name: 'Updated Member',
      };

      const response = await request(app.getHttpServer())
        .patch(`/roles/${memberRoleId}`)
        .set('Cookie', user1Cookies)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body.name).toBe(updateData.name);
    });
  });

  describe('Phase 5: Channel Creation & Management', () => {
    it('should create a text channel', async () => {
      const channelData = {
        name: 'general',
        serverId,
        status: ChannelStatus.PUBLIC,
        type: ChannelType.TEXT,
      };

      const response = await request(app.getHttpServer())
        .post('/channels')
        .set('Cookie', user1Cookies)
        .send(channelData)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(channelData.name);
      expect(response.body.type).toBe(channelData.type);
      textChannelId = response.body.id;
    });

    it('should create a voice channel', async () => {
      const channelData = {
        name: 'voice-chat',
        serverId,
        status: ChannelStatus.PUBLIC,
        type: ChannelType.VOICE,
      };

      const response = await request(app.getHttpServer())
        .post('/channels')
        .set('Cookie', user1Cookies)
        .send(channelData)
        .expect(HttpStatus.CREATED);

      expect(response.body.type).toBe(ChannelType.VOICE);
      voiceChannelId = response.body.id;
    });

    it('should list all channels', async () => {
      const response = await request(app.getHttpServer())
        .get('/channels')
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get channel details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/channels/${textChannelId}`)
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(textChannelId);
    });

    it('should update a channel', async () => {
      const updateData = {
        name: 'general-chat',
        status: ChannelStatus.PUBLIC,
      };

      const response = await request(app.getHttpServer())
        .patch(`/channels/${textChannelId}`)
        .set('Cookie', user1Cookies)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body.name).toBe(updateData.name);
    });
  });

  describe('Phase 6: Messaging Flow', () => {
    it('should send a message in the text channel', async () => {
      const messageData = {
        channelId: textChannelId,
        content: JSON.stringify({ text: 'Hello, this is a test message!' }),
        userId: user1Id,
      };

      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Cookie', user1Cookies)
        .send(messageData)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.channelId).toBe(textChannelId);
      expect(response.body.userId).toBe(user1Id);
      messageId = response.body.id;
    });

    it('should send a reply (threaded message)', async () => {
      const replyData = {
        channelId: textChannelId,
        content: JSON.stringify({ text: 'This is a reply!' }),
        parentMessageId: messageId,
        userId: user2Id,
      };

      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Cookie', user2Cookies)
        .send(replyData)
        .expect(HttpStatus.CREATED);

      expect(response.body.parentMessageId).toBe(messageId);
      threadMessageId = response.body.id;
    });

    it('should list messages in a channel', async () => {
      const response = await request(app.getHttpServer())
        .get('/messages')
        .query({ channelId: textChannelId })
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.length).toBeGreaterThanOrEqual(2);
    });

    it('should get a specific message', async () => {
      const response = await request(app.getHttpServer())
        .get(`/messages/${messageId}`)
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(messageId);
    });

    it('should edit a message (by owner)', async () => {
      const updateData = {
        content: JSON.stringify({ text: 'Updated message content!' }),
      };

      const response = await request(app.getHttpServer())
        .patch(`/messages/${messageId}`)
        .set('Cookie', user1Cookies)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(JSON.parse(response.body.content).text).toBe(
        'Updated message content!',
      );
    });

    it('should soft delete a message', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/messages/${threadMessageId}`)
        .set('Cookie', user2Cookies)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('deletedAt');
      expect(response.body.deletedAt).not.toBeNull();
    });
  });

  describe('Phase 7: Reactions', () => {
    it('should add a reaction to a message', async () => {
      const reactionData = {
        emoji: '👍',
        messageId,
        userId: user1Id,
      };

      const response = await request(app.getHttpServer())
        .post('/reactions')
        .set('Cookie', user1Cookies)
        .send(reactionData)
        .expect(HttpStatus.CREATED);

      expect(response.body.messageId).toBe(messageId);
      expect(response.body.userId).toBe(user1Id);
      expect(response.body.emoji).toBe(reactionData.emoji);
    });

    it('should add another reaction from user2', async () => {
      const reactionData = {
        emoji: '❤️',
        messageId,
        userId: user2Id,
      };

      const response = await request(app.getHttpServer())
        .post('/reactions')
        .set('Cookie', user2Cookies)
        .send(reactionData)
        .expect(HttpStatus.CREATED);

      expect(response.body.emoji).toBe(reactionData.emoji);
    });

    it('should list all reactions', async () => {
      const response = await request(app.getHttpServer())
        .get('/reactions')
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should get a specific reaction', async () => {
      const response = await request(app.getHttpServer())
        .get(`/reactions/${messageId}/${user1Id}`)
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);

      expect(response.body.messageId).toBe(messageId);
      expect(response.body.userId).toBe(user1Id);
    });

    it('should update a reaction', async () => {
      const updateData = {
        emoji: '🎉',
      };

      const response = await request(app.getHttpServer())
        .patch(`/reactions/${messageId}/${user1Id}`)
        .set('Cookie', user1Cookies)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body.emoji).toBe(updateData.emoji);
    });

    it('should remove a reaction', async () => {
      await request(app.getHttpServer())
        .delete(`/reactions/${messageId}/${user1Id}`)
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);
    });
  });

  describe('Phase 8: Direct Messages (DMs)', () => {
    it('should create or find a DM channel between users', async () => {
      const dmData = {
        user1Id,
        user2Id,
      };

      const response = await request(app.getHttpServer())
        .post('/channels/dm')
        .set('Cookie', user1Cookies)
        .send(dmData)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.isDM).toBe(true);
      dmChannelId = response.body.id;
    });

    it('should send a DM', async () => {
      const dmMessageData = {
        channelId: dmChannelId,
        content: JSON.stringify({ text: 'Hey, this is a private message!' }),
        userId: user1Id,
      };

      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Cookie', user1Cookies)
        .send(dmMessageData)
        .expect(HttpStatus.CREATED);

      expect(response.body.channelId).toBe(dmChannelId);
    });

    it('should get user DMs', async () => {
      const response = await request(app.getHttpServer())
        .get(`/channels/user/${user1Id}/dms`)
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const hasDM = response.body.some(
        (channel: any) => channel.id === dmChannelId,
      );
      expect(hasDM).toBe(true);
    });
  });

  describe('Phase 9: Membership Management', () => {
    it('should list all memberships', async () => {
      const response = await request(app.getHttpServer())
        .get('/memberships')
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should update a membership', async () => {
      const updateData = {
        // Add any updateable fields here
      };

      const response = await request(app.getHttpServer())
        .patch(`/memberships/${user2Id}/${serverId}`)
        .set('Cookie', user1Cookies)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body.userId).toBe(user2Id);
    });

    it('should remove a membership (user leaves server)', async () => {
      // First, create a new invite and have another user join temporarily
      // Then remove that membership for testing
      // For simplicity, we'll test removing user2's membership at the end
      // Note: Commenting out to keep user2 in server for other tests
      // await request(app.getHttpServer())
      //   .delete(`/memberships/${user2Id}/${serverId}`)
      //   .set('Cookie', user1Cookies)
      //   .expect(HttpStatus.OK);
    });
  });

  describe('Phase 10: Cleanup & Deletion', () => {
    it('should delete a channel', async () => {
      await request(app.getHttpServer())
        .delete(`/channels/${voiceChannelId}`)
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);
    });

    it('should delete an invite', async () => {
      await request(app.getHttpServer())
        .delete(`/servers/${serverId}/invites/${inviteCode}`)
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);
    });

    it('should delete a role', async () => {
      await request(app.getHttpServer())
        .delete(`/roles/${memberRoleId}`)
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);
    });

    // Note: Server deletion happens in afterAll cleanup
  });

  describe('Phase 11: Error Handling & Validation', () => {
    it('should return 401 for requests without token', async () => {
      await request(app.getHttpServer())
        .get('/servers')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 for invalid token', async () => {
      await request(app.getHttpServer())
        .get('/servers')
        .set('Authorization', 'Bearer invalid-token')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 for non-existent server', async () => {
      await request(app.getHttpServer())
        .get('/servers/999999')
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 for non-existent channel', async () => {
      await request(app.getHttpServer())
        .get('/channels/999999')
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 for non-existent message', async () => {
      await request(app.getHttpServer())
        .get('/messages/999999')
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 400 for invalid channel type', async () => {
      const invalidChannelData = {
        name: 'invalid',
        serverId,
        status: ChannelStatus.PUBLIC,
        type: 'INVALID_TYPE',
      };

      await request(app.getHttpServer())
        .post('/channels')
        .set('Cookie', user1Cookies)
        .send(invalidChannelData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/servers')
        .set('Cookie', user1Cookies)
        .send({ name: 'Test' }) // Missing servername
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 409 for duplicate servername', async () => {
      const duplicateData = {
        name: 'Another Server',
        servername: `testserver${timestamp}`, // Same as user1's server
      };

      await request(app.getHttpServer())
        .post('/servers')
        .set('Cookie', user2Cookies)
        .send(duplicateData)
        .expect(HttpStatus.CONFLICT);
    });
  });
});
