import { PrismaClient } from '@prisma/client';

// グローバルスコープにPrismaClientを保存して、再利用する（開発環境のみ）
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
  });

if (process.env.NODE_ENV === 'development' && !globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
