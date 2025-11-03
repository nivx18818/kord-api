---
description: 'Implement Cookie-Based Auth Phase 3 – Controller & Service Updates for Kord API'
# prettier-ignore
tools: ['edit/createFile', 'edit/createDirectory', 'edit/editFiles', 'search', 'runCommands', 'runTasks', 'context7/*', 'upstash/context7/*', 'usages', 'problems', 'changes', 'testFailure', 'fetch', 'githubRepo', 'prisma.prisma/prisma-migrate-status', 'prisma.prisma/prisma-studio', 'extensions', 'todos']
---

## Task: Implement Cookie-Based Auth Phase 3 – Controller & Service Updates

Update auth controller and service to set/clear cookies instead of returning tokens in response body.

### Context

**Prerequisites**: Phases 1 & 2 completed (cookie infrastructure ready, JWT strategy updated)

**Current State**:

- Auth endpoints return tokens in JSON response: `{ accessToken, refreshToken }`
- Clients must manually store and attach tokens to requests
- No logout endpoint to invalidate sessions

**Target State**:

- Auth endpoints set HttpOnly cookies in response
- Return simple success messages: `{ message: "Login successful" }`
- Logout endpoint clears cookies and invalidates refresh token in database
- Cookies automatically sent with subsequent requests

### Phase 3 Objectives

1. Update AuthController to set cookies in responses
2. Add logout endpoint with cookie clearing
3. Update AuthService to handle logout logic
4. Optionally update AuthResponseDto

### Step-by-Step Instructions

#### Step 3.1: Update AuthController - Add Imports

**File**: `src/modules/auth/auth.controller.ts`

**Action**: Add necessary imports at the top of the file

**Add these imports**:

```typescript
import { Request, Response } from 'express';
import { Req, Res } from '@nestjs/common';
import {
  COOKIE_NAMES,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getClearCookieOptions,
} from '@/common/constants/cookie-config';
```

**Explanation**:

- `Request, Response` - Express types for request/response objects
- `@Req(), @Res()` - NestJS decorators to inject request/response
- Cookie configuration imports for setting/clearing cookies

#### Step 3.2: Update Login Endpoint

**File**: `src/modules/auth/auth.controller.ts`

**Current**:

```typescript
@Post('login')
@HttpCode(HttpStatus.OK)
async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
  return this.authService.login(loginDto);
}
```

**Updated**:

```typescript
@Post('login')
@HttpCode(HttpStatus.OK)
async login(
  @Body() loginDto: LoginDto,
  @Res({ passthrough: true }) response: Response,
): Promise<{ message: string }> {
  const { accessToken, refreshToken } = await this.authService.login(loginDto);

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
```

**Key Changes**:

- Added `@Res({ passthrough: true })` parameter to get response object
- Extract tokens from service result
- Set both cookies using `response.cookie()`
- Return simple message instead of tokens

**Important**: Use `{ passthrough: true }` to let NestJS handle the response automatically while still allowing cookie manipulation.

#### Step 3.3: Update Register Endpoint

**File**: `src/modules/auth/auth.controller.ts`

**Current**:

```typescript
@Post('register')
@HttpCode(HttpStatus.CREATED)
async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
  return this.authService.register(registerDto);
}
```

**Updated**:

```typescript
@Post('register')
@HttpCode(HttpStatus.CREATED)
async register(
  @Body() registerDto: RegisterDto,
  @Res({ passthrough: true }) response: Response,
): Promise<{ message: string }> {
  const { accessToken, refreshToken } = await this.authService.register(registerDto);

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

  return { message: 'Registration successful' };
}
```

**Pattern**: Same as login - extract tokens, set cookies, return message

#### Step 3.4: Update Refresh Endpoint

**File**: `src/modules/auth/auth.controller.ts`

**Current**:

```typescript
@Post('refresh')
@HttpCode(HttpStatus.OK)
async refresh(
  @Body() refreshTokenDto: RefreshTokenDto,
): Promise<AuthResponseDto> {
  return this.authService.refresh(refreshTokenDto.refreshToken);
}
```

**Updated**:

```typescript
@Post('refresh')
@HttpCode(HttpStatus.OK)
async refresh(
  @Req() request: Request,
  @Res({ passthrough: true }) response: Response,
): Promise<{ message: string }> {
  // Extract refresh token from cookie
  const refreshToken = request.cookies[COOKIE_NAMES.REFRESH_TOKEN];

  if (!refreshToken) {
    throw new RefreshTokenInvalidException();
  }

  const { accessToken, refreshToken: newRefreshToken } =
    await this.authService.refresh(refreshToken);

  // Set new cookies
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
```

**Key Changes**:

- Added `@Req()` to access request cookies
- Extract refresh token from cookie instead of body
- Throw exception if refresh token cookie missing
- Set both new cookies in response

**Note**: The body DTO (`RefreshTokenDto`) is no longer needed but can be removed in cleanup phase.

#### Step 3.5: Add Logout Endpoint (NEW)

**File**: `src/modules/auth/auth.controller.ts`

**Action**: Add new logout endpoint after other auth endpoints

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

  // Invalidate refresh token in database if present
  if (refreshToken) {
    await this.authService.logout(user.id, refreshToken);
  }

  // Clear cookies
  response.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, getClearCookieOptions());
  response.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
    ...getClearCookieOptions(),
    path: '/api/v1/auth/refresh', // Must match original path
  });

  return { message: 'Logout successful' };
}
```

**Key Features**:

- Requires authentication (`@UseGuards(JwtAuthGuard)`)
- Invalidates refresh token in database
- Clears both cookies (access and refresh)
- Uses correct path for refresh token cookie
- Returns success message

**Important**: When clearing cookies, the path must match the original path used when setting the cookie.

#### Step 3.6: Update AuthService - Add Logout Method

**File**: `src/modules/auth/auth.service.ts`

**Action**: Add logout method to handle database cleanup

**Implementation**:
Add this method to the `AuthService` class:

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
    // Log error but don't throw - logout should succeed even if cleanup fails
    console.error('Error during logout token cleanup:', error);
  }
}
```

**Design Decisions**:

- Uses `deleteMany` instead of `delete` (handles edge cases)
- Doesn't throw errors (logout should always succeed)
- Logs errors for debugging
- Considers adding expired token cleanup here

**Optional Enhancement**:
You can also add cleanup for expired tokens:

```typescript
async logout(userId: number, refreshToken: string): Promise<void> {
  try {
    // Delete the specific refresh token
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });

    // Optional: Clean up expired tokens for this user
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error('Error during logout token cleanup:', error);
  }
}
```

#### Step 3.7: Update AuthResponseDto (Optional)

**File**: `src/modules/auth/dto/auth-response.dto.ts`

**Option 1 - Remove DTO** (Recommended):
Since endpoints now return `{ message: string }`, you can remove this DTO entirely and use inline types.

**Option 2 - Make Fields Optional** (For backward compatibility):

```typescript
export class AuthResponseDto {
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}
```

**Recommendation**: Remove the DTO. It's no longer needed since we're not returning tokens in the response body.

### Testing Phase 3

After completing all updates:

#### 1. Build Verification

```bash
npm run build
```

#### 2. Start Application

```bash
npm run start:dev
```

#### 3. Manual API Testing with Bruno or cURL

**Test Registration**:

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Password123!",
    "name": "Test User",
    "dateOfBirth": "1990-01-01"
  }' \
  -c cookies.txt -v
```

Expected:

- Status: 201 Created
- Response: `{ "message": "Registration successful" }`
- Set-Cookie headers with `kord_access_token` and `kord_refresh_token`

**Test Login**:

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "test@example.com",
    "password": "Password123!"
  }' \
  -c cookies.txt -v
```

Expected:

- Status: 200 OK
- Response: `{ "message": "Login successful" }`
- Set-Cookie headers present

**Test Protected Endpoint (/auth/me)**:

```bash
curl -X GET http://localhost:3001/api/v1/auth/me \
  -b cookies.txt -v
```

Expected:

- Status: 200 OK
- Response: `{ "id": 1, "email": "test@example.com", "username": "testuser" }`

**Test Refresh**:

```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -b cookies.txt \
  -c cookies.txt -v
```

Expected:

- Status: 200 OK
- Response: `{ "message": "Token refreshed" }`
- New Set-Cookie headers

**Test Logout**:

```bash
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -b cookies.txt -v
```

Expected:

- Status: 200 OK
- Response: `{ "message": "Logout successful" }`
- Set-Cookie headers with Max-Age=0 (clearing cookies)

**Test After Logout (Should Fail)**:

```bash
curl -X GET http://localhost:3001/api/v1/auth/me \
  -b cookies.txt -v
```

Expected:

- Status: 401 Unauthorized

### Expected Outcomes

- [x] Login endpoint sets cookies and returns message
- [x] Register endpoint sets cookies and returns message
- [x] Refresh endpoint reads from cookie and sets new cookies
- [x] Logout endpoint clears cookies and invalidates token
- [x] /auth/me works with cookie authentication
- [x] No tokens in response bodies
- [x] Build succeeds without errors
- [x] Application starts successfully

### Files Modified

**Modified**:

- `src/modules/auth/auth.controller.ts` - Updated all endpoints, added logout
- `src/modules/auth/auth.service.ts` - Added logout method

**Optional Cleanup**:

- `src/modules/auth/dto/auth-response.dto.ts` - Can be removed
- `src/modules/auth/dto/refresh-token.dto.ts` - Can be removed (no longer used)

### Common Issues & Solutions

**Issue**: Cookies not being set
**Solution**: Verify CORS is configured with `credentials: true` in main.ts

**Issue**: Refresh token not found in cookie
**Solution**: Check that cookie path matches exactly (`/api/v1/auth/refresh`)

**Issue**: Logout doesn't clear cookies
**Solution**: Ensure `clearCookie` uses same path as original `cookie()` call

**Issue**: Protected endpoints return 401
**Solution**: Verify Phase 2 was completed (JwtStrategy updated)

### Security Checklist

- [x] Cookies have HttpOnly flag (prevents JavaScript access)
- [x] Cookies have Secure flag in production (HTTPS only)
- [x] Cookies have SameSite=Strict (CSRF protection)
- [x] Refresh token has path restriction
- [x] Logout invalidates refresh token in database
- [x] Proper error handling for missing cookies

### Next Steps

After completing Phase 3, proceed to **Phase 4: WebSocket Authentication** to secure Socket.IO connections with cookie-based authentication.

### References

- Main implementation plan: `docs/plan/cookie-auth-implementation.md`
- Previous phases: `.github/prompts/cookie-auth-phase-1.prompt.md`, `.github/prompts/cookie-auth-phase-2.prompt.md`
- NestJS Response handling: https://docs.nestjs.com/controllers#request-object
