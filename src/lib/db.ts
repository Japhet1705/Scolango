/**
 * SCOLANGO — Client Prisma singleton
 *
 * Prisma recommande un singleton pour éviter de créer trop de connexions
 * en développement (Hot Module Replacement recréerait le client à chaque save).
 *
 * Usage :
 *   import { db } from '@/lib/db';
 *   const users = await db.user.findMany();
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      schema: 'public',
      pool: new Pool({
        connectionString,
      }),
    }),
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
