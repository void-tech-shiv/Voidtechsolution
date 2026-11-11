import { prisma } from "@/lib/prisma";
import type { AdminUser, UserRole, Prisma } from "@prisma/client";

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
