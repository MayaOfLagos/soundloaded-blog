import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Store across ALL environments so serverless warm instances reuse the connection pool.
// Previously guarded by !== "production" which is backwards — production needs this most.
globalForPrisma.prisma = db;
