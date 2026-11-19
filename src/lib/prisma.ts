import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Node.js may safely reuse a singleton. Never retain a Worker client here:
// Neon's pool opens request-bound WebSocket I/O which cannot cross Worker requests.
let nodePrisma: PrismaClient | undefined;

// An OpenNext ctx belongs to one Worker request. Weak keys allow the client
// and its connection pool to be collected after the request goes away.
const workerPrismaByRequest = new WeakMap<object, PrismaClient>();

function isCloudflareRuntime(): boolean {
  return (
    process.env.IS_CLOUDFLARE_WORKER === "true" ||
    Boolean(process.env.CF_PAGES) ||
    Boolean(process.env.CF_WORKER) ||
    (typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers")
  );
}

function prismaLogLevels(): ("warn" | "error")[] {
  return process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"];
}

/**
 * Resolve the Prisma Client for the current execution context.
 *
 * Workers MUST create the Neon adapter and PrismaClient inside the current
 * request. Reusing a module-level client shares its WebSocket pool across
 * requests and causes "Cannot perform I/O on behalf of a different request".
 *
 * The OpenNext request context is available to Server Components, Server
 * Actions, and route handlers. Reuse is safe within the same request, including
 * interactive Prisma transactions. Node.js scripts/tests retain a singleton.
 */
export function getPrismaClient(): PrismaClient {
  if (isCloudflareRuntime()) {
    // Do not catch a missing context and silently fall back to a global client:
    // a global fallback would reintroduce cross-request socket reuse.
    const { ctx, env } = getCloudflareContext();
    if (!ctx || typeof ctx !== "object") {
      throw new Error("Cloudflare request context is required for database access.");
    }

    let client = workerPrismaByRequest.get(ctx);
    if (!client) {
      const databaseUrl =
        (env as { DATABASE_URL?: string }).DATABASE_URL || process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error("DATABASE_URL must be set for Cloudflare database access.");
      }

      const adapter = new PrismaNeon({ connectionString: databaseUrl });
      client = new PrismaClient({ adapter, log: prismaLogLevels() });
      workerPrismaByRequest.set(ctx, client);
    }
    return client;
  }

  if (!nodePrisma) {
    nodePrisma = globalForPrisma.prisma ?? new PrismaClient({ log: prismaLogLevels() });
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = nodePrisma;
    }
  }
  return nodePrisma;
}

/**
 * Backwards-compatible Prisma facade: existing repositories can continue to
 * use prisma.enquiry.findMany(), prisma.$transaction(), and tagged SQL.
 * Each property access resolves the request's actual client. Bind top-level
 * methods so $transaction/$queryRaw execute with the correct Prisma instance.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property: string | symbol) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/**
 * Verifies whether the database is reachable in the current request.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
