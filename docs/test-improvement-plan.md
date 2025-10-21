# Test Improvement Plan for Kord API

This plan addresses weaknesses in the test suite, aligning with the project's NestJS + Prisma architecture, testing strategy (unit tests with mocks, integration tests with test DB), and conventions from the Copilot Guide. Implement incrementally, running `npm run test` after each step to verify. Estimated effort: 2-4 weeks.

## 1. Add Integration Tests (High Priority)
- **Why**: Unit tests mock dependencies, missing real DB interactions for multi-step operations (e.g., transactions, cascading deletes).
- **Steps**:
  - Set up a test database: Use a disposable MySQL instance (e.g., via Docker or in-memory SQLite for Prisma). Configure `DATABASE_URL` in `.env.test`.
  - Create `test/integration/` folder with subfolders mirroring `test/unit/` (e.g., `servers.integration.spec.ts`).
  - For each module, write integration tests using `Test.createTestingModule` with real `PrismaService` (not mocked). Test full CRUD flows, including relations (e.g., create server with channels, verify cascading deletes).
  - Example: In `servers.integration.spec.ts`, test creating a server, adding channels, then deleting the server and confirming channels are removed.
  - Cover transactions: Test message creation with attachments in a single transaction.
  - Run with `npm run test:integration` (add script to `package.json` using Jest's `--testPathPattern`).
  - Target: 80%+ coverage for integration scenarios.

## 2. Expand Edge Cases and Validation Tests (High Priority)
- **Why**: Current tests miss invalid inputs, DTO validations, and feature-specific logic (e.g., soft deletes, permissions).
- **Steps**:
  - For controllers: Add tests for invalid ID parsing (e.g., non-numeric strings → `BadRequestException`), missing required fields, and DTO validation errors (use `@nestjs/testing` with `ValidationPipe`).
  - For services: Test Prisma errors (e.g., `P2002` for unique constraints on usernames/servernames, `P2003` for foreign keys). Mock `PrismaClientKnownRequestError` and verify thrown `ConflictException`/`NotFoundException`.
  - Module-specific additions:
    - **Attachments**: Test size/type limits (e.g., invalid file size → error).
    - **Channels**: Test `ChannelType`/`ChannelStatus` enums and DM flag logic.
    - **Memberships**: Test role assignment validation and composite key uniqueness.
    - **Messages**: Test threading (`parentMessageId` cycles), soft delete queries (exclude `deletedAt` set), and JSON content validation.
    - **Profiles**: Test uniqueness (one per user), social link formats.
    - **Reactions**: Test emoji validation and composite key conflicts.
    - **Roles**: Test JSON permission parsing and enforcement.
    - **Servers**: Test unique `servername` conflicts.
    - **Users**: Test DOB validation, password hashing (if added), and profile relations.
  - Use `test/utils/test-data.factory.ts` to generate invalid mock data.
  - Add guard tests for authorization (e.g., role-based access).

## 3. Enhance E2E Tests (Medium Priority)
- **Why**: Current e2e test is trivial; needs to cover real API flows.
- **Steps**:
  - Update `test/app.e2e-spec.ts`: Replace "Hello World!" check with actual endpoints (e.g., POST /users to create a user, then GET /servers).
  - Add full user journeys: Register user, create server/channel, post message with attachment, react, delete.
  - Use Supertest for HTTP assertions; seed test DB with fixtures.
  - Test WebSocket events once implemented (e.g., message broadcasts).
  - Run with `npm run test:e2e`; aim for end-to-end coverage of core features.

## 4. Address Code Duplication and Linting (Medium Priority)
- **Why**: Repetitive test patterns and ESLint disables reduce maintainability.
- **Steps**:
  - Create shared utilities in `test/utils/`: Functions for common setups (e.g., `setupMockModule` for controllers/services), assertions (e.g., `expectServiceCalledWith`), and error mocks.
  - Refactor tests: Extract repeated mocks (e.g., service methods) into a base class or helper.
  - Fix linting: Remove `@typescript-eslint/unbound-method` disables by using `jest.mocked` or binding methods. Run `npm run lint` and fix issues (e.g., unused variables).
  - Ensure Prettier formatting with `npm run format`.

## 5. Add Performance and Stress Tests (Low Priority)
- **Why**: No checks for scalability or load.
- **Steps**:
  - Use tools like Artillery or k6 for load testing: Simulate concurrent users creating messages/reactions.
  - Add Jest benchmarks for query performance (e.g., time `findAll` with large datasets).
  - Monitor for N+1 queries in integration tests using Prisma's logging.

## Implementation Timeline and Best Practices
- **Phase 1 (Week 1)**: Fix edge cases and integration setup.
- **Phase 2 (Week 2)**: Enhance e2e and module-specific tests.
- **Phase 3 (Week 3-4)**: Deduplication, linting, and performance tests.
- **Tools**: Use Jest coverage reports (`npm run test -- --coverage`) to track progress. Regenerate Prisma client if schema changes affect mocks.
- **Review**: After each phase, run full suite and update Copilot Guide if patterns emerge.
- **Dependencies**: Ensure `test/utils` factories support new scenarios; avoid over-mocking in integration tests.

This plan will make the suite robust, aligning with the guide's emphasis on comprehensive testing and Prisma best practices. Start with integration tests for immediate value.
