---
description: 'Implement Phase 3.5-3 – Implement Default Role Assignment for Invites for Kord API'
# prettier-ignore
tools: ['edit/createFile', 'edit/createDirectory', 'edit/editFiles', 'search', 'runCommands', 'runTasks', 'context7/*', 'upstash/context7/*', 'usages', 'problems', 'changes', 'testFailure', 'fetch', 'githubRepo', 'prisma.prisma/prisma-migrate-status', 'prisma.prisma/prisma-migrate-dev', 'prisma.prisma/prisma-migrate-reset', 'prisma.prisma/prisma-studio', 'prisma.prisma/prisma-platform-login', 'prisma.prisma/prisma-postgres-create-database', 'extensions', 'todos']
---

## Task: Implement Phase 3.5-3 – Implement Default Role Assignment for Invites for Kord API

### Current behavior

When users join servers via invites, no default role is assigned, leaving them without permissions.

- Users have no access after joining, as no "Member" role with basic permissions is auto-assigned.
- Invite redemption does not create or assign a default role.

### Expected behavior

When users join servers via invites, a default "Member" role with basic permissions (e.g., VIEW_CHANNELS, SEND_MESSAGES) is automatically assigned, granting immediate access without manual role setup.

### Required Fix and Steps

#### Objective

Auto-assign a "Member" role with basic permissions when users join servers via invites.

#### Required Fix

Update invite redemption logic in `MembershipsService` (or relevant service) to create and assign a default "Member" role upon invite acceptance.

#### Steps

1. Update invite redemption logic in `MembershipsService` (or relevant service):

- On invite acceptance, create a default "Member" role if it doesn't exist for the server.
- Assign the new member to this role via `UserServer`.

2. Ensure permissions JSON includes basics like `VIEW_CHANNELS` and `SEND_MESSAGES`.
