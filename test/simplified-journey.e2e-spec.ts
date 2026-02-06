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
 * Simplified User Journey E2E Test
 *
 * This test simulates key user flows with direct database setup for permissions.
 * Tests the API endpoints that frontend will consume.
 *
 * Note: Full server creation flow with automatic owner membership is pending implementation.
 * See Phase 0 checklist item: "Auto-assign creator as server owner with admin permissions"
 */
describe('Simplified User Journey (e2e)', () => {
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

  // Auth & Entity IDs
  let user1Cookies: string[];
  let user2Cookies: string[];
  let user1Id: number;
  let user2Id: number;
  let serverId: number;
  let adminRoleId: number;
  let textChannelId: number;
  let messageId: number;

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
    // Comprehensive cleanup
    try {
      if (user1Id || user2Id) {
        await prisma.reaction.deleteMany({
          where: { OR: [{ userId: user1Id }, { userId: user2Id }] },
        });
        await prisma.message.deleteMany({
          where: { OR: [{ userId: user1Id }, { userId: user2Id }] },
        });
        await prisma.membership.deleteMany({
          where: { OR: [{ userId: user1Id }, { userId: user2Id }] },
        });
      }

      if (serverId) {
        await prisma.invite.deleteMany({ where: { serverId } });
        await prisma.channel.deleteMany({ where: { serverId } });
        await prisma.role.deleteMany({ where: { serverId } });
        await prisma.server.deleteMany({ where: { id: serverId } });
      }

      if (user1Id || user2Id) {
        await prisma.profile.deleteMany({
          where: { OR: [{ userId: user1Id }, { userId: user2Id }] },
        });
        await prisma.user.deleteMany({
          where: { OR: [{ id: user1Id }, { id: user2Id }] },
        });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    await app.close();
  });

  describe('1. Authentication Flow', () => {
    it('should register user1', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(user1)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Registration successful');

      // Store cookies for subsequent requests
      const cookies = response.headers['set-cookie'];
      user1Cookies = Array.isArray(cookies) ? cookies : [cookies];

      const meResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);

      user1Id = meResponse.body.id;
    });

    it('should register user2', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(user2)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Registration successful');

      // Store cookies for subsequent requests
      const cookies = response.headers['set-cookie'];
      user2Cookies = Array.isArray(cookies) ? cookies : [cookies];

      const meResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', user2Cookies)
        .expect(HttpStatus.OK);

      user2Id = meResponse.body.id;
    });

    it('should login with username', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: user1.password, usernameOrEmail: user1.username })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Login successful');
    });

    it('should refresh tokens', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: user1.password, usernameOrEmail: user1.email })
        .expect(HttpStatus.OK);

      const loginCookies = Array.isArray(loginRes.headers['set-cookie'])
        ? loginRes.headers['set-cookie']
        : [loginRes.headers['set-cookie']];

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', loginCookies)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Token refreshed');
    });
  });

  describe('2. Server & Membership Setup', () => {
    it('should create server and setup admin role (via Prisma)', async () => {
      // Create server directly via Prisma for now
      const server = await prisma.server.create({
        data: {
          name: `Test Server ${timestamp}`,
          servername: `testserver${timestamp}`,
        },
      });
      serverId = server.id;

      // Create admin role with all permissions
      const role = await prisma.role.create({
        data: {
          name: 'Admin',
          permissions: JSON.stringify({
            [Permission.CONNECT_VOICE]: true,
            [Permission.DELETE_MESSAGES]: true,
            [Permission.EDIT_MESSAGES]: true,
            [Permission.MANAGE_CHANNELS]: true,
            [Permission.MANAGE_INVITES]: true,
            [Permission.MANAGE_ROLES]: true,
            [Permission.MANAGE_SERVERS]: true,
            [Permission.SEND_MESSAGES]: true,
            [Permission.VIEW_CHANNELS]: true,
          }),
          serverId,
        },
      });
      adminRoleId = role.id;

      // Add user1 as admin member
      await prisma.membership.create({
        data: {
          serverId,
          userId: user1Id,
          roles: {
            create: {
              roleId: adminRoleId,
            },
          },
        },
      });

      expect(serverId).toBeDefined();
      expect(adminRoleId).toBeDefined();
    });

    it('should get server details via API', async () => {
      const response = await request(app.getHttpServer())
        .get(`/servers/${serverId}`)
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(serverId);
    });

    it('should list user servers', async () => {
      const response = await request(app.getHttpServer())
        .get('/servers')
        .query({ userId: user1Id })
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('3. Invite & Join Flow', () => {
    let inviteCode: string;

    it('should create invite', async () => {
      const response = await request(app.getHttpServer())
        .post(`/servers/${serverId}/invites`)
        .set('Cookie', user1Cookies)
        .send({ createdBy: user1Id, expiresInDays: 7 })
        .expect(HttpStatus.CREATED);

      inviteCode = response.body.code;
      expect(inviteCode).toBeDefined();
    });

    it('should redeem invite', async () => {
      const response = await request(app.getHttpServer())
        .post(`/servers/invites/${inviteCode}/redeem`)
        .set('Cookie', user2Cookies)
        .send({ userId: user2Id })
        .expect(HttpStatus.CREATED);

      expect(response.body.userId).toBe(user2Id);
      expect(response.body.serverId).toBe(serverId);
    });

    it('should verify membership', async () => {
      const response = await request(app.getHttpServer())
        .get(`/memberships/${user2Id}/${serverId}`)
        .set('Cookie', user2Cookies)
        .expect(HttpStatus.OK);

      expect(response.body.userId).toBe(user2Id);
    });
  });

  describe('4. Channel Management', () => {
    it('should create text channel', async () => {
      const response = await request(app.getHttpServer())
        .post('/channels')
        .set('Cookie', user1Cookies)
        .send({
          name: 'general',
          serverId,
          status: ChannelStatus.PUBLIC,
          type: ChannelType.TEXT,
        })
        .expect(HttpStatus.CREATED);

      textChannelId = response.body.id;
      expect(response.body.name).toBe('general');
    });

    it('should list channels', async () => {
      const response = await request(app.getHttpServer())
        .get('/channels')
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should update channel', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/channels/${textChannelId}`)
        .set('Cookie', user1Cookies)
        .send({ name: 'general-chat', status: ChannelStatus.PUBLIC })
        .expect(HttpStatus.OK);

      expect(response.body.name).toBe('general-chat');
    });
  });

  describe('5. Messaging Flow', () => {
    it('should send message', async () => {
      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Cookie', user1Cookies)
        .send({
          channelId: textChannelId,
          content: JSON.stringify({ text: 'Hello World!' }),
          userId: user1Id,
        })
        .expect(HttpStatus.CREATED);

      messageId = response.body.id;
      expect(response.body.channelId).toBe(textChannelId);
    });

    it('should list messages', async () => {
      const response = await request(app.getHttpServer())
        .get('/messages')
        .query({ channelId: textChannelId })
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should edit message', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/messages/${messageId}`)
        .set('Cookie', user1Cookies)
        .send({ content: JSON.stringify({ text: 'Updated!' }) })
        .expect(HttpStatus.OK);

      expect(JSON.parse(response.body.content).text).toBe('Updated!');
    });
  });

  describe('6. Reactions', () => {
    it('should add reaction', async () => {
      const response = await request(app.getHttpServer())
        .post('/reactions')
        .set('Cookie', user1Cookies)
        .send({ emoji: '👍', messageId, userId: user1Id })
        .expect(HttpStatus.CREATED);

      expect(response.body.emoji).toBe('👍');
    });

    it('should list reactions', async () => {
      const response = await request(app.getHttpServer())
        .get('/reactions')
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('7. Error Handling', () => {
    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/servers')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 for non-existent server', async () => {
      await request(app.getHttpServer())
        .get('/servers/999999')
        .set('Cookie', user1Cookies)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 400 for invalid data', async () => {
      await request(app.getHttpServer())
        .post('/channels')
        .set('Cookie', user1Cookies)
        .send({ name: 'test' }) // Missing serverId
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
