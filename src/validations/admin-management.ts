import { z } from "zod";

/**
 * Validation schema for provisioning a new administrator.
 * Note: SUPER_ADMIN is strictly disallowed; only ADMIN or EDITOR can be provisioned.
 */
export const createAdminSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address")
    .max(255, "Email cannot exceed 255 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),
  role: z.enum(["ADMIN", "EDITOR"], {
    errorMap: () => ({ message: "Only ADMIN or EDITOR roles can be assigned." }),
  }),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;

/**
 * Validation schema for updating an administrator's role.
 * Note: SUPER_ADMIN is strictly disallowed as a target role.
 */
export const updateAdminRoleSchema = z.object({
  targetUserId: z.string().trim().min(1, "Target user ID is required"),
  role: z.enum(["ADMIN", "EDITOR"], {
    errorMap: () => ({ message: "Target role must be either ADMIN or EDITOR. Promoting to SUPER_ADMIN is forbidden." }),
  }),
});

export type UpdateAdminRoleInput = z.infer<typeof updateAdminRoleSchema>;

/**
 * Validation schema for updating an administrator's active status.
 */
export const setAdminStatusSchema = z.object({
  targetUserId: z.string().trim().min(1, "Target user ID is required"),
  isActive: z.boolean(),
});

export type SetAdminStatusInput = z.infer<typeof setAdminStatusSchema>;

