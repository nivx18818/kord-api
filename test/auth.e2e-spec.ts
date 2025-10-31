/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '@/app.module';
import { PrismaService } from '@/modules/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let refreshToken: string;

  const testUser = {
    dateOfBirth: '1990-01-01',
    email: `test${Date.now()}@example.com`,
    password: 'Password123!',
    username: `testuser${Date.now()}`,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ forbidNonWhitelisted: true, whitelist: true }),
    );
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    // Clean up test user
    await prisma.user.deleteMany({
      where: {
        email: testUser.email,
      },
    });

    await app.close();
  });

  describe('/auth/check-email (GET)', () => {
    it('should return available: true for non-existent email', () => {
      return request(app.getHttpServer())
        .get('/auth/check-email')
        .query({ email: 'nonexistent@example.com' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual({ available: true });
        });
    });

    it('should return available: false after registration', async () => {
      // First register
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(HttpStatus.CREATED);

      // Then check email
      return request(app.getHttpServer())
        .get('/auth/check-email')
        .query({ email: testUser.email })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual({ available: false });
        });
    });
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          email: `test2${Date.now()}@example.com`,
          username: `testuser2${Date.now()}`,
        })
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
        });
    });

    it('should return 409 for duplicate email', async () => {
      const duplicateUser = {
        ...testUser,
        username: `testuser3${Date.now()}`,
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(duplicateUser)
        .expect(HttpStatus.CONFLICT);
    });

    it('should return 409 for duplicate username', async () => {
      const duplicateUser = {
        ...testUser,
        email: `test3${Date.now()}@example.com`,
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(duplicateUser)
        .expect(HttpStatus.CONFLICT);
    });

    it('should return 400 for invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for missing password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          dateOfBirth: testUser.dateOfBirth,
          email: `test4${Date.now()}@example.com`,
          username: `testuser4${Date.now()}`,
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully with valid credentials using email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: testUser.password,
          usernameOrEmail: testUser.email,
        })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          accessToken = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        });
    });

    it('should login successfully with valid credentials using username', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: testUser.password,
          usernameOrEmail: testUser.username,
        })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
        });
    });

    it('should return 401 for invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: testUser.password,
          usernameOrEmail: 'nonexistent@example.com',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 for invalid username', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: testUser.password,
          usernameOrEmail: 'nonexistentuser',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 for invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: 'WrongPassword123!',
          usernameOrEmail: testUser.email,
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should refresh tokens successfully with valid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          // Update tokens for next tests
          accessToken = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        });
    });

    it('should return 401 for invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/auth/me (GET)', () => {
    it('should return user profile with valid access token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('username');
          expect(res.body.email).toBe(testUser.email);
        });
    });

    it('should return 401 without access token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 with invalid access token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
