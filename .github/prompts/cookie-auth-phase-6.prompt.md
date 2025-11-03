---
description: 'Implement Cookie-Based Auth Phase 6 – Final Integration & Verification for Kord API'
# prettier-ignore
tools: ['edit/createFile', 'edit/createDirectory', 'edit/editFiles', 'search', 'runCommands', 'runTasks', 'context7/*', 'upstash/context7/*', 'usages', 'problems', 'changes', 'testFailure', 'fetch', 'githubRepo', 'extensions', 'todos']
---

## Task: Implement Cookie-Based Auth Phase 6 – Final Integration & Verification

Complete the cookie-based authentication implementation with final configuration, comprehensive testing, documentation, and cleanup.

### Context

**Prerequisites**: Phases 1-5 completed (infrastructure, strategy, controllers, WebSocket, tests)

**Target State**:

- All configuration properly documented
- All protected endpoints verified working
- CORS configuration validated
- Documentation updated
- Unused code removed
- Production-ready implementation

### Phase 6 Objectives

1. Update environment configuration and documentation
2. Verify all protected endpoints work with cookies
3. Validate CORS configuration
4. Update project documentation
5. Clean up unused code and DTOs
6. Final build and test verification

### Step-by-Step Instructions

#### Step 6.1: Update Environment Configuration

**File**: `.env.example`

**Current**:

```bash
# Security
JWT_ACCESS_SECRET=jwt_access_secret
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=jwt_refresh_secret
JWT_REFRESH_EXPIRATION=7d
```

**Updated**:

```bash
# Security - JWT Configuration
JWT_ACCESS_SECRET=jwt_access_secret
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=jwt_refresh_secret
JWT_REFRESH_EXPIRATION=7d

# Cookie Configuration
# Set COOKIE_DOMAIN only if you need cookies to work across subdomains
# Example: .example.com (note the leading dot)
COOKIE_DOMAIN=

# Node Environment - affects cookie secure flag
# production = secure cookies (HTTPS only)
# development = non-secure cookies (HTTP allowed)
NODE_ENV=development
```

**Add comments explaining**:

- When to set COOKIE_DOMAIN
- How NODE_ENV affects cookie security
- Cookie security in production vs development

#### Step 6.2: Update README.md - Authentication Section

**File**: `README.md`

**Add/Update Authentication Section**:

```markdown
## Authentication

Kord API uses **cookie-based JWT authentication** for enhanced security. This approach protects against XSS attacks by using HttpOnly cookies and simplifies client-side code through automatic cookie management.

### How It Works

1. **Register/Login**: POST to `/auth/register` or `/auth/login` to receive authentication cookies
2. **Automatic Authentication**: Cookies are automatically sent with all subsequent requests
3. **Token Refresh**: POST to `/auth/refresh` to get new tokens (uses refresh token cookie)
4. **Logout**: POST to `/auth/logout` to clear cookies and invalidate session

### Authentication Flow
```

Client Server
| |
| POST /auth/register |
| (email, username, password) |
|------------------------------>|
| |
| Set-Cookie: kord_access_token|
| Set-Cookie: kord_refresh_token
|<------------------------------|
| |
| GET /auth/me |
| Cookie: kord_access_token |
|------------------------------>|
| |
| { id, email, username } |
|<------------------------------|
| |
| POST /auth/logout |
| Cookie: kord_access_token |
|------------------------------>|
| |
| Clear-Cookie (both tokens) |
|<------------------------------|

````

### Security Features

- **HttpOnly Cookies**: Prevents JavaScript access, mitigating XSS attacks
- **Secure Flag**: Cookies only sent over HTTPS in production
- **SameSite=Strict**: Protects against CSRF attacks
- **Path Restriction**: Refresh token limited to `/api/v1/auth/refresh` endpoint
- **Token Expiration**: Access tokens expire in 15 minutes, refresh tokens in 7 days

### Client Configuration

Your HTTP client must be configured to send credentials (cookies):

#### JavaScript Fetch API
```javascript
fetch('http://localhost:3001/api/v1/auth/login', {
  method: 'POST',
  credentials: 'include', // Required for cookies
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    usernameOrEmail: 'user@example.com',
    password: 'password123'
  })
});
````

#### Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  withCredentials: true, // Required for cookies
});

await api.post('/auth/login', {
  usernameOrEmail: 'user@example.com',
  password: 'password123',
});
```

#### Socket.IO (WebSocket)

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  withCredentials: true, // Required for cookies
});

socket.on('connect', () => {
  console.log('Connected with authentication');
  socket.emit('join-channel', { channelId: 1 });
});
```

### Environment Configuration

Set the following environment variables:

```bash
# Required
JWT_ACCESS_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
CLIENT_URL=http://localhost:3000

# Optional
COOKIE_DOMAIN=           # Only set for cross-subdomain support
NODE_ENV=development     # Controls cookie secure flag
```

### API Endpoints

#### Authentication Endpoints

| Method | Endpoint            | Description              | Auth Required       | Response                      |
| ------ | ------------------- | ------------------------ | ------------------- | ----------------------------- |
| POST   | `/auth/register`    | Create new account       | No                  | Sets cookies, returns message |
| POST   | `/auth/login`       | Login with credentials   | No                  | Sets cookies, returns message |
| POST   | `/auth/refresh`     | Refresh access token     | Yes (refresh token) | Sets new cookies              |
| POST   | `/auth/logout`      | Logout and clear session | Yes                 | Clears cookies                |
| GET    | `/auth/me`          | Get current user info    | Yes                 | Returns user object           |
| GET    | `/auth/check-email` | Check email availability | No                  | Returns availability status   |

#### Example: Registration

**Request**:

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "Password123!",
  "name": "Full Name",
  "dateOfBirth": "1990-01-01"
}
```

**Response**:

```bash
HTTP/1.1 201 Created
Set-Cookie: kord_access_token=eyJhbGc...; HttpOnly; SameSite=Strict; Path=/
Set-Cookie: kord_refresh_token=eyJhbGc...; HttpOnly; SameSite=Strict; Path=/api/v1/auth/refresh
Content-Type: application/json

{
  "message": "Registration successful"
}
```

### Troubleshooting

#### Cookies Not Being Set

**Problem**: Login succeeds but cookies aren't set in browser.

**Solutions**:

- Ensure `credentials: 'include'` (Fetch) or `withCredentials: true` (Axios) is set
- Check that `CLIENT_URL` in `.env` matches your frontend origin
- Verify CORS is properly configured (see below)
- Check browser developer tools > Application > Cookies

#### 401 Unauthorized on Protected Endpoints

**Problem**: Authenticated requests return 401.

**Solutions**:

- Verify cookies are being sent (check Network tab > Headers > Cookie)
- Ensure access token hasn't expired (15-minute lifetime)
- Use `/auth/refresh` to get new tokens
- Check that cookie domain matches current domain

#### CORS Errors

**Problem**: Browser blocks requests with CORS errors.

**Solutions**:

- Set `CLIENT_URL` in `.env` to match frontend origin exactly
- Ensure frontend sends `credentials: 'include'` or `withCredentials: true`
- Don't use wildcard (`*`) for origin when credentials are enabled
- Check that server CORS includes `credentials: true`

#### WebSocket Authentication Fails

**Problem**: Socket.IO connection is rejected.

**Solutions**:

- Ensure `withCredentials: true` in Socket.IO client configuration
- Verify cookies are valid and not expired
- Check server logs for authentication errors
- Ensure WebSocket gateway CORS is configured with credentials

### Testing

Run the test suite to verify authentication:

```bash
# All tests
npm run test

# E2E tests only
npm run test:e2e

# Bruno API tests
npx @usebruno/cli run bruno --env local
```

### Migration from Header-Based Auth

If you're migrating from the old header-based authentication:

1. **Update client code** to remove manual token storage and Authorization headers
2. **Enable credentials** in HTTP client configuration
3. **Remove token handling** - cookies are managed automatically
4. **Update WebSocket** client to use `withCredentials: true`
5. **Test thoroughly** before deploying to production

See `docs/plan/cookie-auth-implementation.md` for detailed migration guide.

````

#### Step 6.3: Create Cookie Configuration Documentation

**File**: `docs/authentication.md` (NEW FILE)

**Implementation**: Create comprehensive authentication documentation

```markdown
# Authentication Guide

## Overview

Kord API uses cookie-based JWT (JSON Web Token) authentication for secure user authentication and authorization.

## Cookie Configuration

### Access Token Cookie

- **Name**: `kord_access_token`
- **Lifetime**: 15 minutes
- **Path**: `/` (all endpoints)
- **Attributes**: HttpOnly, Secure (production), SameSite=Strict

### Refresh Token Cookie

- **Name**: `kord_refresh_token`
- **Lifetime**: 7 days
- **Path**: `/api/v1/auth/refresh` (restricted)
- **Attributes**: HttpOnly, Secure (production), SameSite=Strict

## Token Payload

Both access and refresh tokens contain:

```json
{
  "sub": 123,        // User ID
  "email": "user@example.com",
  "username": "username",
  "iat": 1234567890, // Issued at
  "exp": 1234567890  // Expiration
}
````

## Security Considerations

### HttpOnly Flag

- Prevents JavaScript access to cookies
- Protects against XSS (Cross-Site Scripting) attacks
- Cookies accessible only by HTTP(S) requests

### Secure Flag

- Enabled in production (NODE_ENV=production)
- Requires HTTPS connection
- Disabled in development for local testing

### SameSite=Strict

- Prevents CSRF (Cross-Site Request Forgery) attacks
- Cookies only sent to same-site requests
- Strongest CSRF protection available

### Path Restriction

- Refresh token limited to `/api/v1/auth/refresh`
- Minimizes exposure of long-lived token
- Follows principle of least privilege

## Implementation Details

### Setting Cookies

Cookies are set by the server in response to:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`

Example response header:

```
Set-Cookie: kord_access_token=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900
```

### Clearing Cookies

Cookies are cleared by the server in response to:

- `POST /auth/logout`

Example response header:

```
Set-Cookie: kord_access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0
```

### Extracting Cookies

Server-side extraction handled by:

- `cookie-parser` middleware (HTTP requests)
- Custom cookie extractor (JWT strategy)
- WebSocket cookie extractor (Socket.IO connections)

## Best Practices

### Client-Side

1. **Always send credentials**:

   ```javascript
   fetch(url, { credentials: 'include' });
   axios.create({ withCredentials: true });
   io(url, { withCredentials: true });
   ```

2. **Handle authentication errors**:
   - 401: Token expired or invalid
   - 403: Insufficient permissions

3. **Implement token refresh**:
   - Automatically refresh on 401 errors
   - Use refresh token before access token expires

### Server-Side

1. **Secure secrets**: Use strong, random JWT secrets
2. **Rotate refresh tokens**: Generate new refresh token on each refresh
3. **Cleanup expired tokens**: Regularly delete expired refresh tokens from database
4. **Log authentication events**: Monitor for suspicious activity

## Troubleshooting

See README.md "Troubleshooting" section for common issues and solutions.

````

#### Step 6.4: Verify All Protected Endpoints

**Action**: Test cookie authentication on all protected routes

**Create test script**: `scripts/test-protected-endpoints.sh`

```bash
#!/bin/bash

# Test script for verifying cookie-based authentication on all protected endpoints
# Usage: ./scripts/test-protected-endpoints.sh

BASE_URL="http://localhost:3001/api/v1"
COOKIE_FILE="./test-cookies.txt"

echo "=== Cookie-Based Authentication Test ==="
echo ""

# Clean up any existing cookies
rm -f $COOKIE_FILE

echo "1. Register new user..."
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-'$(date +%s)'@example.com",
    "username": "testuser'$(date +%s)'",
    "password": "Password123!",
    "name": "Test User",
    "dateOfBirth": "1990-01-01"
  }' \
  -c $COOKIE_FILE \
  -s | jq

echo ""
echo "2. Test /auth/me (should succeed with cookies)..."
curl -X GET "$BASE_URL/auth/me" \
  -b $COOKIE_FILE \
  -s | jq

echo ""
echo "3. Test GET /users (should succeed)..."
curl -X GET "$BASE_URL/users" \
  -b $COOKIE_FILE \
  -s | jq

echo ""
echo "4. Test GET /servers (should succeed)..."
curl -X GET "$BASE_URL/servers" \
  -b $COOKIE_FILE \
  -s | jq

echo ""
echo "5. Test GET /channels (should succeed)..."
curl -X GET "$BASE_URL/channels" \
  -b $COOKIE_FILE \
  -s | jq

echo ""
echo "6. Test GET /messages (should succeed)..."
curl -X GET "$BASE_URL/messages" \
  -b $COOKIE_FILE \
  -s | jq

echo ""
echo "7. Test POST /auth/logout..."
curl -X POST "$BASE_URL/auth/logout" \
  -b $COOKIE_FILE \
  -c $COOKIE_FILE \
  -s | jq

echo ""
echo "8. Test /auth/me after logout (should fail with 401)..."
curl -X GET "$BASE_URL/auth/me" \
  -b $COOKIE_FILE \
  -s | jq

echo ""
echo "=== Test Complete ==="

# Cleanup
rm -f $COOKIE_FILE
````

Make executable:

```bash
chmod +x scripts/test-protected-endpoints.sh
```

#### Step 6.5: Validate CORS Configuration

**File**: `src/main.ts`

**Verify CORS configuration** is correct:

```typescript
app.enableCors({
  credentials: true,
  origin: process.env.CLIENT_URL, // Must be specific, not wildcard
});
```

**Add comment**:

```typescript
// CORS Configuration for Cookie-Based Authentication
// credentials: true - Required to allow cookies in cross-origin requests
// origin: Must be specific URL, not wildcard (*) when credentials are enabled
app.enableCors({
  credentials: true,
  origin: process.env.CLIENT_URL,
});
```

#### Step 6.6: Clean Up Unused Code

**Action**: Remove obsolete DTOs and code

**File**: `src/modules/auth/dto/refresh-token.dto.ts`

**Action**: DELETE this file (no longer needed since refresh token comes from cookie)

**File**: `src/modules/auth/dto/auth-response.dto.ts`

**Action**: DELETE this file (endpoints return simple messages now)

**Update imports** in `auth.controller.ts`:

- Remove `AuthResponseDto` import
- Remove `RefreshTokenDto` import

**Verify no other files import these DTOs**:

```bash
grep -r "AuthResponseDto" src/
grep -r "RefreshTokenDto" src/
```

If found, update those files to use inline types or remove references.

#### Step 6.7: Update Implementation Plan Status

**File**: `docs/plan/implementation-plan.md`

**Action**: Add cookie authentication implementation to the checklist

**Add new section after Phase 3.5**:

```markdown
**Phase 4: Cookie-Based Authentication**

- [x] Install cookie-parser dependency and types
- [x] Configure cookie-parser middleware in main.ts
- [x] Create cookie configuration constants
- [x] Create cookie extractor utility for passport-jwt
- [x] Update JwtStrategy to extract JWT from cookies
- [x] Modify login endpoint to set cookies
- [x] Modify register endpoint to set cookies
- [x] Modify refresh endpoint to read/set cookies
- [x] Add logout endpoint to clear cookies
- [x] Update AuthService with logout logic
- [x] Update WebSocket gateway for cookie authentication
- [x] Update Bruno tests for cookie-based auth
- [x] Update E2E tests for cookie-based auth
- [x] Add environment variables for cookie configuration
- [x] Update documentation (README, authentication guide)
- [x] Verify all protected endpoints work with cookies
- [x] Clean up unused DTOs (AuthResponseDto, RefreshTokenDto)
```

### Final Verification Checklist

#### Build & Code Quality

- [ ] `npm run build` succeeds without errors
- [ ] `npm run lint` passes without issues
- [ ] `npm run format` completes successfully
- [ ] No TypeScript errors in IDE
- [ ] No unused imports or variables

#### Testing

- [ ] `npm run test` - All unit tests pass
- [ ] `npm run test:e2e` - All E2E tests pass
- [ ] `npx @usebruno/cli run bruno --env local` - All Bruno tests pass
- [ ] Manual test script `./scripts/test-protected-endpoints.sh` succeeds
- [ ] WebSocket authentication tested and working

#### Configuration

- [ ] `.env.example` updated with cookie configuration
- [ ] `NODE_ENV` properly affects cookie secure flag
- [ ] `CLIENT_URL` configured for CORS
- [ ] `COOKIE_DOMAIN` documented (optional setting)

#### Documentation

- [ ] README.md updated with authentication section
- [ ] `docs/authentication.md` created
- [ ] `docs/plan/cookie-auth-implementation.md` exists
- [ ] `docs/plan/implementation-plan.md` updated
- [ ] Code comments added where necessary

#### Functionality

- [ ] Register sets cookies correctly
- [ ] Login sets cookies correctly
- [ ] Refresh reads from cookie and sets new cookies
- [ ] Logout clears cookies and invalidates token
- [ ] Protected endpoints work with cookies
- [ ] WebSocket connections authenticated
- [ ] Unauthorized access returns 401
- [ ] Cookie attributes correct (HttpOnly, Secure, SameSite)

#### Security

- [ ] Cookies have HttpOnly flag
- [ ] Secure flag enabled in production
- [ ] SameSite=Strict set
- [ ] Refresh token path-restricted
- [ ] CORS credentials enabled
- [ ] CORS origin specific (not wildcard)
- [ ] JWT secrets secure and environment-specific

#### Cleanup

- [ ] `AuthResponseDto` removed
- [ ] `RefreshTokenDto` removed
- [ ] No unused imports
- [ ] No commented-out code
- [ ] Test cookies cleaned up

### Expected Outcomes

- [x] Cookie-based authentication fully implemented
- [x] All tests passing
- [x] Documentation complete and accurate
- [x] Code clean and production-ready
- [x] Security best practices followed
- [x] CORS properly configured
- [x] Environment variables documented

### Files Modified/Created in Phase 6

**Modified**:

- `.env.example` - Added cookie configuration
- `README.md` - Added authentication section
- `docs/plan/implementation-plan.md` - Updated checklist
- `src/main.ts` - Added CORS comments

**Created**:

- `docs/authentication.md` - Comprehensive auth guide
- `scripts/test-protected-endpoints.sh` - Testing script

**Deleted**:

- `src/modules/auth/dto/auth-response.dto.ts`
- `src/modules/auth/dto/refresh-token.dto.ts`

### Production Deployment Checklist

Before deploying to production:

- [ ] Set strong JWT secrets (not default values)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `CLIENT_URL` to production frontend URL
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Set `COOKIE_DOMAIN` if using subdomains
- [ ] Test in production-like environment
- [ ] Monitor logs for authentication issues
- [ ] Set up database cleanup job for expired tokens
- [ ] Document deployment process
- [ ] Create rollback plan

### Success Criteria

✅ **Implementation Complete When**:

1. All phases (1-6) completed successfully
2. All tests passing (unit, E2E, Bruno)
3. Documentation comprehensive and accurate
4. Code passes linting and formatting checks
5. Manual testing confirms all functionality works
6. Security best practices implemented
7. Production deployment checklist prepared

### References

- Main implementation plan: `docs/plan/cookie-auth-implementation.md`
- All phase prompts: `.github/prompts/cookie-auth-phase-*.prompt.md`
- Authentication guide: `docs/authentication.md`
- NestJS Cookies: https://docs.nestjs.com/techniques/cookies
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
