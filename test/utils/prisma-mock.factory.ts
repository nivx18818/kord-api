/**
 * Prisma Client Singleton for Unit Testing (Prisma v7)
 *
 * This file mocks the Prisma Client module BEFORE it's imported.
 * Required because Prisma v7 generates ESM-only client code.
 *
 * Based on: https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing
 */

import type { PrismaClient } from 'generated/prisma/client';

import { type DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

// Mock the module BEFORE any import can trigger ESM loading
jest.mock('generated/prisma/client', () => ({
  __esModule: true,
  PrismaClient: jest.fn(),
}));

// Create the mock instance
export const prismaMock = mockDeep<PrismaClient>();

// Reset mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
});

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

/**
 * Factory function for backward compatibility with existing tests
 * Returns the singleton mock instance
 */
export const createMockPrismaService = (): MockPrismaClient => {
  return prismaMock;
};
