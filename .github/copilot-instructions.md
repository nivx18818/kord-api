# Kord API – Copilot Guide

Guidance for GitHub Copilot when assisting with Kord (NestJS + Prisma, Discord-inspired real-time community platform).

## Project Overview

- **Purpose**: Real-time community platform modeled after Discord, supporting servers, channels, messaging, threading, reactions, roles, and user profiles.
- **Backend**: NestJS modules for REST APIs and WebSocket gateways.
- **Persistence**: Prisma ORM targeting MySQL, configured via `DATABASE_URL`.
- **Generated Prisma client**: Output to `generated/prisma`; reference schema in `prisma/schema.prisma`.
- **Core Entities**:
  - **User**: Authenticated member with unique username/email, optional profile (bio, avatar, social links), DOB stored separately.
  - **Profile**: One-to-one extension of User; holds social metadata and media URLs.
  - **Server**: Top-level community hub with unique `servername`, timestamped lifecycle.
  - **Channel**: Belongs to Server; categorized by `ChannelType` (TEXT/VOICE) and `ChannelStatus` (PUBLIC/RESTRICT/PRIVATE). Supports DM flag.
  - **Message**: JSON payload allowing rich content, belongs to Channel/User, supports threading via `parentMessageId`.
  - **Attachment**: File metadata tied to Message (URL, type, size).
  - **Role**: Server-specific role with JSON-based permissions, linked to members via UserServer.
  - **UserServer**: Membership pivot (many-to-many) storing join timestamps, role assignment (many-to-many with Role via MemberRole junction table).
  - **MemberRole**: Junction table linking UserServer memberships to Roles, enabling multiple role assignment per member.
  - **ReactsMessage**: Composite key of message/user enabling emoji reactions with timestamps.
- **Key Behaviors & Constraints**:
  - Automatic timestamps for audit trails (`createdAt`, `updatedAt`); optional `deletedAt` on Message for soft delete workflows.
  - Cascading deletes from User, Server, Channel, Message to dependent records ensure referential integrity.
  - Unique constraints: usernames, emails, servernames; composite IDs on UserServer and ReactsMessage.
  - Indexes targeting frequent queries: message timelines, server membership, channel discovery, reaction lookup.
- **Feature Affordances**:
  - Threaded discussions through self-referencing Message relation.
  - Role-based access control using JSON permission sets; **members can have multiple roles with effective permissions calculated as the union (OR operation) of all role permissions**.
  - Rich message composition (embeds, attachments) via JSON content and Attachment records.
  - Social presence via Profile integrations (Twitter/X, GitHub, LinkedIn, etc.).
  - Reaction tracking for engagement metrics.

## Core Architecture

- `src/app.module.ts` wires the global `PrismaModule` alongside domain modules (`users` today); new verticals adopt the same registration.
- Domain modules live in `src/modules/<domain>` with controllers delegating to services and DTOs in `dto/`; keep Prisma access inside the service layer.
- `src/modules/prisma/prisma.module.ts` marks Prisma as a global provider so it only needs to be imported once.
- `src/modules/prisma/prisma.service.ts` extends `PrismaClient` (via `@prisma/client/extension`) and connects during `onModuleInit`; inject it where data access is required.
- Group NestJS modules by domain (`users`, `servers`, `channels`, `messages`, etc.). Each module should define controllers, services, DTOs, and providers that wrap Prisma queries. Inject shared services (e.g., Prisma) via NestJS dependency injection.

## Data & Persistence

- Prisma targets MySQL through `DATABASE_URL` and emits the generated client to `generated/prisma`; regenerate with `npx prisma generate --schema prisma/schema.prisma` after schema tweaks.
- Migrations live in `prisma/migrations`; create new ones with `npx prisma migrate dev --name <desc>` so the schema, client, and database stay aligned.
- Services should prefer selective reads (`select`/`include`) and transaction blocks for multi-step writes, matching the guidance captured in `AGENTS.md`.
- JSON-heavy columns such as `Role.permissions` and `Message.content` need DTO validation before persisting to avoid malformed payloads.
- Keep DTO validation aligned with the Prisma schema (respect optionals, enums, JSON fields).
- Wrap multi-step mutations (message + attachments, membership + role) in transactions.
- Prefer Prisma transactions for multi-step writes.
- Use `select`/`include` to limit payload size and avoid N+1s.
- Update enums in `prisma/schema.prisma` and regenerate the client (`npx prisma generate`) when adding channel types/statuses.
- Document any evolution of the permission JSON structure; consider centralizing permission keys/constants.
- Leverage `deletedAt` and timestamp fields to support archival, auditing, and soft delete patterns.

## Role Management & Permissions

- **Multiple Roles**: Users can have multiple roles per server through the `MemberRole` junction table linking `UserServer` memberships to `Role` records.
- **Permission Resolution**: Effective permissions are calculated using OR logic—if any assigned role grants a permission, the user has that permission.
- **Role Assignment Endpoints**:
  - `POST /servers/:serverId/members/:userId/roles` - Assign multiple roles (replaces existing)
  - `DELETE /servers/:serverId/members/:userId/roles` - Remove specific roles
  - `DELETE /servers/:serverId/members/:userId/roles/all` - Remove all roles
  - `GET /roles/users/:userId/servers/:serverId` - Get user's roles and effective permissions
- **Implementation Notes**:
  - Always validate that role IDs belong to the specified server before assignment.
  - Use Prisma transactions when modifying multiple role assignments.
  - Return effective permissions (union of all role permissions) when fetching user roles.
  - Soft-delete or cascade rules ensure role deletions clean up MemberRole records.
  - Guards should check effective permissions by querying all of a user's roles in the server.

## HTTP & Realtime

- REST endpoints are declared with Nest decorators (`@Controller('users')`, `@Post()` etc.) and should return the Prisma results instead of placeholder strings—see `UsersService.create` as the next implementation target.
- Real-time gateways are planned but not yet implemented; isolate future WebSocket gateways alongside their domains to keep dependencies thin.
- Environment-aware bootstrapping happens in `src/main.ts`, defaulting to port 3000; honor the `PORT` env var when deploying.
- Use WebSocket gateways for events (message created/updated/deleted, reactions, typing indicators).
- Verify membership and role permissions before broadcasting channel/server events.

## Error Handling & Validation

- Map Prisma known errors to HTTP exceptions; provide clear messages for unique constraint violations on usernames, emails, and servernames.
- Surface authorization failures through NestJS Guards and Interceptors.
- Rely on `class-validator`/`class-transformer` for payload validation and transformation.
- Provide distinct DTOs for create vs. update flows; validate JSON structures where rich content is expected.
- DTOs in `src/modules/**/dto` should mirror `prisma/schema.prisma`; add `class-validator` decorators as fields solidify.

## Testing Strategy

- Favor unit tests for services and guards using NestJS testing utilities with mocked Prisma client.
- Add integration tests against a disposable Prisma database when flows span multiple tables.
- Unit tests execute with `npm run test`; `npm run test:e2e` drives `test/app.e2e-spec.ts`, which currently expects a `GET /` response of `Hello World!`—update either the controller or the spec when behavior changes.
- New features should ship with corresponding tests under `src/**/*.spec.ts` or `test/` and be registered through `AppModule`.

## Developer Workflow

- Install dependencies with `npm install`; run the API using `npm run start:dev` for watch mode or `npm run start:prod` after `npm run build`.
- Lint with `npm run lint` (type-aware ESLint config in `eslint.config.mjs`) and format code via `npm run format`.
- Configure an `.env` providing `DATABASE_URL` before invoking Prisma commands; migrations and client generation will fail silently without it.
- Regenerate the Prisma client whenever the schema changes before committing dependent code.
- Reference existing indexes (`@@index`) when designing queries to keep performance aligned with schema hints.

## Conventions & Tips

- Use `context7` MCP tool to read latest official docs about packages as needed.
- Keep Prisma usage centralized in services so other providers consume business-level methods instead of raw queries.
- Follow schema naming: persisted columns like `date_of_birth`, `servername`, and soft-delete `deleted_at` already map to camelCase fields in the client.
- Follow NestJS conventions (controllers expose routes, services handle business logic, modules wire dependencies).
- Adhere to repository ESLint/Prettier settings for consistency.
- TypeScript is compiled with the NodeNext module system per `tsconfig.json`; imports must use ESM syntax even when targeting CommonJS consumers.
- Use alias imports to avoid relative path hell (e.g., `import { UsersService } from '@/modules/users/users.service'`).
- Read the `docs/` directory for project plans and diagrams as needed.
