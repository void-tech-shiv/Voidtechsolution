import readline from "node:readline";
import path from "node:path";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/server/security/password";
import { createAdminUser, getAdminByEmail } from "@/server/repositories/users.repo";
import { recordAuditEvent, AUDIT_ACTIONS } from "@/server/security/audit";
import { ExactlyOneSuperAdminError } from "@/server/security/rbac";

/**
 * VOIDTECH SOLUTION — Initial SUPER_ADMIN Provisioning CLI
 * 
 * Strict Security Invariants:
 * 1. Exactly One SUPER_ADMIN: Only creates an account if ZERO SUPER_ADMIN accounts exist.
 * 2. Controlled CLI Execution: Must be interactively executed by the owner (npm run admin:create).
 *    Never automatically executed on install, build, seed, or deploy.
 * 3. Scrypt Password Hashing: Uses cryptographically secure random salt and scrypt algorithm.
 * 4. Hidden Terminal Input: Passwords are typed invisibly; never echoed to terminal or logs.
 * 5. Atomic Transaction & Audit Log: Records ADMIN_BOOTSTRAP_SUCCESS atomically inside
 *    the concurrency-safe PostgreSQL advisory transaction lock.
 */

// Schema enforcing strong password standards for initial master account
export const bootstrapInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters long")
      .max(100, "Full name cannot exceed 100 characters"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid, fully-formed email address")
      .max(255, "Email cannot exceed 255 characters"),
    password: z
      .string()
      .min(12, "Master password must be at least 12 characters long")
      .max(128, "Master password cannot exceed 128 characters")
      .regex(/[A-Z]/, "Password must include at least one uppercase letter")
      .regex(/[a-z]/, "Password must include at least one lowercase letter")
      .regex(/[0-9]/, "Password must include at least one numerical digit")
      .regex(/[^A-Za-z0-9]/, "Password must include at least one special character / symbol"),
    confirmPassword: z.string().min(1, "Please confirm the master password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password confirmation does not match the entered password.",
    path: ["confirmPassword"],
  });

export type BootstrapInput = z.infer<typeof bootstrapInputSchema>;

/**
 * Prompts user for text with standard visible terminal input.
 */
export function promptVisible(
  rl: readline.Interface,
  question: string
): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Error thrown when password prompt is executed in a non-interactive or non-TTY environment.
 * Prevents plain-text echoing or leaking master credentials over piped/redirected stdin.
 */
export class NonInteractiveTerminalError extends Error {
  constructor(
    message = "Hidden password entry requires an interactive TTY terminal. Scripted pipes, redirected input, or non-TTY environments are prohibited for master password entry to prevent credential exposure."
  ) {
    super(message);
    this.name = "NonInteractiveTerminalError";
  }
}

/**
 * Prompts user for hidden input (e.g. password) without echoing characters to screen.
 * Strictly requires an interactive TTY with raw mode capability. Never falls back to visible input.
 * Handles Backspace, Enter, Ctrl+C, and restores raw mode safely across platforms.
 */
export async function promptHidden(question: string): Promise<string> {
  const stdin = process.stdin;

  // Strict Security Policy: If hidden input cannot be guaranteed, ABORT immediately.
  // Never fall back to visible readline input for passwords.
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new NonInteractiveTerminalError();
  }

  return new Promise((resolve, reject) => {
    process.stdout.write(question);
    stdin.setEncoding("utf8");
    const wasRaw = stdin.isRaw;
    let isCleanedUp = false;

    const restoreTerminal = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      try {
        stdin.removeListener("data", onData);
        if (typeof stdin.setRawMode === "function") {
          stdin.setRawMode(wasRaw ?? false);
        }
        stdin.pause();
      } catch {
        // Suppress cleanup errors on process termination
      }
    };

    let input = "";

    const onData = (chunk: Buffer | string) => {
      try {
        const str = chunk.toString();
        for (let i = 0; i < str.length; i++) {
          const char = str[i];
          if (!char) continue;

          // Enter key (CR or LF)
          if (char === "\r" || char === "\n") {
            restoreTerminal();
            process.stdout.write("\n");
            resolve(input);
            return;
          }

          // Backspace (\b or DEL \x7f)
          if (char === "\u0008" || char === "\x7f") {
            if (input.length > 0) {
              input = input.slice(0, -1);
            }
          }
          // Ctrl+C (Interrupt \u0003)
          else if (char === "\u0003") {
            restoreTerminal();
            process.stdout.write("\n\n[PROVISIONING ABORTED BY USER]\n");
            process.exit(130);
          }
          // Regular printable characters
          else if (char >= " " && char <= "~") {
            input += char;
          }
        }
      } catch (err) {
        restoreTerminal();
        reject(err);
      }
    };

    // Guarantee terminal settings are restored even if the process exits unexpectedly
    const exitHandler = () => restoreTerminal();
    process.once("exit", exitHandler);

    try {
      stdin.setRawMode(true);
      stdin.resume();
      stdin.on("data", onData);
    } catch (err) {
      restoreTerminal();
      process.removeListener("exit", exitHandler);
      reject(
        new NonInteractiveTerminalError(
          `Failed to configure terminal raw mode: ${
            err instanceof Error ? err.message : String(err)
          }`
        )
      );
    }
  });
}

export interface InvariantCheckResult {
  ready: boolean;
  superAdminCount: number;
  error?: string;
}

/**
 * Verifies database connectivity and checks the Exactly One SUPER_ADMIN invariant.
 */
export async function checkDatabaseAndInvariant(): Promise<InvariantCheckResult> {
  try {
    // 1. Check raw database connection
    await prisma.$queryRaw`SELECT 1`;

    // 2. Query existing SUPER_ADMIN accounts
    const superAdminCount = await prisma.adminUser.count({
      where: { role: "SUPER_ADMIN" },
    });

    return {
      ready: true,
      superAdminCount,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown database error";
    // Avoid leaking credentials in connection errors
    const sanitizedMsg = message.replace(
      /postgresql:\/\/[^@]+@/gi,
      "postgresql://[REDACTED_CREDENTIALS]@"
    );
    return {
      ready: false,
      superAdminCount: 0,
      error: sanitizedMsg,
    };
  }
}

export interface ExecuteBootstrapResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  error?: string;
}

/**
 * Executes initial administrator creation with concurrency lock and audit event.
 */
export async function executeBootstrap(
  input: BootstrapInput
): Promise<ExecuteBootstrapResult> {
  // Validate input schema
  const parsed = bootstrapInputSchema.safeParse(input);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join("\n- ");
    return {
      success: false,
      error: `Validation error:\n- ${errorMsg}`,
    };
  }

  const { name, email, password } = parsed.data;

  try {
    // Check if email already exists
    const existing = await getAdminByEmail(email);
    if (existing) {
      return {
        success: false,
        error: `An administrator account with email '${email}' already exists.`,
      };
    }

    // Hash password with cryptographically secure salt and scrypt
    const passwordHash = hashPassword(password);

    // Create SUPER_ADMIN with bootstrap flag holding the advisory lock
    const createdUser = await createAdminUser(
      {
        name,
        email,
        passwordHash,
        role: "SUPER_ADMIN",
      },
      undefined,
      { isBootstrap: true }
    );

    // Audit logging is recorded inside createAdminUser transaction, but record supplementary log if needed
    try {
      await recordAuditEvent({
        action: AUDIT_ACTIONS.ADMIN_BOOTSTRAP_SUCCESS,
        entity: "AdminUser",
        entityId: createdUser.id,
        actorId: createdUser.id,
        actorEmail: createdUser.email,
        userAgent: "CLI Bootstrap",
        details: {
          role: createdUser.role,
          name: createdUser.name,
          email: createdUser.email,
          isBootstrap: true,
        },
      });
    } catch {
      // Non-fatal if supplementary log fails as primary is in transaction
    }

    return {
      success: true,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        role: createdUser.role,
      },
    };
  } catch (err) {
    if (err instanceof ExactlyOneSuperAdminError) {
      return {
        success: false,
        error: err.message,
      };
    }
    const msg = err instanceof Error ? err.message : "Failed to create administrator account";
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Main interactive CLI entrypoint.
 */
export async function runBootstrapCli(): Promise<number> {
  const line = "=".repeat(49);
  console.log(`\n${line}`);
  console.log("          VOIDTECH SOLUTION");
  console.log("       INITIAL ADMIN PROVISIONING");
  console.log(`${line}\n`);

  console.log("Checking database connection...\n");
  const check = await checkDatabaseAndInvariant();

  if (!check.ready) {
    console.error(`[DATABASE ERROR] Could not connect to database.`);
    if (check.error) {
      console.error(`Details: ${check.error}`);
    }
    console.error("\nPlease verify DATABASE_URL in your .env configuration.\n");
    return 1;
  }

  console.log("Database connection: READY\n");
  console.log("Checking SUPER_ADMIN invariant...\n");

  if (check.superAdminCount > 0) {
    console.error(`[INVARIANT VIOLATION] Existing SUPER_ADMIN account found (${check.superAdminCount}).`);
    console.error("The system business policy strictly permits EXACTLY ONE SUPER_ADMIN account.");
    console.error("Additional administrator accounts (ADMIN / EDITOR) must be created by the");
    console.error("existing SUPER_ADMIN via the console portal at /admin/users.\n");
    console.log(`${line}\n`);
    return 1;
  }

  console.log("No existing SUPER_ADMIN found.\n");

  // Strict check: Abort if stdin is not a TTY capable of raw mode hidden input
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    console.error("[SECURITY ERROR] Interactive TTY required for administrator provisioning.");
    console.error("Non-interactive environments, piped stdin, or redirected input are strictly prohibited");
    console.error("to guarantee that master password entry is never displayed, logged, or echoed.\n");
    console.log(`${line}\n`);
    return 1;
  }

  console.log("Enter initial administrator details:\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const name = await promptVisible(rl, "Full Name: ");
    const email = await promptVisible(rl, "Email Address: ");

    // Close readline before switching to raw mode for password inputs
    rl.close();

    console.log("");
    let password = "";
    let confirmPassword = "";
    try {
      password = await promptHidden("Password (min 12 chars, upper/lower/num/symbol): ");
      confirmPassword = await promptHidden("Confirm Password: ");
    } catch (err) {
      if (err instanceof NonInteractiveTerminalError) {
        console.error(`\n[SECURITY ERROR] ${err.message}\n`);
        console.log(`${line}\n`);
        return 1;
      }
      throw err;
    }

    console.log("\nValidating credentials...");
    const validation = bootstrapInputSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!validation.success) {
      console.error("\n[VALIDATION FAILED]");
      for (const issue of validation.error.issues) {
        console.error(`- ${issue.message}`);
      }
      console.log(`\n${line}\n`);
      return 1;
    }

    console.log("\nCreating SUPER_ADMIN account...");
    console.log("Recording bootstrap audit event...\n");

    const result = await executeBootstrap({
      name,
      email,
      password,
      confirmPassword,
    });

    // Zero out memory references immediately
    password = "";
    confirmPassword = "";

    if (!result.success || !result.user) {
      console.error(`\n[BOOTSTRAP FAILED] ${result.error || "Unknown error"}\n`);
      console.log(`${line}\n`);
      return 1;
    }

    console.log(line);
    console.log("       SUPER_ADMIN CREATED SUCCESSFULLY");
    console.log(line);
    console.log(`\nAdministrator ID: ${result.user.id}`);
    console.log(`Name:             ${result.user.name}`);
    console.log(`Email:            ${result.user.email}`);
    console.log(`Role:             ${result.user.role}`);
    console.log("Status:           ACTIVE");
    console.log("\nYou can now sign in at:\n");
    console.log("/admin/login\n");
    console.log(`${line}\n`);

    return 0;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Fatal error";
    console.error(`\n[FATAL ERROR] ${msg}\n`);
    return 1;
  } finally {
    await prisma.$disconnect();
  }
}

// Auto-run if executed directly via tsx/node
const currentFile = path.resolve(process.argv[1] || "");
if (currentFile.replace(/\\/g, "/").endsWith("scripts/create-admin.ts")) {
  runBootstrapCli()
    .then((exitCode) => {
      process.exit(exitCode);
    })
    .catch((err) => {
      console.error("Unhandled CLI exception:", err);
      process.exit(1);
    });
}
