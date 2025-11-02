## Fix Plan for Kord API Issues

Based on the critical gaps identified in [TESTING_ANALYSIS.md](./TESTING_ANALYSIS.md), here's a structured plan to address the issues. This aligns with the project's NestJS + Prisma architecture and follows the coding instructions for transactional operations, permission handling, and service-layer data access.

### Phase 1: Fix Server Creation Flow

#### Current behavior

When a user creates a server, they are NOT automatically added as a member with admin privileges.

- Creator cannot access their own server
- All subsequent operations fail with 403 Forbidden
- Frontend cannot implement server creation flows

#### Expected behavior

When a user creates a server, they are automatically added as a member with an "Admin" role that grants full permissions (e.g., MANAGE_SERVERS, SEND_MESSAGES, etc.), allowing immediate access and management of the server without manual intervention.

#### Required Fix and Steps

##### Objective

Ensure server creators are automatically added as admin members with full permissions to enable seamless server creation and access.

##### Required Fix

Update `ServersService.create()` to use a Prisma transaction for creating the server, a default "Admin" role, and membership. Modify `ServersController.create()` to remove the permission requirement and pass the creator's ID.

##### Steps

1. Update `ServersService.create()` in servers.service.ts to use a Prisma transaction:
   - Create the server.
   - Create a default "Admin" role with all permissions (e.g., `MANAGE_SERVERS`, `SEND_MESSAGES`, etc.).
   - Add the creator as a member with this role via `UserServer` (membership).
2. Modify `ServersController.create()` in servers.controller.ts:
   - Remove `@RequiredPermissions(Permission.MANAGE_SERVERS)` decorator (users don't need it for their first server).
   - Pass `user.id` from `@CurrentUser()` to the service method.
3. Update `CreateServerDto` if needed to include optional `createdBy` field (though JWT extraction is preferred).

### Phase 2: Enhance RolesGuard Parameter Resolution

#### Current behavior

The RolesGuard fails to resolve `serverId` from route parameters in certain cases, leading to incorrect permission checks.

- Affected routes like `GET /servers/:id` return 403 Forbidden instead of checking actual permissions.
- Guard logic does not dynamically resolve server context from various route patterns (e.g., `/servers/:id`, `/servers/:serverId/channels/:id`).

#### Expected behavior

The RolesGuard correctly resolves `serverId` from route parameters across all relevant endpoints, performing accurate permission checks based on the user's roles and memberships.

#### Required Fix and Steps

##### Objective

Fix guard failures in resolving `serverId` from route parameters to prevent 403 errors on routes like `GET /servers/:id`.

##### Required Fix

Review and update `RolesGuard` in `src/modules/auth/roles.guard.ts` to improve logic for extracting `serverId` from various route patterns using reflection or route metadata, ensuring it checks actual permissions.

##### Steps

1. Review and update `RolesGuard` in `src/modules/auth/roles.guard.ts`:
   - Improve logic to extract `serverId` from various route patterns (e.g., `/servers/:id`, `/servers/:serverId/channels/:id`).
   - Use reflection or route metadata to dynamically resolve server context.
   - Ensure it checks actual permissions instead of defaulting to forbidden.
2. Test affected routes manually and update unit tests for the guard.

### Phase 3: Implement Default Role Assignment for Invites

#### Current behavior

When users join servers via invites, no default role is assigned, leaving them without permissions.

- Users have no access after joining, as no "Member" role with basic permissions is auto-assigned.
- Invite redemption does not create or assign a default role.

#### Expected behavior

When users join servers via invites, a default "Member" role with basic permissions (e.g., VIEW_CHANNELS, SEND_MESSAGES) is automatically assigned, granting immediate access without manual role setup.

#### Required Fix and Steps

##### Objective

Auto-assign a "Member" role with basic permissions when users join servers via invites.

##### Required Fix

Update invite redemption logic in `MembershipsService` (or relevant service) to create and assign a default "Member" role upon invite acceptance.

##### Steps

1. Update invite redemption logic in `MembershipsService` (or relevant service):
   - On invite acceptance, create a default "Member" role if it doesn't exist for the server.
   - Assign the new member to this role via `UserServer`.
2. Ensure permissions JSON includes basics like `VIEW_CHANNELS` and `SEND_MESSAGES`.

### Phase 4: Validation and Testing

#### Current behavior

Fixes may introduce regressions, and existing tests (e.g., e2e tests) fail due to unresolved bugs, with incomplete validation against schema/DTOs.

- Unit tests pass, but e2e tests are blocked by server creation and guard issues.
- No regeneration of Prisma client or DTO updates post-fixes.

#### Expected behavior

All fixes are validated without regressions, with updated DTOs, regenerated Prisma client, and passing tests, ensuring alignment with schema and proper error handling.

#### Required Fix and Steps

##### Objective

Ensure fixes don't introduce regressions and align with schema/DTOs, with comprehensive testing.

##### Required Fix

Run tests, update DTOs, regenerate Prisma client, and document changes.

##### Steps

1. Run all unit tests (`npm run test`) and e2e tests (`npm run test:e2e`).
2. Update DTOs (e.g., in dto) to validate new fields if added.
3. Regenerate Prisma client if schema changes: `npx prisma generate --schema prisma/schema.prisma`.
4. Update docs with corrected flows and permission models.

Start with Phase 1 to unblock core flows, then proceed sequentially. Monitor for cascading effects on dependent entities like channels and messages. If issues persist, review transaction isolation and error mapping.
