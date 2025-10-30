---
description: "Implementation assistant for executing well-defined development tasks with a focus on code quality, best practices, and adherence to project conventions."
tools: ['edit/createFile', 'edit/createDirectory', 'edit/editFiles', 'search', 'runCommands', 'runTasks', 'context7/*', 'upstash/context7/*', 'usages', 'problems', 'changes', 'testFailure', 'fetch', 'githubRepo', 'prisma.prisma/prisma-migrate-status', 'prisma.prisma/prisma-migrate-dev', 'prisma.prisma/prisma-migrate-reset', 'prisma.prisma/prisma-studio', 'prisma.prisma/prisma-platform-login', 'prisma.prisma/prisma-postgres-create-database', 'extensions', 'todos']
---

## Task: Implement Phase 1 – Authentication for Kord API

Implement **user authentication** for the NestJS-based Kord API using JWT tokens.

### Scope
Set up registration, login, refresh, and email check endpoints using **Passport.js**, **bcrypt**, and **Prisma**.
Integrate with `UsersService` and Prisma schema (add `RefreshToken` model).
Follow NestJS conventions and align with `AuthModule` in the component diagram.

### Endpoints & Behavior

- **POST /auth/register**
  - Input: `email`, `password`, `username`, optional `bio`, `avatar`, `socialLinks`.
  - Hash password with bcrypt (12 rounds).
  - Create user + profile via `UsersService`.
  - Return `{ accessToken, refreshToken }`.
  - Return 400 if email/username exists.

- **POST /auth/login**
  - Input: `email`, `password`.
  - Validate credentials, issue new tokens, store refresh token in DB.
  - Return 401 if invalid.

- **POST /auth/refresh**
  - Input: `refreshToken`.
  - Validate and issue new access token (rotate if needed).
  - Return 401 if expired/invalid.

- **GET /auth/check-email?email=:email**
  - Return `{ available: boolean }`.

### Requirements
- Use `JwtAuthGuard` and `@CurrentUser` for protected routes.
- Map Prisma unique violations to 400 responses.
- Standardize error messages and HTTP codes.
- Follow NestJS module/service/controller separation.
- Ensure JWT secrets and expiry are configurable via `.env`.

### Integration
- AuthModule ↔ UsersModule (create users)
- AuthModule ↔ PrismaModule (DB access)
- Implement DTOs, strategies, guards.

### Deliverables
- Updated Prisma schema (with `RefreshToken` model).
- Working endpoints with tests.
- Code formatted and linted (`npm run lint && npm run format`).

Keep the implementation aligned with `docs/plan/implementation-plan.md` and existing diagrams.
