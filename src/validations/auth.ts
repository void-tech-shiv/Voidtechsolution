import { z } from "zod";

/**
 * VOIDTECH SOLUTION — Admin Authentication Zod Validation Schemas
 * Enforces strict typing, input lengths, and sanitization to prevent DoS via oversized payloads.
 */

export const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address format")
    .max(255, "Email cannot exceed 255 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),
  rememberMe: z.boolean().default(false).optional(),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address format")
    .max(255, "Email cannot exceed 255 characters"),
});

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

export const passwordResetConfirmSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password cannot exceed 128 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password confirmation must be at least 8 characters")
      .max(128, "Password confirmation cannot exceed 128 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
