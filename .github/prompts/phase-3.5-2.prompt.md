---
description: 'Implement Phase 3.5-2 – Enhance RolesGuard Parameter Resolution for Kord API'
# prettier-ignore
tools: ['edit/createFile', 'edit/createDirectory', 'edit/editFiles', 'search', 'runCommands', 'runTasks', 'context7/*', 'upstash/context7/*', 'usages', 'problems', 'changes', 'testFailure', 'fetch', 'githubRepo', 'prisma.prisma/prisma-migrate-status', 'prisma.prisma/prisma-migrate-dev', 'prisma.prisma/prisma-migrate-reset', 'prisma.prisma/prisma-studio', 'prisma.prisma/prisma-platform-login', 'prisma.prisma/prisma-postgres-create-database', 'extensions', 'todos']
---

## Task: Implement Phase 3.5-2 – Enhance RolesGuard Parameter Resolution for Kord API

### Current behavior

The RolesGuard fails to resolve `serverId` from route parameters in certain cases, leading to incorrect permission checks.

- Affected routes like `GET /servers/:id` return 403 Forbidden instead of checking actual permissions.
- Guard logic does not dynamically resolve server context from various route patterns (e.g., `/servers/:id`, `/servers/:serverId/channels/:id`)

### Expected behavior

The RolesGuard correctly resolves `serverId` from route parameters across all relevant endpoints, performing accurate permission checks based on the user's roles and memberships.

### Required Fix and Steps

#### Objective

Fix guard failures in resolving `serverId` from route parameters to prevent 403 errors on routes like `GET /servers/:id`.

#### Required Fix

Review and update `RolesGuard` in `src/modules/auth/roles.guard.ts` to improve logic for extracting `serverId` from various route patterns using reflection or route metadata, ensuring it checks actual permissions.

#### Steps

1. Review and update `RolesGuard` in `src/modules/auth/roles.guard.ts`:

- Improve logic to extract `serverId` from various route patterns (e.g., `/servers/:id`, `/servers/:serverId/channels/:id`).
- Use reflection or route metadata to dynamically resolve server context.
- Ensure it checks actual permissions instead of defaulting to forbidden.

2. Test affected routes manually and update unit tests for the guard.
