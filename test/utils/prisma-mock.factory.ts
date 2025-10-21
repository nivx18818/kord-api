import { PrismaClient } from 'generated/prisma';
import { type DeepMockProxy, mockDeep } from 'jest-mock-extended';

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export const createMockPrismaService = (): MockPrismaClient => {
  return mockDeep<PrismaClient>() as MockPrismaClient;
};
