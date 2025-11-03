---
description: 'Implement Cookie-Based Auth Phase 5 – Testing Updates for Kord API'
# prettier-ignore
tools: ['edit/createFile', 'edit/createDirectory', 'edit/editFiles', 'search', 'runCommands', 'runTasks', 'context7/*', 'upstash/context7/*', 'usages', 'problems', 'changes', 'testFailure', 'fetch', 'githubRepo', 'extensions', 'todos']
---

## Task: Implement Cookie-Based Auth Phase 5 – Testing Updates

Update all test files to work with cookie-based authentication instead of header-based authentication.

### Context

**Prerequisites**: Phases 1-4 completed (cookie infrastructure, JWT strategy, controller updates, WebSocket auth)

**Current State**:

- Bruno tests use Bearer authentication and store tokens in environment variables
- E2E tests manually set Authorization headers
- Tests expect tokens in response bodies
- No tests for logout functionality

**Target State**:

- Bruno tests automatically handle cookies
- E2E tests use cookie-based authentication with Supertest
- Tests verify Set-Cookie headers instead of response body tokens
- Comprehensive logout testing

### Phase 5 Objectives

1. Update Bruno authentication tests
2. Update Bruno test scripts to handle cookies
3. Update E2E authentication tests
4. Update E2E journey tests
5. Add logout tests
6. Verify all protected endpoint tests work with cookies

### Step-by-Step Instructions

#### Step 5.1: Update Bruno Login Test

**File**: `bruno/auth/login-with-email.bru`

**Current**:

```bruno
post {
  url: {{base_url}}/auth/login
  body: json
  auth: none
}

body:json {
  {
    "usernameOrEmail": "{{testEmail}}",
    "password": "{{testPassword}}"
  }
}

script:post-response {
  if (res.getStatus() === 200) {
    bru.setEnvVar("accessToken", res.getBody().accessToken);
    bru.setEnvVar("refreshToken", res.getBody().refreshToken);
  }
}

tests {
  test("Status should be 200 for successful login", function () {
    expect(res.getStatus()).to.equal(200);
  });

  test("Response should include accessToken", function () {
    expect(res.getBody()).to.have.property("accessToken");
  });

  test("Response should include refreshToken", function () {
    expect(res.getBody()).to.have.property("refreshToken");
  });
}
```

**Updated**:

```bruno
meta {
  name: login-with-email
  type: http
  seq: 9
}

post {
  url: {{base_url}}/auth/login
  body: json
  auth: none
}

body:json {
  {
    "usernameOrEmail": "{{testEmail}}",
    "password": "{{testPassword}}"
  }
}

script:post-response {
  // Cookies are automatically stored by Bruno
  // No need to manually extract and store tokens
  if (res.getStatus() === 200) {
    console.log("Login successful - cookies set automatically");
  }
}

tests {
  test("Status should be 200 for successful login", function () {
    expect(res.getStatus()).to.equal(200);
  });

  test("Response should include success message", function () {
    expect(res.getBody()).to.have.property("message");
    expect(res.getBody().message).to.equal("Login successful");
  });

  test("Response should set access token cookie", function () {
    const cookies = res.getHeaders()['set-cookie'];
    expect(cookies).to.be.an('array');

    const hasAccessToken = cookies.some(c => c.includes('kord_access_token'));
    expect(hasAccessToken).to.be.true;
  });

  test("Response should set refresh token cookie", function () {
    const cookies = res.getHeaders()['set-cookie'];
    expect(cookies).to.be.an('array');

    const hasRefreshToken = cookies.some(c => c.includes('kord_refresh_token'));
    expect(hasRefreshToken).to.be.true;
  });

  test("Cookies should be httpOnly", function () {
    const cookies = res.getHeaders()['set-cookie'];
    const accessTokenCookie = cookies.find(c => c.includes('kord_access_token'));
    expect(accessTokenCookie).to.include('HttpOnly');
  });
}
```

**Key Changes**:

- Removed token extraction from response body
- Check for success message instead of tokens
- Verify Set-Cookie headers are present
- Verify cookie attributes (HttpOnly)
- Bruno automatically stores and sends cookies

#### Step 5.2: Update Bruno Login with Username Test

**File**: `bruno/auth/login-with-username.bru`

Apply same pattern as login-with-email:

- Remove token extraction script
- Update tests to check for message and cookies
- Verify Set-Cookie headers

#### Step 5.3: Update Bruno Register Test

**File**: `bruno/auth/register.bru`

**Current**:

```bruno
script:post-response {
  if (res.getStatus() === 201) {
    bru.setEnvVar("accessToken", res.getBody().accessToken);
    bru.setEnvVar("refreshToken", res.getBody().refreshToken);
    bru.setEnvVar("testUserId", res.getBody().user.id);
  }
}
```

**Updated**:

```bruno
script:post-response {
  // Cookies are automatically stored by Bruno
  if (res.getStatus() === 201) {
    console.log("Registration successful - cookies set automatically");
    // Note: If you need to store user ID for other tests, you'd need to
    // call GET /auth/me after registration to get user details
  }
}

tests {
  test("Status should be 201 for successful registration", function () {
    expect(res.getStatus()).to.equal(201);
  });

  test("Response should include success message", function () {
    expect(res.getBody()).to.have.property("message");
    expect(res.getBody().message).to.equal("Registration successful");
  });

  test("Response should set cookies", function () {
    const cookies = res.getHeaders()['set-cookie'];
    expect(cookies).to.be.an('array');

    const hasAccessToken = cookies.some(c => c.includes('kord_access_token'));
    const hasRefreshToken = cookies.some(c => c.includes('kord_refresh_token'));

    expect(hasAccessToken).to.be.true;
    expect(hasRefreshToken).to.be.true;
  });
}
```

#### Step 5.4: Update Bruno /auth/me Test

**File**: `bruno/auth/me.bru`

**Current**:

```bruno
get {
  url: {{base_url}}/auth/me
  body: none
  auth: bearer
}

auth:bearer {
  token: {{accessToken}}
}
```

**Updated**:

```bruno
meta {
  name: me
  type: http
  seq: 16
}

get {
  url: {{base_url}}/auth/me
  body: none
  auth: none
}

# Cookies are sent automatically - no auth header needed

tests {
  test("Status should be 200 with valid token", function () {
    expect(res.getStatus()).to.equal(200);
  });

  test("Response should include user information", function () {
    expect(res.getBody()).to.have.property("id");
    expect(res.getBody()).to.have.property("email");
    expect(res.getBody()).to.have.property("username");
  });

  test("Response should match test user", function () {
    expect(res.getBody().email).to.equal(bru.getEnvVar("testEmail"));
    expect(res.getBody().username).to.equal(bru.getEnvVar("testUsername"));
  });
}
```

**Key Changes**:

- Changed auth from `bearer` to `none`
- Removed `auth:bearer` block
- Cookies sent automatically by Bruno
- Tests remain the same

#### Step 5.5: Update Bruno /auth/me-without-token Test

**File**: `bruno/auth/me-without-token.bru`

**Updated**:

```bruno
meta {
  name: me-without-token
  type: http
  seq: 17
}

get {
  url: {{base_url}}/auth/me
  body: none
  auth: none
}

# Note: This test should be run in a separate/private window or after logout
# to ensure no cookies are present

tests {
  test("Status should be 401 without token", function () {
    expect(res.getStatus()).to.equal(401);
  });

  test("Response should include error information", function () {
    expect(res.getBody()).to.have.property("message");
    expect(res.getBody()).to.have.property("statusCode");
    expect(res.getBody().statusCode).to.equal(401);
  });
}
```

**Note**: Bruno maintains cookies across requests in the same session. To test "without token", you need to either:

1. Run this in a separate Bruno window/session
2. Run the logout test first
3. Manually clear cookies in Bruno

#### Step 5.6: Update Bruno Refresh Token Test

**File**: `bruno/auth/refresh-token.bru`

**Current**:

```bruno
post {
  url: {{base_url}}/auth/refresh
  body: json
  auth: none
}

body:json {
  {
    "refreshToken": "{{refreshToken}}"
  }
}
```

**Updated**:

```bruno
meta {
  name: refresh-token
  type: http
  seq: 14
}

post {
  url: {{base_url}}/auth/refresh
  body: none
  auth: none
}

# Refresh token is read from cookies automatically

tests {
  test("Status should be 200 for successful refresh", function () {
    expect(res.getStatus()).to.equal(200);
  });

  test("Response should include success message", function () {
    expect(res.getBody()).to.have.property("message");
    expect(res.getBody().message).to.equal("Token refreshed");
  });

  test("Response should set new cookies", function () {
    const cookies = res.getHeaders()['set-cookie'];
    expect(cookies).to.be.an('array');

    const hasAccessToken = cookies.some(c => c.includes('kord_access_token'));
    const hasRefreshToken = cookies.some(c => c.includes('kord_refresh_token'));

    expect(hasAccessToken).to.be.true;
    expect(hasRefreshToken).to.be.true;
  });
}
```

**Key Changes**:

- Removed body (no longer need to send refresh token in body)
- Changed body type to `none`
- Verify new cookies are set

#### Step 5.7: Create Bruno Logout Test (NEW)

**File**: `bruno/auth/logout.bru` (NEW FILE)

**Implementation**:

```bruno
meta {
  name: logout
  type: http
  seq: 20
}

post {
  url: {{base_url}}/auth/logout
  body: none
  auth: none
}

# Cookies are sent automatically for authentication

tests {
  test("Status should be 200 for successful logout", function () {
    expect(res.getStatus()).to.equal(200);
  });

  test("Response should include success message", function () {
    expect(res.getBody()).to.have.property("message");
    expect(res.getBody().message).to.equal("Logout successful");
  });

  test("Response should clear access token cookie", function () {
    const cookies = res.getHeaders()['set-cookie'];
    expect(cookies).to.be.an('array');

    const clearsAccessToken = cookies.some(c =>
      c.includes('kord_access_token') && c.includes('Max-Age=0')
    );
    expect(clearsAccessToken).to.be.true;
  });

  test("Response should clear refresh token cookie", function () {
    const cookies = res.getHeaders()['set-cookie'];

    const clearsRefreshToken = cookies.some(c =>
      c.includes('kord_refresh_token') && c.includes('Max-Age=0')
    );
    expect(clearsRefreshToken).to.be.true;
  });
}
```

#### Step 5.8: Update Bruno Collection README

**File**: `bruno/auth/README.md`

**Update Test Execution Order Section**:

```markdown
## Test Execution Order

To run the complete authentication flow, execute tests in this order:

1. **check-email-available.bru** (seq 1) - Verify email is available
2. **register.bru** (seq 2) - Register new user (sets cookies automatically)
3. **me.bru** (seq 16) - Verify authenticated access works
4. **login-with-email.bru** (seq 9) - Login with email
5. **login-with-username.bru** (seq 10) - Login with username
6. **refresh-token.bru** (seq 14) - Refresh access token
7. **logout.bru** (seq 20) - Logout and clear session
8. **me-without-token.bru** (seq 17) - Verify unauthenticated access fails

### Cookie-Based Authentication

This API uses cookie-based JWT authentication. Bruno automatically handles cookies:

- Cookies are set when you login/register
- Cookies are sent with subsequent requests automatically
- No need to manually manage tokens
- Run logout test to clear cookies between test runs

### Environment Variables

The tests no longer store tokens. They only use:

- `testEmail` - Email for testing
- `testUsername` - Username for testing
- `testPassword` - Password for testing
- `testName` - Name for testing
- `testDateOfBirth` - Date of birth for testing
```

#### Step 5.9: Update E2E Auth Tests

**File**: `test/auth.e2e-spec.ts`

**Implementation**:

```typescript
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '@/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authCookies: string[];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same pipes as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register user and set cookies', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'e2e-test@example.com',
          username: 'e2euser',
          password: 'Password123!',
          name: 'E2E Test User',
          dateOfBirth: '1990-01-01',
        })
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Registration successful');

      // Verify cookies are set
      expect(response.headers['set-cookie']).toBeDefined();
      const cookieStrings = response.headers['set-cookie'];
      expect(
        cookieStrings.some((c: string) => c.includes('kord_access_token')),
      ).toBe(true);
      expect(
        cookieStrings.some((c: string) => c.includes('kord_refresh_token')),
      ).toBe(true);
      expect(cookieStrings.some((c: string) => c.includes('HttpOnly'))).toBe(
        true,
      );

      // Store cookies for subsequent requests
      authCookies = cookieStrings;
    });

    it('should return 400 for duplicate email', async () => {
      // Register first user
      await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        email: 'duplicate@example.com',
        username: 'user1',
        password: 'Password123!',
        name: 'User One',
        dateOfBirth: '1990-01-01',
      });

      // Try to register with same email
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          username: 'user2',
          password: 'Password123!',
          name: 'User Two',
          dateOfBirth: '1990-01-01',
        })
        .expect(409);

      expect(response.body).toHaveProperty('code');
      expect(response.body.code).toBe(40901);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Register a user first
      await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        email: 'login-test@example.com',
        username: 'loginuser',
        password: 'Password123!',
        name: 'Login Test User',
        dateOfBirth: '1990-01-01',
      });
    });

    it('should login with email and set cookies', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          usernameOrEmail: 'login-test@example.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Login successful');

      const cookieStrings = response.headers['set-cookie'];
      expect(
        cookieStrings.some((c: string) => c.includes('kord_access_token')),
      ).toBe(true);
      expect(
        cookieStrings.some((c: string) => c.includes('kord_refresh_token')),
      ).toBe(true);

      authCookies = cookieStrings;
    });

    it('should login with username and set cookies', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          usernameOrEmail: 'loginuser',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
    });

    it('should return 401 for invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          usernameOrEmail: 'login-test@example.com',
          password: 'WrongPassword!',
        })
        .expect(401);
    });
  });

  describe('/auth/me (GET)', () => {
    beforeEach(async () => {
      // Register and get cookies
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'me-test@example.com',
          username: 'meuser',
          password: 'Password123!',
          name: 'Me Test User',
          dateOfBirth: '1990-01-01',
        });

      authCookies = response.headers['set-cookie'];
    });

    it('should return user info with valid cookie', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', authCookies)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('username');
      expect(response.body.email).toBe('me-test@example.com');
      expect(response.body.username).toBe('meuser');
    });

    it('should return 401 without cookie', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });

    it('should return 401 with invalid cookie', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', ['kord_access_token=invalid_token'])
        .expect(401);
    });
  });

  describe('/auth/refresh (POST)', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'refresh-test@example.com',
          username: 'refreshuser',
          password: 'Password123!',
          name: 'Refresh Test User',
          dateOfBirth: '1990-01-01',
        });

      authCookies = response.headers['set-cookie'];
    });

    it('should refresh tokens with valid refresh token cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', authCookies)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Token refreshed');

      const newCookies = response.headers['set-cookie'];
      expect(
        newCookies.some((c: string) => c.includes('kord_access_token')),
      ).toBe(true);
      expect(
        newCookies.some((c: string) => c.includes('kord_refresh_token')),
      ).toBe(true);
    });

    it('should return 401 without refresh token cookie', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'logout-test@example.com',
          username: 'logoutuser',
          password: 'Password123!',
          name: 'Logout Test User',
          dateOfBirth: '1990-01-01',
        });

      authCookies = response.headers['set-cookie'];
    });

    it('should logout and clear cookies', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', authCookies)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Logout successful');

      const cookieStrings = response.headers['set-cookie'];
      expect(cookieStrings.some((c: string) => c.includes('Max-Age=0'))).toBe(
        true,
      );
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .expect(401);
    });

    it('should prevent access after logout', async () => {
      // Logout
      const logoutResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', authCookies)
        .expect(200);

      const clearedCookies = logoutResponse.headers['set-cookie'];

      // Try to access protected endpoint with cleared cookies
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', clearedCookies)
        .expect(401);
    });
  });

  describe('/auth/check-email (GET)', () => {
    it('should return available for non-existent email', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/check-email?email=available@example.com')
        .expect(200);

      expect(response.body).toHaveProperty('available');
      expect(response.body.available).toBe(true);
    });

    it('should return unavailable for existing email', async () => {
      // Register user first
      await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        email: 'taken@example.com',
        username: 'takenuser',
        password: 'Password123!',
        name: 'Taken User',
        dateOfBirth: '1990-01-01',
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/check-email?email=taken@example.com')
        .expect(200);

      expect(response.body.available).toBe(false);
    });
  });
});
```

### Testing Phase 5

#### 1. Run Bruno Tests

```bash
npx @usebruno/cli run bruno --env local
```

Expected: All auth tests pass with cookie handling

#### 2. Run E2E Tests

```bash
npm run test:e2e
```

Expected: All auth E2E tests pass

#### 3. Run All Tests

```bash
npm run test
```

Expected: All unit and E2E tests pass

### Expected Outcomes

- [x] Bruno tests use cookie authentication
- [x] Bruno tests verify Set-Cookie headers
- [x] Bruno tests no longer store tokens in variables
- [x] E2E tests use Supertest with cookies
- [x] Logout tests added and passing
- [x] All authentication flows tested with cookies
- [x] Tests verify cookie attributes (HttpOnly)

### Files Modified/Created

**Modified**:

- `bruno/auth/login-with-email.bru`
- `bruno/auth/login-with-username.bru`
- `bruno/auth/register.bru`
- `bruno/auth/me.bru`
- `bruno/auth/me-without-token.bru`
- `bruno/auth/refresh-token.bru`
- `bruno/auth/README.md`
- `test/auth.e2e-spec.ts`

**Created**:

- `bruno/auth/logout.bru`

### Common Issues & Solutions

**Issue**: Bruno tests fail with 401
**Solution**: Ensure tests run in order (register/login first to set cookies)

**Issue**: me-without-token test fails (returns 200 instead of 401)
**Solution**: Cookies persist in Bruno session; run logout first or use separate window

**Issue**: E2E tests fail with "Cannot set headers after they are sent"
**Solution**: Ensure `@Res({ passthrough: true })` is used in controllers

**Issue**: Cookies not sent in E2E tests
**Solution**: Use `.set('Cookie', authCookies)` with Supertest

### Next Steps

After completing Phase 5, proceed to **Phase 6: Final Integration & Verification** to:

1. Update environment configuration
2. Test all protected endpoints
3. Verify CORS configuration
4. Document changes
5. Clean up unused code

### References

- Main implementation plan: `docs/plan/cookie-auth-implementation.md`
- Bruno CLI: https://docs.usebruno.com/cli/overview
- Supertest with Cookies: https://github.com/ladjs/supertest
