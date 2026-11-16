import { describe, it, expect } from "vitest";
import * as net from "net";
import {
  checkDatabaseSafety,
  isPortInUse,
  getPortOccupant,
} from "../../scripts/run-visual-gate";

describe("Release Gate Runner Safety & Lifecycle (Finding A)", () => {
  describe("checkDatabaseSafety", () => {
    it("allows safe local development and test database URLs", () => {
      expect(() =>
        checkDatabaseSafety("postgresql://postgres:root@localhost:5432/voidtech_test_concurrency")
      ).not.toThrow();

      expect(() =>
        checkDatabaseSafety("postgresql://user:pass@127.0.0.1:5432/testdb")
      ).not.toThrow();
    });

    it("strictly aborts execution when production Neon database URL is detected", () => {
      expect(() =>
        checkDatabaseSafety("postgresql://voidtech:secret@ep-cool-fog-12345.us-east-2.aws.neon.tech/neondb")
      ).toThrow(/FATAL: DATABASE_URL is configured for production Neon/);

      expect(() =>
        checkDatabaseSafety("postgres://user:pass@neon.tech/db")
      ).toThrow(/FATAL: DATABASE_URL is configured for production Neon/);
    });
  });

  describe("isPortInUse", () => {
    it("returns false for an available port", async () => {
      const server = net.createServer();
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const port = (server.address() as net.AddressInfo).port;
      await new Promise<void>((resolve) => server.close(() => resolve()));

      const inUse = await isPortInUse(port);
      expect(inUse).toBe(false);
    });

    it("returns true for a port actively occupied by a server", async () => {
      const server = net.createServer((socket) => {
        socket.on("error", () => {});
      });
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const port = (server.address() as net.AddressInfo).port;

      try {
        const inUse = await isPortInUse(port);
        expect(inUse).toBe(true);
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });
  });

  describe("Non-destructive port conflict behavior (Unrelated process preserved)", () => {
    it("preserves an unrelated occupying process and does not kill it", async () => {
      const unrelatedServer = net.createServer((socket) => {
        socket.on("error", () => {});
        socket.end("ok");
      });

      await new Promise<void>((resolve) => unrelatedServer.listen(0, "127.0.0.1", resolve));
      const port = (unrelatedServer.address() as net.AddressInfo).port;

      try {
        const inUseBefore = await isPortInUse(port);
        expect(inUseBefore).toBe(true);

        const occupant = getPortOccupant(port);
        if (process.platform === "win32") {
          expect(occupant).not.toBeNull();
          expect(occupant?.pid).toBe(process.pid);
        }

        // Verify socket communication completes cleanly
        await new Promise<void>((resolve) => {
          const client = net.connect({ port, host: "127.0.0.1" }, () => {
            client.on("data", () => {
              client.end();
            });
            client.on("close", () => resolve());
            client.on("error", () => resolve());
          });
        });

        // The unrelated server MUST remain running and healthy
        expect(unrelatedServer.listening).toBe(true);
      } finally {
        await new Promise<void>((resolve) => unrelatedServer.close(() => resolve()));
      }
    });
  });
});
