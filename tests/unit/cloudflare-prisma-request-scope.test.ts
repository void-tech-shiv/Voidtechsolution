import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the OpenNext request context and the database driver. These tests
// exercise client lifecycle without connecting to production Neon/PostgreSQL.
const testState = vi.hoisted(() => ({
  request: { ctx: {} as object, env: { DATABASE_URL: "postgresql://test:test@localhost:5432/test" } },
  clients: [] as object[],
  adapterUrls: [] as string[],
}));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => testState.request,
}));

vi.mock("@prisma/adapter-neon", () => ({
  PrismaNeon: class {
    constructor(options: { connectionString: string }) {
      testState.adapterUrls.push(options.connectionString);
    }
  },
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    readonly enquiry = {
      findMany: vi.fn(async () => []),
    };

    constructor() {
      testState.clients.push(this);
    }

    async $transaction<T>(callback: (tx: unknown) => Promise<T>): Promise<T> {
      if (!this) throw new Error("Prisma method lost its receiver");
      return callback(this);
    }
  },
}));

import { getPrismaClient, prisma } from "@/lib/prisma";

function setWorkerRequest(ctx: object, databaseUrl = "postgresql://test:test@localhost:5432/test") {
  testState.request = { ctx, env: { DATABASE_URL: databaseUrl } };
}

describe("Cloudflare Prisma request-scoped connection lifecycle", () => {
  beforeEach(() => {
    vi.stubEnv("IS_CLOUDFLARE_WORKER", "true");
    vi.stubEnv("CF_WORKER", "");
    vi.stubEnv("CF_PAGES", "");
    vi.stubEnv("NODE_ENV", "production");
    testState.clients.length = 0;
    testState.adapterUrls.length = 0;
    setWorkerRequest({});
  });

  it("creates one PrismaNeon adapter/client per Worker request", () => {
    const context = {};
    setWorkerRequest(context);
    const first = getPrismaClient();
    expect(prisma.enquiry).toBe((first as typeof prisma).enquiry);
    expect(getPrismaClient()).toBe(first);
    expect(testState.clients).toHaveLength(1);
    expect(testState.adapterUrls).toEqual(["postgresql://test:test@localhost:5432/test"]);
  });

  it("never reuses a prior request's Prisma client or connection pool", () => {
    setWorkerRequest({});
    const first = getPrismaClient();
    const firstDelegate = prisma.enquiry;

    setWorkerRequest({});
    const second = getPrismaClient();
    const secondDelegate = prisma.enquiry;

    expect(second).not.toBe(first);
    expect(secondDelegate).not.toBe(firstDelegate);
    expect(testState.clients).toHaveLength(2);
    expect(testState.adapterUrls).toHaveLength(2);
  });

  it("keeps interactive Prisma transactions bound to the active request", async () => {
    setWorkerRequest({});
    const currentClient = getPrismaClient();
    const returnedClient = await prisma.$transaction(async (tx) => tx);
    expect(returnedClient).toBe(currentClient);

    setWorkerRequest({});
    const nextClient = getPrismaClient();
    const nextTransactionClient = await prisma.$transaction(async (tx) => tx);
    expect(nextTransactionClient).toBe(nextClient);
    expect(nextTransactionClient).not.toBe(currentClient);
  });

  it("uses a stable singleton only in a non-Worker Node.js process", () => {
    vi.stubEnv("IS_CLOUDFLARE_WORKER", "false");
    const first = getPrismaClient();
    const second = getPrismaClient();
    expect(first).toBe(second);
    expect(prisma.enquiry).toBe((first as typeof prisma).enquiry);
  });
});
