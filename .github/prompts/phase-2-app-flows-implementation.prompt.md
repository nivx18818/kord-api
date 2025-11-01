---
description: 'Implement Phase 2 – App Flows for Kord API'
# prettier-ignore
tools: ['edit/createFile', 'edit/createDirectory', 'edit/editFiles', 'search', 'runCommands', 'runTasks', 'context7/*', 'upstash/context7/*', 'usages', 'problems', 'changes', 'testFailure', 'fetch', 'githubRepo', 'prisma.prisma/prisma-migrate-status', 'prisma.prisma/prisma-migrate-dev', 'prisma.prisma/prisma-migrate-reset', 'prisma.prisma/prisma-studio', 'prisma.prisma/prisma-platform-login', 'prisma.prisma/prisma-postgres-create-database', 'extensions', 'todos']
---

## Task: Implement Phase 2 – App Flows for Kord API

Implement core app flows for the NestJS-based Kord API, including server/channel/message management, real-time features, and user interactions.

### Scope

Enhance existing modules (Users, Servers, Channels, Messages, Roles) with new endpoints, filters, and logic. Add basic WebSocket gateway for real-time events. Introduce new models for invites, muting, and blocking. Ensure integration with AuthModule for protected routes.

### Endpoints & Behavior

- **UsersController Enhancements**:
  - Auto-create profile on user registration (via UsersService).
  - Add `GET /users/:id/servers` to list user's joined servers (via memberships).

- **ServersController Enhancements**:
  - Add `GET /servers?userId=:id` filter for user's servers.
  - Add invite system: `POST /servers/:id/invites` (create invite link/code), `POST /invites/:code/join` (redeem invite to join server, check permissions for public/restricted).

- **ChannelsController Enhancements**:
  - Add DM auto-creation: When starting private chat, create channel if not exists (DM flag, participants).
  - Add `POST /channels/:id/block` to block DM channels.

- **MessagesController Enhancements**:
  - Implement pagination: `GET /messages?channelId=:id&page=:page&limit=:limit` (use take/skip).
  - Filter messages by `deletedAt=null` in `findAll`/`findOne`.
  - Add typing indicators: WebSocket event `user.typing` per channel (emit on keypress, clear after 3s timeout).

- **RolesController Enhancements**:
  - Add `GET /roles?serverId=:id` filter for server roles.

- **New Models & Endpoints**:
  - Add `Invite` model to Prisma schema (serverId, code, expiresAt, createdBy).
  - Add `UserMute` model (userId, targetId, reason, timestamps).
  - Add `ChannelBlock` model (userId, channelId, timestamps).
  - Add `POST /users/:id/mute` to mute users.
  - Migrate schema and regenerate Prisma client.

- **WebSocket Gateway**:
  - Set up basic gateway for real-time (e.g., broadcast new messages to channel rooms via `message.created` event).
  - Integrate with MessagesService for events.

### Requirements

- Use JwtAuthGuard for protected routes.
- Add global error handling interceptor for 401/403.
- Update DTOs for new optional params (e.g., pagination, filters).
- Ensure cascading deletes and referential integrity.
- Follow NestJS module/service/controller separation.
- Handle permissions via RolesGuard where applicable (e.g., manage invites, send messages).

### Integration

- Modules ↔ PrismaModule (DB access).
- MessagesModule ↔ WebSocket Gateway (broadcast events).
- ServersModule ↔ RolesModule (permission checks for invites).
- Align with component diagram (kord-api-components.plantuml) and flows (kord-api-flows.plantuml).

### Deliverables

- Updated Prisma schema (with Invite, UserMute, ChannelBlock models).
- Working endpoints and WebSocket events with tests.
- Code formatted and linted (`npm run lint && npm run format`).
- Updated implementation-plan.md checklists.

Keep the implementation aligned with `docs/plan/implementation-plan.md` and existing diagrams.
