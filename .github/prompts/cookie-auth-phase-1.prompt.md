---
description: 'Implement Cookie-Based Auth Phase 1 – Core Infrastructure Setup for Kord API'
# prettier-ignore
tools: ['edit/createFile', 'edit/createDirectory', 'edit/editFiles', 'search', 'runCommands', 'runTasks', 'context7/*', 'upstash/context7/*', 'usages', 'problems', 'changes', 'testFailure', 'fetch', 'githubRepo', 'extensions', 'todos']
---

## Task: Implement Cookie-Based Auth Phase 1 – Core Infrastructure Setup

Migrate Kord API from header-based JWT authentication to cookie-based authentication. This phase focuses on installing dependencies and setting up the basic cookie handling infrastructure.

### Context

**Current State**:

- JWT tokens sent via `Authorization: Bearer <token>` header
- Tokens stored in localStorage/sessionStorage (XSS vulnerable)
- `JwtStrategy` extracts from header using `ExtractJwt.fromAuthHeaderAsBearerToken()`

**Target State**:

- JWT tokens sent via HttpOnly cookies
- Automatic cookie attachment to requests
- Enhanced security with HttpOnly, Secure, SameSite attributes

### Phase 1 Objectives

1. Install cookie-parser dependency
2. Configure cookie-parser middleware in main.ts
3. Create centralized cookie configuration constants
4. Create cookie extraction utility for passport-jwt

### Step-by-Step Instructions

#### Step 1.1: Install Dependencies

**Action**: Install cookie-parser and its TypeScript types

```bash
npm install cookie-parser
npm install -D @types/cookie-parser
```

**Verification**: Check package.json for new dependencies

#### Step 1.2: Configure Cookie Parser Middleware

**File**: `src/main.ts`

**Action**: Import and enable cookie-parser in bootstrap function

**Add import**:

```typescript
import * as cookieParser from 'cookie-parser';
```

**Add middleware** (after creating app, before other configuration):

```typescript
app.use(cookieParser());
```

**Note**: Cookie parser must be configured BEFORE routes are registered. The existing CORS configuration already has `credentials: true`, which is required for cookies.

#### Step 1.3: Create Cookie Configuration Constants

**File**: `src/common/constants/cookie-config.ts` (NEW FILE)

**Action**: Create centralized cookie configuration

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
  path: '/api/v1/auth/refresh', // Restrict to refresh endpoint only
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

**Key Features**:

- Environment-aware secure flag (production only)
- Separate configurations for access and refresh tokens
- Path restriction for refresh token (security best practice)
- Clear cookie options for logout

#### Step 1.4: Create Cookie Extraction Utility

**File**: `src/modules/auth/utils/cookie-extractor.ts` (NEW FILE)

**Action**: Create utility function compatible with passport-jwt

**Implementation**:

```typescript
import { Request } from 'express';
import { COOKIE_NAMES } from '@/common/constants/cookie-config';

/**
 * Extracts JWT access token from cookies for Passport JWT strategy.
 * Compatible with passport-jwt's custom extractor interface.
 *
 * @param req - Express request object
 * @returns JWT token string or null if not found
 */
export const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies[COOKIE_NAMES.ACCESS_TOKEN] || null;
  }
  return null;
};
```

**Requirements**:

- Compatible with passport-jwt ExtractJwt custom extractor
- Returns null if cookie not found (required by passport-jwt)
- Type-safe with Express Request type
- Uses centralized cookie name constant

### Testing Phase 1

After completing all steps:

1. **Build verification**:

```bash
npm run build
```

2. **Lint check**:

```bash
npm run lint
```

3. **Format code**:

```bash
npm run format
```

4. **Verify imports**: Ensure no circular dependencies introduced

### Expected Outcomes

- [x] cookie-parser installed and types available
- [x] Cookie parser middleware configured in main.ts
- [x] Cookie configuration constants created
- [x] Cookie extractor utility created
- [x] No build errors
- [x] Code passes linting
- [x] All files properly formatted

### Files Modified/Created

**Modified**:

- `package.json` - Added cookie-parser dependencies
- `src/main.ts` - Added cookie-parser middleware

**Created**:

- `src/common/constants/cookie-config.ts` - Cookie configuration
- `src/modules/auth/utils/cookie-extractor.ts` - Cookie extraction utility

### Next Steps

After completing Phase 1, proceed to **Phase 2: JWT Strategy Update** to modify the authentication strategy to use cookie extraction instead of header extraction.

### Notes

- Ensure NODE_ENV is set correctly in your environment
- COOKIE_DOMAIN should only be set if you need cross-subdomain cookies
- The secure flag will be false in development (HTTP allowed)
- SameSite=Strict provides CSRF protection

### References

- [cookie-parser documentation](https://github.com/expressjs/cookie-parser)
- [NestJS Cookies](https://docs.nestjs.com/techniques/cookies)
- [MDN: Using HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- Main implementation plan: `docs/plan/cookie-auth-implementation.md`
