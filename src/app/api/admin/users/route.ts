import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateAdminSession, SESSION_COOKIE_NAME } from "@/server/security/session";
import { getAllAdmins, createAdminUser } from "@/server/repositories/users.repo";
import { hashPassword } from "@/server/security/password";
import { requirePermission, AuthorizationError, ExactlyOneSuperAdminError } from "@/server/security/rbac";
import { createAdminSchema } from "@/validations/admin-management";
import { validateRequestOrigin } from "@/server/security/origin";
import type { ApiResponse } from "@/types";
import type { UserRole } from "@prisma/client";

/**
 * GET /api/admin/users
 * Retrieves all administrator accounts.
 * Authorization: Restricted to SUPER_ADMIN (admins:manage permission).
 */
export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      const response: ApiResponse = {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
      };
      return NextResponse.json(response, { status: 401 });
    }

    const sessionResult = await validateAdminSession(sessionToken);
    if (!sessionResult.isValid) {
      const response: ApiResponse = {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid or expired session." },
      };
      return NextResponse.json(response, { status: 401 });
    }

    // RBAC Authorization Gate
    requirePermission(sessionResult.user, "admins:manage");

    const admins = await getAllAdmins();
    const response: ApiResponse = {
      success: true,
      data: { admins },
      meta: { timestamp: new Date().toISOString() },
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      const response: ApiResponse = {
        success: false,
        error: { code: error.code, message: error.message },
      };
      return NextResponse.json(response, { status: error.statusCode });
    }

    const response: ApiResponse = {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to retrieve administrators." },
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Provisions a new administrator account (ADMIN or EDITOR).
 * Authorization: Restricted strictly to SUPER_ADMIN.
 */
export async function POST(request: NextRequest) {
  try {
    if (!validateRequestOrigin(request.headers)) {
      const response: ApiResponse = {
        success: false,
        error: { code: "FORBIDDEN", message: "Cross-origin request rejected." },
      };
      return NextResponse.json(response, { status: 403 });
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      const response: ApiResponse = {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
      };
      return NextResponse.json(response, { status: 401 });
    }

    const sessionResult = await validateAdminSession(sessionToken);
    if (!sessionResult.isValid) {
      const response: ApiResponse = {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid or expired session." },
      };
      return NextResponse.json(response, { status: 401 });
    }

    // RBAC Authorization Gate
    requirePermission(sessionResult.user, "admins:manage");

    const body = await request.json();
    const parsed = createAdminSchema.safeParse(body);
    if (!parsed.success) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message || "Invalid input data.",
          details: parsed.error.issues,
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const { name, email, password, role } = parsed.data;
    const passwordHash = hashPassword(password);

    const newUser = await createAdminUser(
      {
        email,
        passwordHash,
        name,
        role: role as UserRole,
      },
      sessionResult.user
    );

    const { passwordHash: _, ...safeUser } = newUser;
    const response: ApiResponse = {
      success: true,
      data: { user: safeUser },
      meta: { timestamp: new Date().toISOString() },
    };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError || error instanceof ExactlyOneSuperAdminError) {
      const response: ApiResponse = {
        success: false,
        error: { code: error.code, message: error.message },
      };
      return NextResponse.json(response, { status: error.statusCode });
    }

    const response: ApiResponse = {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to create administrator." },
    };
    return NextResponse.json(response, { status: 500 });
  }
}

