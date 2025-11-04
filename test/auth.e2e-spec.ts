/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '@/app.module';
import { PrismaService } from '@/modules/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authCookies: string[];

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

    // Apply cookie parser middleware
    app.use(cookieParser());

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
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(HttpStatus.CREATED);

      // Store cookies for subsequent tests
      authCookies = Array.isArray(response.headers['set-cookie'])
        ? response.headers['set-cookie']
        : [response.headers['set-cookie']];

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
    it('should register a new user successfully and set cookies', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          email: `test2${Date.now()}@example.com`,
          username: `testuser2${Date.now()}`,
        })
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toBe('Registration successful');

          // Verify cookies are set
          const cookies = res.headers['set-cookie'];
          expect(cookies).toBeDefined();
          const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
          expect(
            cookieArray.some((c: string) => c.includes('kord_access_token')),
          ).toBe(true);
          expect(
            cookieArray.some((c: string) => c.includes('kord_refresh_token')),
          ).toBe(true);
          expect(cookieArray.some((c: string) => c.includes('HttpOnly'))).toBe(
            true,
          );
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
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toBe('Login successful');

          // Verify cookies are set
          const cookies = res.headers['set-cookie'];
          const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
          expect(
            cookieArray.some((c: string) => c.includes('kord_access_token')),
          ).toBe(true);
          expect(
            cookieArray.some((c: string) => c.includes('kord_refresh_token')),
          ).toBe(true);

          // Store cookies for subsequent tests
          authCookies = cookieArray;
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
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toBe('Login successful');
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
    it('should refresh tokens successfully with valid refresh token cookie', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', authCookies)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toBe('Token refreshed');

          // Verify new cookies are set
          const newCookies = res.headers['set-cookie'];
          const cookieArray = Array.isArray(newCookies)
            ? newCookies
            : [newCookies];
          expect(
            cookieArray.some((c: string) => c.includes('kord_access_token')),
          ).toBe(true);
          expect(
            cookieArray.some((c: string) => c.includes('kord_refresh_token')),
          ).toBe(true);

          // Update cookies for next tests
          authCookies = cookieArray;
        });
    });

    it('should return 401 for invalid refresh token cookie', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', ['kord_refresh_token=invalid-token'])
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/auth/me (GET)', () => {
    it('should return user profile with valid cookie', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', authCookies)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('username');
          expect(res.body.email).toBe(testUser.email);
        });
    });

    it('should return 401 without cookie', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 with invalid cookie', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', ['kord_access_token=invalid-token'])
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout and clear cookies', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', authCookies)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toBe('Logout successful');

          // Verify cookies are cleared
          const cookies = res.headers['set-cookie'];
          if (cookies) {
            const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
            // Check if cookies are being cleared (either Max-Age=0 or expires in the past)
            const hasClearing = cookieArray.some(
              (c: string) => c.includes('Max-Age=0') || c.includes('Expires='),
            );
            expect(hasClearing).toBe(true);
          }
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should prevent access after logout', async () => {
      // Logout
      const logoutResponse = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', authCookies)
        .expect(HttpStatus.OK);

      const clearedCookies = logoutResponse.headers['set-cookie'];
      const cookieArray = Array.isArray(clearedCookies)
        ? clearedCookies
        : [clearedCookies];

      // Try to access protected endpoint with cleared cookies
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', cookieArray)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
