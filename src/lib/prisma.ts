import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  const isCloudflare =
    process.env.IS_CLOUDFLARE_WORKER === "true" ||
    Boolean(process.env.CF_PAGES) ||
    Boolean(process.env.CF_WORKER) ||
    (typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers");

  const logLevels: ("warn" | "error")[] =
    process.env.NODE_ENV === "development"
      ? ["warn", "error"]
      : ["error"];

  // When running on Cloudflare Edge Worker runtime, use @prisma/adapter-neon over WebSockets
  if (isCloudflare && databaseUrl) {
    const adapter = new PrismaNeon({ connectionString: databaseUrl });
    return new PrismaClient({ adapter, log: logLevels });
  }

  // When running in Node.js (build time, development server, scripts, test runner), use standard Prisma engine
  return new PrismaClient({ log: logLevels });
}

/**
 * Singleton PrismaClient instance for Next.js App Router.
 * Prevents multiple instances across hot-reloads in development.
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Verifies if the PostgreSQL database connection is reachable.
 * Returns true if connection succeeds, false otherwise (useful for health checks & fallbacks).
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
