import { spawn, spawnSync, ChildProcess } from "child_process";
import * as net from "net";

/**
 * Task 10.1.5.2.2 — Safe Production Release Gate Runner
 *
 * Enforces:
 * 1. Safe execution environment (verified local/test database, zero Neon access).
 * 2. Safe port occupancy inspection (NEVER kills arbitrary or unrelated processes).
 * 3. Fresh production build (next build) with owned process tracking.
 * 4. Isolated production server execution via Playwright webServer on dedicated port (3005).
 * 5. Deterministic lifecycle management (clean termination of owned child processes on SIGINT/SIGTERM/errors).
 * 6. Non-masking error propagation and artifact preservation.
 */

export const GATE_PORT = parseInt(process.env.GATE_PORT || "3005", 10);

export function checkDatabaseSafety(dbUrl?: string): void {
  const url = dbUrl ?? process.env.DATABASE_URL ?? "";
  if (url.includes("neon.tech") || url.includes("aws.neon.tech")) {
    throw new Error("FATAL: DATABASE_URL is configured for production Neon. Aborting visual gate.");
  }
}

export function isPortInUse(port: number, host = "127.0.0.1"): Promise<boolean> {
  return new Promise((resolve) => {
    // 1. Probe for an active listening connection
    const socket = new net.Socket();
    let settled = false;

    const cleanup = () => {
      socket.removeAllListeners();
      socket.destroy();
    };

    socket.setTimeout(250);

    socket.once("connect", () => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(true);
      }
    });

    const fallbackBindTest = () => {
      const server = net.createServer();
      server.once("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE" || err.code === "EACCES") {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      server.once("listening", () => {
        server.close(() => resolve(false));
      });
      server.listen(port, host);
    };

    socket.once("timeout", () => {
      if (!settled) {
        settled = true;
        cleanup();
        fallbackBindTest();
      }
    });

    socket.once("error", () => {
      if (!settled) {
        settled = true;
        cleanup();
        fallbackBindTest();
      }
    });

    socket.connect(port, host);
  });
}

export interface PortOccupant {
  pid: number;
  processName: string;
}

export function getPortOccupant(port: number): PortOccupant | null {
  if (process.platform === "win32") {
    try {
      const netstatOutput = spawnSync("netstat", ["-ano", "-p", "tcp"], {
        encoding: "utf-8",
      }).stdout || "";

      for (const line of netstatOutput.split("\n")) {
        if (line.includes(`:${port}`) && line.includes("LISTENING")) {
          const parts = line.trim().split(/\s+/);
          const pidStr = parts[parts.length - 1];
          if (!pidStr) continue;
          const pid = parseInt(pidStr, 10);
          if (!isNaN(pid) && pid > 0) {
            let processName = "Unknown";
            try {
              const tasklistOutput = spawnSync("tasklist", [
                "/FI", `PID eq ${pid}`,
                "/FO", "CSV",
                "/NH",
              ], { encoding: "utf-8" }).stdout || "";

              const match = tasklistOutput.match(/"([^"]+)"/);
              if (match && match[1]) {
                processName = match[1];
              }
            } catch {
              // Ignore tasklist inspection failure
            }
            return { pid, processName };
          }
        }
      }
    } catch {
      // Fallback
    }
  }
  return null;
}

// Active owned child process reference
let activeChildProcess: ChildProcess | null = null;

function killOwnedProcess(child: ChildProcess | null): void {
  if (!child || child.killed || !child.pid) return;

  try {
    if (process.platform === "win32") {
      // Terminate only this owned child process and its immediate subprocess tree (/T)
      spawnSync("taskkill", ["/F", "/T", "/PID", String(child.pid)], { stdio: "ignore" });
    } else {
      child.kill("SIGTERM");
    }
  } catch {
    // Process may have already exited
  }
}

function setupSignalHandlers(): void {
  const onSignal = (signal: NodeJS.Signals) => {
    console.warn(`\n[gate-runner] Received ${signal}. Terminating owned child processes...`);
    if (activeChildProcess) {
      killOwnedProcess(activeChildProcess);
      activeChildProcess = null;
    }
    process.exit(130);
  };

  process.once("SIGINT", () => onSignal("SIGINT"));
  process.once("SIGTERM", () => onSignal("SIGTERM"));
}

function runCommand(commandLine: string, env: NodeJS.ProcessEnv): Promise<number> {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    const child = spawn(commandLine, {
      stdio: "inherit",
      env,
      shell: isWindows,
    });

    activeChildProcess = child;

    child.on("error", (err) => {
      activeChildProcess = null;
      reject(err);
    });

    child.on("close", (code) => {
      activeChildProcess = null;
      resolve(code ?? 0);
    });
  });
}

export async function runReleaseGate(): Promise<number> {
  console.log("==================================================================");
  console.log(" VOIDTECH SOLUTION — Production Visual Integrity Release Gate");
  console.log(" Milestone: Task 10.1.5.2.2 (Safety & Verification Closure)");
  console.log(" Dedicated Port:", GATE_PORT);
  console.log("==================================================================");

  // 1. Absolute Database Safety Invariant
  checkDatabaseSafety();

  // 2. Safe Preflight Port Occupancy Check (Zero arbitrary killing)
  const portOccupied = await isPortInUse(GATE_PORT);
  if (portOccupied) {
    const occupant = getPortOccupant(GATE_PORT);
    console.error(`\n[gate-runner] FATAL: Dedicated release gate port ${GATE_PORT} is already in use.`);
    if (occupant) {
      console.error(
        `[gate-runner] Occupancy Diagnostic: Process '${occupant.processName}' (PID ${occupant.pid}) is listening on port ${GATE_PORT}.`
      );
    } else {
      console.error(`[gate-runner] Occupancy Diagnostic: An unidentified process is listening on port ${GATE_PORT}.`);
    }
    console.error("[gate-runner] Safety Policy: The release gate runner NEVER terminates arbitrary or external processes.");
    console.error("[gate-runner] Suggested Resolution:");
    console.error(`  1. Terminate or reconfigure the application listening on port ${GATE_PORT}, or`);
    console.error(`  2. Specify an alternate port via environment variable:`);
    console.error(`     GATE_PORT=3006 npm run test:gate\n`);
    return 1;
  }

  setupSignalHandlers();

  let buildExitCode = 0;
  let testExitCode = 0;
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";

  try {
    // 3. Build step (Fresh Next.js production bundle)
    console.log("\n[1/3] Building Next.js production bundle...");
    buildExitCode = await runCommand(`${npxCmd} next build`, {
      ...process.env,
      NODE_ENV: "production",
    });

    if (buildExitCode !== 0) {
      console.error(`\n[gate-runner] ERROR: Next.js build failed with exit code: ${buildExitCode}`);
      return buildExitCode;
    }

    // 4. Test step (Playwright manages production webServer on GATE_PORT with reuseExistingServer: false)
    console.log("\n[2/3] Executing Playwright production visual integrity test suite...");
    testExitCode = await runCommand(
      `${npxCmd} playwright test --config=playwright.gate.config.ts`,
      {
        ...process.env,
        GATE_PORT: String(GATE_PORT),
        NODE_ENV: "production",
      }
    );
  } catch (err) {
    console.error("\n[gate-runner] Unexpected runner error:", err);
    testExitCode = 1;
  } finally {
    // 5. Post-test Teardown Verification
    console.log("\n[3/3] Performing post-test teardown verification...");
    if (activeChildProcess) {
      killOwnedProcess(activeChildProcess);
      activeChildProcess = null;
    }

    // Verify port is free
    const stillOccupied = await isPortInUse(GATE_PORT);
    if (stillOccupied) {
      const occupant = getPortOccupant(GATE_PORT);
      console.warn(
        `[gate-runner] WARNING: Port ${GATE_PORT} remains occupied after Playwright webServer shutdown.`
      );
      if (occupant) {
        console.warn(`[gate-runner] Occupant PID: ${occupant.pid} (${occupant.processName})`);
      }
    } else {
      console.log(`[gate-runner] Verified port ${GATE_PORT} is cleanly freed. Teardown verified.`);
    }
  }

  // 6. Summary and Verdict
  if (testExitCode === 0 && buildExitCode === 0) {
    console.log("\n==================================================================");
    console.log(" RELEASE GATE: PASS");
    console.log(" All visual integrity and production rendering assertions passed.");
    console.log("==================================================================");
  } else {
    console.error("\n==================================================================");
    console.error(" RELEASE GATE: FAIL");
    console.error(` One or more release gate steps failed (exit code: ${testExitCode || buildExitCode}).`);
    console.error(" Test reports and screenshot artifacts have been preserved in test-results/.");
    console.error("==================================================================");
  }

  return testExitCode || buildExitCode;
}

if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
  runReleaseGate()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error("Fatal runner crash:", err);
      process.exit(1);
    });
}
