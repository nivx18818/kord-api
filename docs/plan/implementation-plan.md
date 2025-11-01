### Kord App Feature and Todo Checklists

This document provides checklists for the Kord app (a simple Discord-like chat application). It covers:

- **Todo Tasks**: Actionable steps to complete the app based on the provided plans, focusing on authentication, flows, authorization, and video calls. These are prioritized incrementally to keep development simple.
- **Future Planned Features**: Simple enhancements like screen sharing, plus a few straightforward ideas I came up with (e.g., no complex AI bots or advanced analytics to avoid complication).

Checklists use:

- [x] for implemented.
- [ ] for pending or planned.

#### 1. Todo Tasks

These are broken into phases from the plans. Focus on one phase at a time for simplicity. Each task includes subtasks where needed.

**Phase 0: Initial Setup**

- [x] User registration and profile creation (auto-linked one-to-one).
- [x] Basic CRUD for users (create, read, update, delete).
- [x] Basic CRUD for profiles (bio, avatar, social links).
- [x] Server creation and management (name, servername unique).
- [x] Channel management (text/voice types, public/restrict/private status, DM flag).
- [x] Membership system (users join servers with roles).
- [x] Role system (permissions as JSON, e.g., manage channels).
- [x] Messaging (text content as JSON, threading via parentMessageId, soft deletes).
- [x] Attachments for messages (URL, type, size).
- [x] Reactions for messages (emoji, unique per user-message).
- [x] Prisma migrations and schema (cascading deletes, enums for types/status).
- [x] Basic testing (unit specs for services/controllers, e2e for app).
- [x] Environment setup (`.env` for DB/JWT, Prettier/ESLint).

**Phase 1: Authentication**

- [x] Install auth dependencies (e.g., `@nestjs/passport`, `bcrypt`).
- [x] Create `AuthModule` with service/controller.
- [x] Implement password hashing in AuthService (bcrypt with 12 rounds).
- [x] Add endpoints: `POST /auth/register` (user + profile), `POST /auth/login` (JWT), `POST /auth/refresh`.
- [x] Add email checking endpoint (e.g., `GET /auth/check-email?email=:email`).
- [x] Set up `LocalStrategy` and `JwtStrategy`.
- [x] Apply `JwtAuthGuard` to protected routes.
- [x] Add `RefreshToken` model to Prisma schema and migrate.
- [x] Create `@CurrentUser` decorator.
- [x] Write unit/E2E tests for auth flows.

**Phase 2: App Flows**

- [x] Enhance `UsersController:` Auto-create profile on register.
- [x] Add filters: `GET /servers?userId=:id` (user's joined servers via memberships).
- [x] Add DM auto-creation logic in `ChannelsService` (when starting private chat).
- [x] Implement pagination in `MessagesService` (use `take`/`skip`, `?page`/`?limit` queries).
- [x] Filter messages by `deletedAt=null` in `findAll`/`findOne`.
- [x] Add `?serverId=:id` filter to `RolesController`.
- [x] Set up basic WebSocket gateway for real-time (e.g., broadcast new messages to channel rooms).
- [x] Update DTOs for any new fields (e.g., optional params).
- [x] Add global error handling (interceptor for 401/403).
- [x] Add invites/joining servers: Endpoint to create invite links (e.g., `POST /servers/:id/invites`) and redeem them (e.g., `POST /invites/:code/join`) for public/restricted servers.
- [x] Add typing indicators: WebSocket event `user.typing` per channel (emit on keypress, clear after timeout).
- [x] Add muting/blocking: New models (e.g., `UserMute` for muted users, `ChannelBlock` for blocked DMs); endpoints to mute/block (`POST /users/:id/mute`, `POST /channels/:id/block` for DMs).

**Phase 3: Authorization**

- [ ] Define Permissions enum in `src/shared`.
- [ ] Create `RolesGuard` to check memberships and permissions.
- [ ] Add `@RequiredPermissions` decorator.
- [ ] Apply guards to endpoints (e.g., channel create needs `MANAGE_CHANNELS`).
- [ ] Inject user in services for perm checks (throw `ForbiddenException`).
- [ ] Handle DM auth (based on participants).
- [ ] Test with mock users/roles.
- [ ] Add server roles management: Endpoints to assign/remove roles to members (e.g., `POST /servers/:id/members/:userId/roles/:roleId`, `DELETE` for removal), with permission checks.

**Phase 4: Video Calls**

- [ ] Install WebSocket/mediasoup dependencies.
- [ ] Update `main.ts` for HTTPS (self-signed certs locally).
- [ ] Update Prisma: Add `activeCall` to `Channel`, `UserStatus` enum to `User`; migrate.
- [ ] Create `VideoModule` with gateway/service.
- [ ] Implement gateway events: `joinCall`, `offer`, `answer`, `ice-candidate`.
- [ ] In `VideoService`: Init mediasoup workers/routers for group calls.
- [ ] Add 1:1 peer-to-peer for DMs.
- [ ] Add group SFU for VOICE channels (transports, producers/consumers).
- [ ] Integrate auth guards in gateway (JWT from handshake).
- [ ] Update user status on connect/in-call.
- [ ] Test with multiple clients (e.g., browser tabs).

**General Todos**

- [ ] Run lint/format after changes.
- [ ] Update README with setup (e.g., `.env`, HTTPS certs).
- [ ] Add rate limiting (e.g., `@nestjs/throttler` for login).
- [ ] Secure attachments (e.g., validate URLs, add storage like S3 later).

#### 2. Future Planned Features

These are simple additions to keep the app lightweight. Prioritize based on user feedback; aim for 1-2 at a time post-MVP.

- [ ] Screen sharing: Add as a separate producer track in WebRTC (via `getDisplayMedia`); integrate into video gateway events.
- [ ] Basic notifications: Push alerts for new messages/calls (use WebSockets to emit to users; no full push service like FCM yet).
- [ ] User presence indicators: Show online/offline/in-call status in user lists (update via WebSockets on connect/disconnect).
- [ ] Message search: Simple keyword search in channels (add endpoint `GET /messages?channelId&query`).
- [ ] Emoji picker support: Expand reactions to custom emojis (store in DB, simple CRUD).
- [ ] Basic theming: Allow server-level themes (add theme field to Server model; frontend handles display).
- [ ] File sharing limits: Enforce size/type restrictions on attachments (e.g., max 10MB, images/videos only).
- [ ] Call recording: Opt-in audio recording (store as attachment; with user consent flags).
- [ ] Mobile optimizations: Ensure APIs are responsive (e.g., smaller paginated responses); no native app yet.
- [ ] Analytics: Simple server stats (e.g., active users; query DB periodically).
- [ ] Audit logs (optional lightweight): Store who created/deleted/edited entities (add AuditLog model with entityId, action, userId, timestamp).
- [ ] User settings: Basic preferences (theme, notifications toggles; add `UserSettings` model linked to `User`).

This keeps Kord focused on core chat functionality without overcomplicating (e.g., no AI, no e-commerce integrations). Total estimated post-MVP features: 4-6 months if adding one per sprint.
