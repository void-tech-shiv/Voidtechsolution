import { prisma } from "@/lib/prisma";
import type { AdminUser, UserRole, Prisma } from "@prisma/client";
import { revokeAllUserSessions } from "@/server/security/session";

/**
 * Retrieves an administrator user by email (case-insensitive).
 */
export async function getAdminByEmail(email: string): Promise<AdminUser | null> {
  return await prisma.adminUser.findFirst({
    where: {
      email: {
        equals: email.trim().toLowerCase(),
        mode: "insensitive",
      },
    },
  });
}

/**
 * Retrieves an administrator user by their unique ID.
 */
export async function getAdminById(id: string): Promise<AdminUser | null> {
  return await prisma.adminUser.findUnique({
    where: { id },
  });
}

/**
 * Creates a new administrator user.
 */
export async function createAdminUser(data: {
  email: string;
  passwordHash: string;
  name: string;
  role?: UserRole;
}): Promise<AdminUser> {
  return await prisma.adminUser.create({
    data: {
      email: data.email.trim().toLowerCase(),
      passwordHash: data.passwordHash,
      name: data.name.trim(),
      role: data.role || "ADMIN",
      isActive: true,
    },
  });
}

/**
 * Updates an admin user's last login timestamp.
 */
export async function updateLastLogin(id: string): Promise<AdminUser> {
  return await prisma.adminUser.update({
    where: { id },
    data: {
      lastLoginAt: new Date(),
    },
  });
}

/**
 * Updates an admin user's password and revokes all active sessions.
 * Security: Prevents compromised accounts from retaining active sessions after a password change.
 */
export async function updateAdminPassword(
  userId: string,
  newPasswordHash: string
): Promise<AdminUser> {
  const updated = await prisma.adminUser.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });
  await revokeAllUserSessions(userId);
  return updated;
}

/**
 * Updates an admin user's role and revokes all active sessions.
 * Security: Guarantees that privilege elevation or demotion takes effect immediately.
 */
export async function updateAdminRole(
  userId: string,
  role: UserRole
): Promise<AdminUser> {
  const updated = await prisma.adminUser.update({
    where: { id: userId },
    data: { role },
  });
  await revokeAllUserSessions(userId);
  return updated;
}

/**
 * Updates an admin user's active status.
 * Security: When deactivated, all active sessions are immediately revoked in PostgreSQL.
 */
export async function setAdminActiveStatus(
  userId: string,
  isActive: boolean
): Promise<AdminUser> {
  const updated = await prisma.adminUser.update({
    where: { id: userId },
    data: { isActive },
  });
  if (!isActive) {
    await revokeAllUserSessions(userId);
  }
  return updated;
}

/**
 * Updates an admin user's details.
 */
export async function updateAdminUser(
  id: string,
  data: Prisma.AdminUserUpdateInput
): Promise<AdminUser> {
  return await prisma.adminUser.update({
    where: { id },
    data,
  });
}

/**
 * Retrieves all administrator accounts for the admin team list.
 */
export async function getAllAdmins(): Promise<Omit<AdminUser, "passwordHash">[]> {
  return await prisma.adminUser.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
