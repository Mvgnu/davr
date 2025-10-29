import { PrismaClient } from '@prisma/client';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __PRISMA_TEST_DOUBLE__: PrismaClient | undefined;
}

function createTestSafePrisma(): PrismaClient {
  if (global.__PRISMA_TEST_DOUBLE__) {
    return global.__PRISMA_TEST_DOUBLE__;
  }

  // Provide a Proxy that reminds test authors to inject a mock explicitly while still allowing assignment.
  const overrides: Record<string | symbol, unknown> = {};
  return new Proxy({} as PrismaClient, {
    get(_target, property: string | symbol) {
      if (property in overrides) {
        return overrides[property];
      }
      throw new Error(
        `Attempted to access prisma.${String(
          property
        )} in the test environment without mocking. Assign global.__PRISMA_TEST_DOUBLE__ or mock '@/lib/db/prisma'.`
      );
    },
    set(_target, property: string | symbol, value: unknown) {
      overrides[property] = value;
      return true;
    },
  });
}

function createPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === 'test') {
    return createTestSafePrisma();
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}