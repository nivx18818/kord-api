---
description: 'Implement Cookie-Based Auth Phase 2 – JWT Strategy Update for Kord API'
# prettier-ignore
tools: ['edit/createFile', 'edit/createDirectory', 'edit/editFiles', 'search', 'runCommands', 'runTasks', 'context7/*', 'upstash/context7/*', 'usages', 'problems', 'changes', 'testFailure', 'fetch', 'githubRepo', 'extensions', 'todos']
---

## Task: Implement Cookie-Based Auth Phase 2 – JWT Strategy Update

Update the JWT authentication strategy to extract tokens from cookies instead of the Authorization header.

### Context

**Prerequisites**: Phase 1 must be completed (cookie-parser installed, cookie utilities created)

**Current State**:

- `JwtStrategy` extracts JWT from Authorization header
- Uses `ExtractJwt.fromAuthHeaderAsBearerToken()`
- All protected routes use `JwtAuthGuard` which relies on this strategy

**Target State**:

- `JwtStrategy` extracts JWT from cookies
- Uses custom `cookieExtractor` function
- No changes to guards or protected routes needed

### Phase 2 Objectives

1. Update JwtStrategy to use cookie extraction
2. Verify JwtAuthGuard continues to work
3. Ensure no breaking changes to existing protected endpoints

### Step-by-Step Instructions

#### Step 2.1: Update JwtStrategy

**File**: `src/modules/auth/strategies/jwt.strategy.ts`

**Current Implementation**:

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  email: string;
  sub: number;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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

**Action**: Replace header extraction with cookie extraction

**Changes Required**:

1. Remove `ExtractJwt` import (no longer needed)
2. Import `cookieExtractor` utility
3. Replace `jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()` with `jwtFromRequest: cookieExtractor`

**Updated Implementation**:

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { cookieExtractor } from '../utils/cookie-extractor';

export interface JwtPayload {
  email: string;
  sub: number;
  username: string;
}

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

**Key Changes**:

- Removed: `ExtractJwt` import
- Added: `cookieExtractor` import from `../utils/cookie-extractor`
- Changed: `jwtFromRequest` now uses custom extractor
- Unchanged: `validate` method, payload interface, secret configuration

### Understanding the Change

**How It Works**:

1. When a request comes in with `JwtAuthGuard`
2. Passport calls `jwtFromRequest` function (now `cookieExtractor`)
3. `cookieExtractor` reads from `req.cookies.kord_access_token`
4. If token found, Passport verifies it with JWT secret
5. If valid, Passport calls `validate()` method
6. `validate()` returns user object attached to `req.user`
7. `@CurrentUser()` decorator can access `req.user`

**No Changes Needed For**:

- `JwtAuthGuard` - Works automatically with updated strategy
- `@CurrentUser()` decorator - Still receives same user object
- Protected routes - Continue to use `@UseGuards(JwtAuthGuard)`
- Controllers/services - No code changes required

### Testing Phase 2

After completing the update:

#### 1. Build Verification

```bash
npm run build
```

Expected: No TypeScript errors

#### 2. Check for Import Errors

Verify that:

- `cookieExtractor` import resolves correctly
- No circular dependency warnings
- All types are properly inferred

#### 3. Manual API Test (Temporary)

Since auth endpoints haven't been updated to SET cookies yet, we can't fully test. However, we can verify the strategy compiles and the app starts:

```bash
npm run start:dev
```

Expected: Application starts without errors

**Note**: Full testing will happen in Phase 3 when controllers are updated to set cookies.

### Expected Outcomes

- [x] JwtStrategy updated to use cookie extraction
- [x] ExtractJwt import removed
- [x] cookieExtractor imported correctly
- [x] No build errors
- [x] Application starts successfully
- [x] No breaking changes to existing code structure

### Files Modified

**Modified**:

- `src/modules/auth/strategies/jwt.strategy.ts` - Updated token extraction

**No Changes To**:

- `src/modules/auth/guards/jwt-auth.guard.ts` - Still works with updated strategy
- `src/modules/auth/decorators/current-user.decorator.ts` - No changes needed
- Any controllers using `@UseGuards(JwtAuthGuard)` - Work automatically

### Verification Checklist

Before proceeding to Phase 3:

- [ ] Code compiles without errors
- [ ] No TypeScript errors in IDE
- [ ] Application starts in development mode
- [ ] No import resolution issues
- [ ] Linting passes
- [ ] Code is formatted

### Common Issues & Solutions

**Issue**: Cannot find module '../utils/cookie-extractor'
**Solution**: Ensure Phase 1 was completed and file exists at correct path

**Issue**: Type error on `jwtFromRequest`
**Solution**: Verify `cookieExtractor` signature matches passport-jwt expectations: `(req: Request) => string | null`

**Issue**: Application doesn't start
**Solution**: Check that cookie-parser middleware was added in main.ts (Phase 1)

### Next Steps

After completing Phase 2, proceed to **Phase 3: Controller & Service Updates** to:

1. Update auth endpoints to SET cookies in responses
2. Add logout endpoint to CLEAR cookies
3. Modify AuthService for logout logic
4. Update DTOs to reflect new response structure

### Important Notes

- This phase doesn't break existing functionality (app still works with headers temporarily)
- Full migration requires Phase 3 (controller updates to set cookies)
- All `JwtAuthGuard` protected endpoints will automatically use cookie extraction after this change
- No changes needed to RolesGuard or other guards that depend on JwtAuthGuard

### References

- [Passport.js Custom Extractors](http://www.passportjs.org/packages/passport-jwt/#extracting-the-jwt-from-the-request)
- [NestJS Passport Integration](https://docs.nestjs.com/security/authentication#implementing-passport-jwt)
- Main implementation plan: `docs/plan/cookie-auth-implementation.md`
- Previous phase: `.github/prompts/cookie-auth-phase-1.prompt.md`
