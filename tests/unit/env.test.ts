import { describe, it, expect } from "vitest";
import { validateAppEnvironment } from "@/config/env";
import { hashPassword, verifyPassword } from "@/server/security/password";

describe("Phase 3: Environment Validation & Security Configuration", () => {
  it("validates valid application environment configuration in development", () => {
    const config = validateAppEnvironment({
      DATABASE_URL: "postgresql://postgres:localpass@localhost:5432/voidtech_dev?schema=public",
      DIRECT_URL: "postgresql://postgres:localpass@localhost:5432/voidtech_dev?schema=public",
      AUTH_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      OTP_PEPPER_SECRET: "otp_pepper_super_secure_key_123456",
      ADMIN_EMAIL: "admin@voidtechsolution.com",
      SMTP_HOST: "smtp.mailgun.org",
      SMTP_PORT: "587",
      SMTP_SECURE: "false",
      SMTP_USER: "postmaster@voidtechsolution.com",
      SMTP_PASS: "strong_smtp_secret_pass",
      SMTP_FROM_NAME: "VOIDTECH SOLUTION",
      SMTP_FROM_EMAIL: "notifications@voidtechsolution.com",
      ADMIN_ALERT_EMAIL: "admin@voidtechsolution.com",
      NEXT_PUBLIC_SITE_URL: "https://voidtechsolution.com",
      NODE_ENV: "development",
    });

    expect(config.DATABASE_URL).toContain("voidtech_dev");
    expect(config.AUTH_SECRET).toHaveLength(64);
    expect(config.SMTP_PORT).toBe(587);
    expect(config.SMTP_SECURE).toBe(false);
    expect(config.NODE_ENV).toBe("development");
  });

  it("enforces minimum 32 characters for AUTH_SECRET", () => {
    expect(() =>
      validateAppEnvironment({
        AUTH_SECRET: "too-short-secret",
      })
    ).toThrow("AUTH_SECRET must be at least 32 characters");
  });

  it("enforces strict production checks against development dummy secrets", () => {
    expect(() =>
      validateAppEnvironment({
        DATABASE_URL: "postgresql://user:password@localhost:5432/voidtech_db?schema=public",
        DIRECT_URL: "postgresql://user:password@localhost:5432/voidtech_db?schema=public",
        AUTH_SECRET: "dev-secret-local-development-only-minimum-32-chars-long",
        SMTP_PASS: "voidtech_smtp_dummy_secret",
        NODE_ENV: "production",
      })
    ).toThrow("Environment validation failed");
  });

  it("passes production validation when real hosted credentials are provided", () => {
    const config = validateAppEnvironment({
      DATABASE_URL: "postgresql://voidtech_prod_user:p4ssw0rd@ep-prod-db-1234.us-east-1.neon.tech/voidtech_prod?sslmode=require&pgbouncer=true",
      DIRECT_URL: "postgresql://voidtech_prod_user:p4ssw0rd@ep-prod-db-1234.us-east-1.neon.tech/voidtech_prod?sslmode=require",
      AUTH_SECRET: "cadeb23351137bce0c5d611415243b45ec2cbf561822c3d0a155317c0398846c",
      OTP_PEPPER_SECRET: "fa535c31af521c70c683e35916287dbc987a922bead405a46dcd48e435b9acfb",
      ADMIN_EMAIL: "admin@voidtechsolution.com",
      SMTP_HOST: "smtp.gmail.com",
      SMTP_PORT: "587",
      SMTP_SECURE: "false",
      SMTP_USER: "agency@voidtechsolution.com",
      SMTP_PASS: "real_16_char_app_password",
      SMTP_FROM_NAME: "VOIDTECH SOLUTION",
      SMTP_FROM_EMAIL: "notifications@voidtechsolution.com",
      ADMIN_ALERT_EMAIL: "admin@voidtechsolution.com",
      NEXT_PUBLIC_SITE_URL: "https://voidtechsolution.com",
      NODE_ENV: "production",
    });

    expect(config.NODE_ENV).toBe("production");
    expect(config.SMTP_HOST).toBe("smtp.gmail.com");
  });
});

describe("Phase 3: Cryptographic Password Hashing & Verification (Scrypt)", () => {
  it("hashes password with unique cryptographically secure salt", () => {
    const pwd = "SuperSecureAdminPassword2026!";
    const hash1 = hashPassword(pwd);
    const hash2 = hashPassword(pwd);

    expect(hash1).not.toBe(hash2); // Different salts ensure unique hashes
    expect(hash1).toContain(":");
    expect(hash1.split(":")).toHaveLength(2);
  });

  it("verifies correct password against scrypt hash", () => {
    const pwd = "CorrectPassword123#";
    const hash = hashPassword(pwd);

    expect(verifyPassword(pwd, hash)).toBe(true);
  });

  it("rejects incorrect password", () => {
    const pwd = "CorrectPassword123#";
    const hash = hashPassword(pwd);

    expect(verifyPassword("WrongPassword123#", hash)).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    expect(() => hashPassword("short")).toThrow("Password must be at least 8 characters");
  });

  it("handles malformed stored hashes gracefully without throwing exceptions", () => {
    expect(verifyPassword("password", "invalid-hash-string")).toBe(false);
    expect(verifyPassword("password", "")).toBe(false);
  });
});
