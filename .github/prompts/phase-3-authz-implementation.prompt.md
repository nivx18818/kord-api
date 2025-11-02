---
description: 'Implement Phase 3 – Authorization for Kord API'
# prettier-ignore
tools: ['edit/createFile', 'edit/createDirectory', 'edit/editFiles', 'search', 'runCommands', 'runTasks', 'context7/*', 'upstash/context7/*', 'usages', 'problems', 'changes', 'testFailure', 'fetch', 'githubRepo', 'prisma.prisma/prisma-migrate-status', 'prisma.prisma/prisma-migrate-dev', 'prisma.prisma/prisma-migrate-reset', 'prisma.prisma/prisma-studio', 'prisma.prisma/prisma-platform-login', 'prisma.prisma/prisma-postgres-create-database', 'extensions', 'todos']
---

## Task: Implement Phase 3 – Authorization for Kord API

Implement **role-based access control (RBAC)** for the NestJS-based Kord API using permissions, guards, and decorators to secure endpoints and enforce server/channel-level access.

### Scope

Define a Permissions enum, create RolesGuard and @RequiredPermissions decorator, apply them to existing endpoints (e.g., server/channel/message management), handle DM-specific authorization, and add role assignment/removal endpoints. Integrate with RolesModule, ServersModule, and Prisma for permission checks based on user memberships and role JSON data.

### Endpoints & Behavior

- **Permissions Enum**: Define in `src/shared/permissions.enum.ts` with values like `MANAGE_SERVERS`, `MANAGE_CHANNELS`, `SEND_MESSAGES`, `EDIT_MESSAGES`, `MANAGE_ROLES`, `CONNECT_VOICE`, etc., matching the JSON structure in Role.permissions.

- **RolesGuard**: Create in `src/common/guards/roles.guard.ts` to check user membership in server/channel, load roles via RolesService, parse permissions JSON, and verify against @RequiredPermissions. Throw ForbiddenException if unauthorized.

- **@RequiredPermissions Decorator**: Create in `src/common/decorators/required-permissions.decorator.ts` to set required permissions on controllers/methods.

- **Apply Guards to Endpoints**:
  - ServersController: `POST /servers` requires `MANAGE_SERVERS`.
  - ChannelsController: `POST /channels` requires `MANAGE_CHANNELS`.
  - MessagesController: `POST /messages` requires `SEND_MESSAGES`; `PATCH /messages/:id` requires `EDIT_MESSAGES` or ownership.
  - VideoGateway: `joinCall` requires `CONNECT_VOICE`.

- **DM Authorization**: For DM channels, check if the user is a participant (via Channel.participants or similar logic in ChannelsService). No role checks needed beyond membership.

- **Role Management Endpoints** (in ServersController or new MembershipsController):
  - `POST /servers/:id/members/:userId/roles/:roleId` to assign a role to a member (requires `MANAGE_ROLES`).
  - `DELETE /servers/:id/members/:userId/roles/:roleId` to remove a role (requires `MANAGE_ROLES`).
  - Validate server membership and permissions before changes.

### Requirements

- Use JwtAuthGuard as a base, then apply RolesGuard on top for permission checks.
- Inject current user in services for ownership/permission logic (e.g., via @CurrentUser).
- Map permission failures to 403 Forbidden with clear messages.
- Ensure DMs bypass server-based roles but still require participant validation.
- Follow NestJS module/service/controller separation; centralize permission logic in RolesService.
- Test with mock users/roles in unit tests.

### Integration

- RolesModule ↔ PrismaModule (load roles/permissions).
- ServersModule/ChannelsModule/MessagesModule ↔ RolesGuard (permission checks).
- Align with component diagram (RolesGuard in Guards & Decorators, used by multiple modules) and flows diagram (role checks in create server/channel/message flows, role assignment flow).
- Build on Phase 1 (auth guards) and Phase 2 (endpoints and flows).

### Deliverables

- Permissions enum, RolesGuard, and @RequiredPermissions decorator.
- Updated controllers with guards applied.
- New role management endpoints with tests.
- Code formatted and linted (`npm run lint && npm run format`).
- Updated implementation-plan.md checklists.

Keep the implementation aligned with `docs/plan/implementation-plan.md` and existing diagrams.
