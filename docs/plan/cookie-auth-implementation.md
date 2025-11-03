# Cookie-Based JWT Authentication Implementation Plan

## Overview

This document outlines the comprehensive plan to migrate Kord API from header-based JWT authentication to cookie-based authentication for improved security and simplified client-side implementation.

---

## Current State Analysis

### Current Authentication Flow

- **Access Tokens**: 15-minute expiry, sent via `Authorization: Bearer <token>` header
- **Refresh Tokens**: 7-day expiry, stored in database and returned in response body
- **Token Extraction**: `JwtStrategy` uses `ExtractJwt.fromAuthHeaderAsBearerToken()`
- **Response Format**: Auth endpoints return tokens as JSON (`{ accessToken, refreshToken }`)
- **Client Storage**: Tokens stored in localStorage/sessionStorage (vulnerable to XSS)
- **WebSocket Auth**: Currently no authentication implemented for Socket.IO connections

### Security Concerns

1. **XSS Vulnerability**: Tokens in localStorage accessible to malicious JavaScript
2. **Manual Token Management**: Client must attach tokens to every request
3. **No CSRF Protection**: Headers don't benefit from SameSite cookie attributes
4. **WebSocket Security Gap**: No authentication for real-time connections

### Files Involved in Current Implementation

- `src/modules/auth/strategies/jwt.strategy.ts` - Token extraction from header
- `src/modules/auth/auth.controller.ts` - Returns tokens in response body
- `src/modules/auth/auth.service.ts` - Token generation logic
- `src/modules/auth/guards/jwt-auth.guard.ts` - Passport JWT guard
- `src/modules/auth/dto/auth-response.dto.ts` - Token response structure
- `bruno/auth/*.bru` - Test files using Bearer authentication
- `test/auth.e2e-spec.ts` - E2E tests with header-based auth

---

## Target State: Cookie-Based Authentication

### Benefits

1. **XSS Mitigation**: HttpOnly cookies inaccessible to JavaScript
2. **Automatic Attachment**: Cookies sent automatically with every request
3. **CSRF Protection**: SameSite attribute prevents cross-site request forgery
4. **Simplified Client Code**: No manual token management required
5. **WebSocket Security**: Cookies included in Socket.IO handshake automatically

### Cookie Strategy

#### Access Token Cookie

```typescript
{
  name: 'kord_access_token',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/'
}
```

#### Refresh Token Cookie

```typescript
{
  name: 'kord_refresh_token',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/v1/auth/refresh' // Restrict to refresh endpoint only
}
```

### Cookie Operations

- **Set on**: `/auth/login`, `/auth/register`, `/auth/refresh`
- **Clear on**: `/auth/logout`
- **Read from**: All protected endpoints via JwtStrategy

---

## Implementation Phases

## Phase 1: Core Infrastructure Setup

**Goal**: Install dependencies and configure basic cookie handling

### Step 1.1: Install Dependencies

**File**: `package.json`

**Action**: Add cookie-parser and types

```bash
npm install cookie-parser
npm install -D @types/cookie-parser
```

**Dependencies**:

- `cookie-parser@^1.4.6` - Express middleware for parsing cookies
- `@types/cookie-parser@^1.4.7` - TypeScript definitions

### Step 1.2: Configure Cookie Parser Middleware

**File**: `src/main.ts`

**Action**: Import and enable cookie-parser in bootstrap function

**Changes**:

```typescript
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Add cookie parser middleware before other middleware
  app.use(cookieParser());

  // Existing configuration...
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    credentials: true, // Already set - required for cookies
    origin: process.env.CLIENT_URL,
  });
  // ...
}
```

**Requirements**:

- Cookie parser must be configured before routes are registered
- CORS credentials must remain enabled

### Step 1.3: Create Cookie Configuration Constants

**File**: `src/common/constants/cookie-config.ts` (new file)

**Action**: Define centralized cookie configuration

**Implementation**:

```typescript
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'kord_access_token',
  REFRESH_TOKEN: 'kord_refresh_token',
} as const;

export interface CookieConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
  domain?: string;
}

export const getAccessTokenCookieOptions = (): CookieConfig => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
  domain: process.env.COOKIE_DOMAIN,
});

export const getRefreshTokenCookieOptions = (): CookieConfig => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/v1/auth/refresh', // Restrict to refresh endpoint
  domain: process.env.COOKIE_DOMAIN,
});

export const getClearCookieOptions = (): CookieConfig => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 0, // Expire immediately
  path: '/',
  domain: process.env.COOKIE_DOMAIN,
});
```

**Requirements**:

- Environment-aware secure flag
- Configurable domain for cross-subdomain scenarios
- Separate path restrictions for refresh token

### Step 1.4: Create Cookie Extraction Utility

**File**: `src/modules/auth/utils/cookie-extractor.ts` (new file)

**Action**: Create utility function for passport-jwt

**Implementation**:

```typescript
import { Request } from 'express';
import { COOKIE_NAMES } from '@/common/constants/cookie-config';

export const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies[COOKIE_NAMES.ACCESS_TOKEN] || null;
  }
  return null;
};
```

**Requirements**:

- Compatible with passport-jwt ExtractJwt custom extractor
- Returns null if cookie not found
- Type-safe with Express Request type

---

## Phase 2: JWT Strategy Update

**Goal**: Modify JWT authentication to extract tokens from cookies

### Step 2.1: Update JwtStrategy

**File**: `src/modules/auth/strategies/jwt.strategy.ts`

**Action**: Replace header extraction with cookie extraction

**Before**:

```typescript
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET as string,
    });
  }
  // ...
}
```

**After**:

```typescript
import { Strategy } from 'passport-jwt';
import { cookieExtractor } from '../utils/cookie-extractor';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      ignoreExpiration: false,
      jwtFromRequest: cookieExtractor,
      secretOrKey: process.env.JWT_ACCESS_SECRET as string,
    });
  }

  validate(payload: JwtPayload) {
    return {
      email: payload.email,
      id: payload.sub,
      username: payload.username,
    };
  }
}
```

**Requirements**:

- Remove `ExtractJwt.fromAuthHeaderAsBearerToken()` import
- Use custom `cookieExtractor` function
- Validate function remains unchanged

### Step 2.2: Test JWT Extraction

**Action**: Verify JwtAuthGuard works with cookie extraction

**Validation**:

- Create test request with cookie
- Verify guard successfully extracts and validates token
- Confirm unauthorized response when cookie missing

---

## Phase 3: Controller & Service Updates

**Goal**: Modify auth endpoints to set/clear cookies instead of returning tokens

### Step 3.1: Update AuthController for Cookie Responses

**File**: `src/modules/auth/auth.controller.ts`

**Action**: Modify login, register, and refresh to set cookies

**Key Changes**:

1. Import Response decorator and cookie utilities
2. Add `@Res({ passthrough: true })` to methods
3. Set cookies in response
4. Return user info instead of tokens (optional)

**Implementation**:

```typescript
import { Response } from 'express';
import { Res } from '@nestjs/common';
import {
  COOKIE_NAMES,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from '@/common/constants/cookie-config';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const { accessToken, refreshToken } =
      await this.authService.login(loginDto);

    // Set cookies
    response.cookie(
      COOKIE_NAMES.ACCESS_TOKEN,
      accessToken,
      getAccessTokenCookieOptions(),
    );
    response.cookie(
      COOKIE_NAMES.REFRESH_TOKEN,
      refreshToken,
      getRefreshTokenCookieOptions(),
    );

    return { message: 'Login successful' };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const { accessToken, refreshToken } =
      await this.authService.register(registerDto);

    response.cookie(
      COOKIE_NAMES.ACCESS_TOKEN,
      accessToken,
      getAccessTokenCookieOptions(),
    );
    response.cookie(
      COOKIE_NAMES.REFRESH_TOKEN,
      refreshToken,
      getRefreshTokenCookieOptions(),
    );

    return { message: 'Registration successful' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const refreshToken = request.cookies[COOKIE_NAMES.REFRESH_TOKEN];

    if (!refreshToken) {
      throw new RefreshTokenInvalidException();
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refresh(refreshToken);

    response.cookie(
      COOKIE_NAMES.ACCESS_TOKEN,
      accessToken,
      getAccessTokenCookieOptions(),
    );
    response.cookie(
      COOKIE_NAMES.REFRESH_TOKEN,
      newRefreshToken,
      getRefreshTokenCookieOptions(),
    );

    return { message: 'Token refreshed' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  getProfile(@CurrentUser() user: RequestUser): RequestUser {
    return user;
  }

  @Get('check-email')
  @HttpCode(HttpStatus.OK)
  async checkEmail(
    @Query('email') email: string,
  ): Promise<{ available: boolean }> {
    return this.authService.checkEmail(email);
  }
}
```

**Requirements**:

- Use `@Res({ passthrough: true })` to maintain NestJS response handling
- Set both access and refresh token cookies
- Return simple success messages instead of tokens
- Handle refresh token from cookie instead of body

### Step 3.2: Add Logout Endpoint

**File**: `src/modules/auth/auth.controller.ts`

**Action**: Create logout endpoint to clear cookies

**Implementation**:

```typescript
@Post('logout')
@UseGuards(JwtAuthGuard)
@HttpCode(HttpStatus.OK)
async logout(
  @CurrentUser() user: RequestUser,
  @Req() request: Request,
  @Res({ passthrough: true }) response: Response,
): Promise<{ message: string }> {
  const refreshToken = request.cookies[COOKIE_NAMES.REFRESH_TOKEN];

  if (refreshToken) {
    await this.authService.logout(user.id, refreshToken);
  }

  // Clear cookies
  response.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, getClearCookieOptions());
  response.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
    ...getClearCookieOptions(),
    path: '/api/v1/auth/refresh',
  });

  return { message: 'Logout successful' };
}
```

**Requirements**:

- Require authentication (JwtAuthGuard)
- Invalidate refresh token in database
- Clear both cookies with proper path options
- Handle gracefully if refresh token missing

### Step 3.3: Update AuthService for Logout

**File**: `src/modules/auth/auth.service.ts`

**Action**: Add logout method to invalidate refresh token

**Implementation**:

```typescript
async logout(userId: number, refreshToken: string): Promise<void> {
  try {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });
  } catch (error) {
    // Log error but don't throw - logout should succeed even if token cleanup fails
    console.error('Error during logout:', error);
  }
}
```

**Requirements**:

- Delete refresh token from database
- Use deleteMany to handle multiple matches
- Don't throw errors (logout should always succeed)
- Consider adding cleanup for expired tokens

### Step 3.4: Update AuthResponseDto

**File**: `src/modules/auth/dto/auth-response.dto.ts`

**Action**: Make tokens optional for backward compatibility (optional step)

**Before**:

```typescript
export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
}
```

**After (Option 1 - Remove DTO)**:
Remove the DTO entirely and return simple message objects.

**After (Option 2 - Keep for Compatibility)**:

```typescript
export class AuthResponseDto {
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}
```

**Recommendation**: Remove DTO since responses no longer include tokens.

---

## Phase 4: WebSocket Authentication

**Goal**: Secure Socket.IO connections with cookie-based authentication

### Step 4.1: Create WebSocket Cookie Extractor

**File**: `src/modules/messages/utils/ws-cookie-extractor.ts` (new file)

**Action**: Extract and parse cookies from Socket.IO handshake

**Implementation**:

```typescript
import { Socket } from 'socket.io';
import { COOKIE_NAMES } from '@/common/constants/cookie-config';

export const extractTokenFromSocket = (socket: Socket): string | null => {
  const cookieHeader = socket.handshake.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  // Parse cookie string
  const cookies = cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  return cookies[COOKIE_NAMES.ACCESS_TOKEN] || null;
};
```

**Requirements**:

- Parse cookie header from Socket.IO handshake
- Extract access token cookie
- Return null if not found

### Step 4.2: Update MessagesGateway with Authentication

**File**: `src/modules/messages/messages.gateway.ts`

**Action**: Validate JWT on WebSocket connection

**Implementation**:

```typescript
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { extractTokenFromSocket } from './utils/ws-cookie-extractor';

@UseFilters(new WsExceptionFilter())
@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private typingTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = extractTokenFromSocket(client);

      if (!token) {
        throw new WsException('Unauthorized');
      }

      // Verify token
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      // Store user info in socket data
      client.data.user = {
        id: payload.sub,
        email: payload.email,
        username: payload.username,
      };

      console.log(`Client connected: ${client.id} (User: ${payload.username})`);
    } catch (error) {
      console.error('WebSocket auth failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-channel')
  handleJoinChannel(
    @MessageBody() data: { channelId: number },
    @ConnectedSocket() client: Socket,
  ) {
    // Access authenticated user
    const user = client.data.user;

    if (!user) {
      throw new WsException('Unauthorized');
    }

    const room = `channel-${data.channelId}`;
    void client.join(room);
    return { data: { channelId: data.channelId }, event: 'joined-channel' };
  }

  // Update other handlers to use client.data.user for authorization
}
```

**Requirements**:

- Validate JWT on every connection
- Disconnect if authentication fails
- Store user info in socket data for subsequent events
- Update CORS configuration to allow credentials
- Check permissions in event handlers

### Step 4.3: Update MessagesModule

**File**: `src/modules/messages/messages.module.ts`

**Action**: Import JwtModule for token verification

**Implementation**:

```typescript
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION as any },
    }),
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
  exports: [MessagesGateway],
})
export class MessagesModule {}
```

---

## Phase 5: Environment Configuration

**Goal**: Add cookie-specific environment variables

### Step 5.1: Update Environment Variables

**File**: `.env.example`

**Action**: Add cookie configuration options

**Add**:

```bash
# Cookie Configuration
COOKIE_DOMAIN=           # Optional: Set for cross-subdomain cookies (e.g., .example.com)
COOKIE_SECURE=true       # Set to false in development if not using HTTPS
NODE_ENV=development     # production | development
```

**Documentation**:

- `COOKIE_DOMAIN`: Set only if you need cookies to work across subdomains
- `COOKIE_SECURE`: Automatically handled by NODE_ENV in code, but can override
- `NODE_ENV`: Controls secure flag and other environment-specific behavior

### Step 5.2: Update Documentation

**File**: `README.md`

**Action**: Document cookie-based authentication

**Add Section**:

````markdown
## Authentication

Kord API uses cookie-based JWT authentication for enhanced security.

### How It Works

1. Login/Register returns cookies (`kord_access_token`, `kord_refresh_token`)
2. Cookies are automatically sent with subsequent requests
3. Access token expires in 15 minutes
4. Refresh token expires in 7 days
5. Use `/auth/refresh` to get new tokens
6. Use `/auth/logout` to clear cookies and invalidate session

### Client Configuration

Ensure your HTTP client sends cookies:

```javascript
// Fetch API
fetch('http://localhost:3001/api/v1/auth/login', {
  method: 'POST',
  credentials: 'include', // Important!
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ usernameOrEmail, password }),
});

// Axios
axios.post('/auth/login', data, {
  withCredentials: true, // Important!
});
```
````

### WebSocket Authentication

Socket.IO connections are automatically authenticated via cookies:

```javascript
const socket = io('http://localhost:3001', {
  withCredentials: true, // Important!
});
```

````

---

## Phase 6: Testing Updates

**Goal**: Update all tests to work with cookie-based authentication

### Step 6.1: Update Bruno Tests

**Files**: `bruno/auth/*.bru`

**Action**: Modify tests to handle cookies instead of bearer tokens

#### Example: login-with-email.bru

**Before**:
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
````

**After**:

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
  // Cookies are automatically handled by Bruno
  // No need to extract tokens manually
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

#### Example: me.bru

**Before**:

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

**After**:

```bruno
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
}
```

#### Create: logout.bru (new test)

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

tests {
  test("Status should be 200 for successful logout", function () {
    expect(res.getStatus()).to.equal(200);
  });

  test("Response should include success message", function () {
    expect(res.getBody()).to.have.property("message");
    expect(res.getBody().message).to.equal("Logout successful");
  });

  test("Response should clear cookies", function () {
    const cookies = res.getHeaders()['set-cookie'];
    expect(cookies).to.be.an('array');

    const clearsAccessToken = cookies.some(c =>
      c.includes('kord_access_token') && c.includes('Max-Age=0')
    );
    const clearsRefreshToken = cookies.some(c =>
      c.includes('kord_refresh_token') && c.includes('Max-Age=0')
    );

    expect(clearsAccessToken).to.be.true;
    expect(clearsRefreshToken).to.be.true;
  });
}
```

**Files to Update**:

- `bruno/auth/login-with-email.bru`
- `bruno/auth/login-with-username.bru`
- `bruno/auth/register.bru`
- `bruno/auth/refresh-token.bru`
- `bruno/auth/me.bru`
- `bruno/auth/me-without-token.bru`
- `bruno/auth/me-invalid-token.bru`

### Step 6.2: Update E2E Tests

**File**: `test/auth.e2e-spec.ts`

**Action**: Use Supertest with cookie handling

**Implementation**:

```typescript
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let cookies: string[];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/auth/register (POST)', () => {
    it('should register user and set cookies', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123!',
          name: 'Test User',
          dateOfBirth: '1990-01-01',
        })
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.headers['set-cookie']).toBeDefined();

      const cookieStrings = response.headers['set-cookie'];
      expect(cookieStrings.some((c) => c.includes('kord_access_token'))).toBe(
        true,
      );
      expect(cookieStrings.some((c) => c.includes('kord_refresh_token'))).toBe(
        true,
      );

      // Store cookies for subsequent requests
      cookies = cookieStrings;
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login and set cookies', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          usernameOrEmail: 'test@example.com',
          password: 'Password123!',
        })
        .expect(200);

      cookies = response.headers['set-cookie'];
    });
  });

  describe('/auth/me (GET)', () => {
    it('should return user info with valid cookie', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', cookies)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('username');
        });
    });

    it('should return 401 without cookie', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout and clear cookies', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', cookies)
        .expect(200);

      const cookieStrings = response.headers['set-cookie'];
      expect(cookieStrings.some((c) => c.includes('Max-Age=0'))).toBe(true);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
```

**Requirements**:

- Store cookies from login/register responses
- Pass cookies using `.set('Cookie', cookies)` in subsequent requests
- Test cookie clearing on logout
- Verify unauthorized access without cookies

### Step 6.3: Update Other E2E Tests

**Files**:

- `test/user-journey.e2e-spec.ts`
- `test/simplified-journey.e2e-spec.ts`

**Action**: Update to use cookie-based authentication

**Pattern**:

```typescript
// At the start of test suite
let authCookies: string[];

beforeAll(async () => {
  // Login to get cookies
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ usernameOrEmail: 'test@example.com', password: 'password' });

  authCookies = response.headers['set-cookie'];
});

// In each test
it('should do something', async () => {
  await request(app.getHttpServer())
    .post('/api/v1/some-endpoint')
    .set('Cookie', authCookies)
    .send(data)
    .expect(201);
});
```

---

## Phase 7: Integration & Verification

**Goal**: Ensure all components work together correctly

### Step 7.1: Manual Testing Checklist

- [ ] Register new user - verify cookies are set
- [ ] Login - verify cookies are set
- [ ] Access protected endpoint - verify cookie authentication works
- [ ] Refresh token - verify new cookies are set
- [ ] Logout - verify cookies are cleared
- [ ] Try accessing protected endpoint after logout - verify 401 response
- [ ] WebSocket connection - verify authentication works
- [ ] Test in both development and production modes
- [ ] Verify cookie security flags (httpOnly, secure, sameSite)

### Step 7.2: Automated Test Execution

```bash
# Run all tests
npm run test

# Run E2E tests
npm run test:e2e

# Run Bruno tests
npx @usebruno/cli run bruno --env local
```

### Step 7.3: Build Verification

```bash
# Ensure no TypeScript errors
npm run build

# Run linter
npm run lint

# Format code
npm run format
```

### Step 7.4: Protected Endpoints Verification

Test all JwtAuthGuard-protected endpoints:

**Users Module**:

- GET `/users` - List users
- GET `/users/:id` - Get user by ID
- PATCH `/users/:id` - Update user
- DELETE `/users/:id` - Delete user

**Servers Module**:

- POST `/servers` - Create server
- GET `/servers/:id` - Get server
- PATCH `/servers/:id` - Update server
- DELETE `/servers/:id` - Delete server

**Channels Module**:

- POST `/channels` - Create channel
- PATCH `/channels/:id` - Update channel
- DELETE `/channels/:id` - Delete channel

**Messages Module**:

- POST `/messages` - Create message
- PATCH `/messages/:id` - Update message
- DELETE `/messages/:id` - Delete message

**Profiles Module**:

- GET `/profiles/:id` - Get profile
- PATCH `/profiles/:id` - Update profile

**Reactions Module**:

- POST `/reactions` - Add reaction
- DELETE `/reactions/:id` - Remove reaction

**Roles Module**:

- POST `/roles` - Create role
- PATCH `/roles/:id` - Update role
- DELETE `/roles/:id` - Delete role

---

## Migration Strategy

### For Development (Recommended)

**Clean Cutover Approach**:

1. Implement all phases in sequence
2. Update all clients simultaneously
3. No backward compatibility needed
4. Simpler code without dual-path logic

### For Production (If Needed)

**Gradual Migration Approach**:

1. **Week 1-2**: Deploy with dual support (cookie + header)
   - Modify JwtStrategy to check both cookie and header
   - Keep returning tokens in response body
   - Set cookies in addition to body tokens
2. **Week 3**: Update all client applications
   - Switch to cookie-based authentication
   - Monitor for issues
3. **Week 4**: Remove header-based authentication
   - Remove header extraction from JwtStrategy
   - Stop returning tokens in response body
   - Update tests

**Dual Support Implementation** (if needed):

```typescript
// cookie-extractor.ts with fallback
export const cookieExtractorWithFallback = (req: Request): string | null => {
  // Try cookie first
  if (req && req.cookies && req.cookies[COOKIE_NAMES.ACCESS_TOKEN]) {
    return req.cookies[COOKIE_NAMES.ACCESS_TOKEN];
  }

  // Fallback to Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
};
```

---

## Security Considerations

### CSRF Protection

**Current Implementation**: SameSite=Strict provides protection

**Additional Protection** (optional):

- Implement CSRF token for state-changing operations
- Use double-submit cookie pattern
- Validate custom headers for additional security

### Session Management

**Refresh Token Rotation**:

- Current: Generate new refresh token on refresh
- Consider: Invalidate old token family on suspicious activity

**Token Cleanup**:

- Implement periodic cleanup of expired refresh tokens
- Consider adding logout endpoint to invalidate all user sessions

### Cookie Security

**Development vs Production**:

- Development: `secure: false` (HTTP allowed)
- Production: `secure: true` (HTTPS only)

**Domain Configuration**:

- Single domain: No domain attribute needed
- Subdomains: Set `domain: .example.com`
- Cross-domain: Not possible (consider different approach)

### WebSocket Security

**Connection Validation**:

- Validate JWT on every connection
- Disconnect invalid connections immediately
- Store user context in socket data

**Event Authorization**:

- Check permissions for each event
- Verify channel membership before broadcasting
- Rate limit events to prevent abuse

---

## Rollback Plan

### If Issues Arise

**Phase 1-2 Rollback**:

- Revert git commits
- Restore previous JWT strategy
- No database changes needed

**Phase 3+ Rollback**:

- Revert controller changes
- Restore token responses
- Update tests back to header auth
- Communicate to users about token storage

**Emergency Hotfix**:
If production issues occur:

1. Enable dual support (cookie + header)
2. Allow both authentication methods temporarily
3. Investigate and fix issues
4. Remove temporary fallback when stable

---

## Success Criteria

- [ ] All authentication flows work with cookies
- [ ] No tokens in response bodies (except during migration)
- [ ] WebSocket connections properly authenticated
- [ ] All tests passing (unit + E2E + Bruno)
- [ ] No security vulnerabilities introduced
- [ ] Documentation updated
- [ ] Client applications successfully integrated
- [ ] Performance maintained or improved
- [ ] No breaking changes for end users

---

## Timeline Estimate

**Total**: 2-3 days for full implementation

- **Phase 1**: 2-3 hours (setup and configuration)
- **Phase 2**: 1-2 hours (strategy update)
- **Phase 3**: 3-4 hours (controller/service updates)
- **Phase 4**: 2-3 hours (WebSocket authentication)
- **Phase 5**: 1 hour (environment config)
- **Phase 6**: 4-6 hours (test updates)
- **Phase 7**: 2-3 hours (integration testing)

---

## References

### Documentation

- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [Passport.js JWT Strategy](http://www.passportjs.org/packages/passport-jwt/)
- [MDN: Using HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [OWASP: Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

### Related Files

- `docs/plan/implementation-plan.md` - Original implementation plan
- `docs/diagrams/kord-api-components.plantuml` - Component diagram
- `docs/diagrams/kord-api-flows.plantuml` - Flow diagram
- `.github/instructions/nestjs.instructions.md` - NestJS best practices

---

## Notes

- Maintain backward compatibility during migration if needed
- Test thoroughly in both development and production environments
- Monitor for session-related issues after deployment
- Consider implementing refresh token rotation for enhanced security
- Document any deviations from this plan in the implementation
