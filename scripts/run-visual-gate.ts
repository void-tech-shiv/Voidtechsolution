import { spawnSync } from "child_process";
import * as net from "net";

/**
 * Task 10.1.5.2.1 — Production Release Gate Runner
 *
 * Enforces:
 * 1. Safe execution environment (verified local/test database, zero Neon access).
 * 2. Dedicated port 3005 preflight check & cleanup.
 * 3. Fresh production build (next build).
 * 4. Isolated production server execution via Playwright webServer on port 3005.
 * 5. Clean teardown and artifact preservation.
 */

const GATE_PORT = parseInt(process.env.GATE_PORT || "3005", 10);

function checkDatabaseSafety(): void {
  const dbUrl = process.env.DATABASE_URL || "";
  if (dbUrl.includes("neon.tech") || dbUrl.includes("aws.neon.tech")) {
    console.error("FATAL: DATABASE_URL is configured for production Neon. Aborting visual gate.");
    process.exit(1);
  }
}

function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once("listening", () => {
      server.close();
      resolve(false);
    });
    server.listen(port, "127.0.0.1");
  });
}

function killPortProcess(port: number): void {
  if (process.platform === "win32") {
    try {
      const output = spawnSync("netstat -ano", { shell: true, encoding: "utf-8" }).stdout || "";
      const lines = output.split("\n");
      const pids = new Set<string>();
      for (const line of lines) {
        if (line.includes(`:${port}`) && line.includes("LISTENING")) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== "0") {
            pids.add(pid);
          }
        }
      }
      for (const pid of pids) {
        console.log(`[gate-runner] Releasing stale process ${pid} on port ${port}...`);
        spawnSync(`taskkill /F /PID ${pid}`, { shell: true, stdio: "ignore" });
      }
    } catch {
      // Ignore if no process or permission denied
    }
  }
}

async function main(): Promise<void> {
  console.log("==================================================================");
  console.log(" VOIDTECH SOLUTION — Production Visual Integrity Release Gate");
  console.log(" Milestone: Task 10.1.5.2.1 (Closure Audit)");
  console.log(" Dedicated Port:", GATE_PORT);
  console.log("==================================================================");

  // 1. Safety verification
  checkDatabaseSafety();

  // 2. Preflight port check
  const inUse = await isPortInUse(GATE_PORT);
  if (inUse) {
    console.log(`[gate-runner] Port ${GATE_PORT} is currently in use. Cleaning up...`);
    killPortProcess(GATE_PORT);
    // Allow brief settle time
    await new Promise((r) => setTimeout(r, 1000));
  }

  // 3. Build step
  console.log("\n[1/3] Building Next.js production bundle...");
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const buildResult = spawnSync(
    `${npxCmd} next build`,
    {
      shell: true,
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "production",
      },
    }
  );

  if (buildResult.status !== 0) {
    console.error("\n[gate-runner] ERROR: Next.js build failed with exit code:", buildResult.status);
    process.exit(buildResult.status ?? 1);
  }

  console.log("\n[2/3] Executing Playwright production visual integrity test suite...");
  // 4. Run Playwright gate test suite
  const testResult = spawnSync(
    `${npxCmd} playwright test --config=playwright.gate.config.ts`,
    {
      shell: true,
      stdio: "inherit",
      env: {
        ...process.env,
        GATE_PORT: String(GATE_PORT),
        NODE_ENV: "production",
      },
    }
  );

  // 5. Post-test cleanup
  console.log("\n[3/3] Performing post-test teardown verification...");
  const stillInUse = await isPortInUse(GATE_PORT);
  if (stillInUse) {
    console.log(`[gate-runner] Cleaning up remaining listener on port ${GATE_PORT}...`);
    killPortProcess(GATE_PORT);
  }

  if (testResult.status === 0) {
    console.log("\n==================================================================");
    console.log(" RELEASE GATE: PASS");
    console.log(" All visual integrity and production rendering assertions passed.");
    console.log("==================================================================");
  } else {
    console.error("\n==================================================================");
    console.error(" RELEASE GATE: FAIL");
    console.error(" One or more release gate assertions failed. Exit code:", testResult.status);
    console.error("==================================================================");
  }

  process.exit(testResult.status ?? 1);
}

main().catch((err) => {
  console.error("Fatal runner error:", err);
  process.exit(1);
});
