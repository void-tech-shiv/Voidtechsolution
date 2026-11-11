import { describe, it, expect, vi, beforeEach } from "vitest";
import { getEmailConfig } from "@/server/email/config";
import {
  verifySmtpConnection,
  resetSmtpTransporter,
} from "@/server/email/transporter";
import {
  sendEmail,
  sendOtpEmail,
} from "@/server/email/email.service";
import {
  renderOtpVerificationEmail,
  renderPasswordResetEmail,
  renderEnquiryConfirmationEmail,
  renderEnquiryAdminAlertEmail,
  renderEnquiryStatusUpdateEmail,
  renderSecurityNotificationEmail,
} from "@/server/email/templates";
import type { Transporter } from "nodemailer";

describe("Phase 3: Nodemailer SMTP Configuration & Validation", () => {
  it("validates valid SMTP environment configuration", () => {
    const config = getEmailConfig({
      SMTP_HOST: "smtp.mailgun.org",
      SMTP_PORT: "465",
      SMTP_SECURE: "true",
      SMTP_USER: "api_user",
      SMTP_PASS: "super_secret_smtp_password",
      SMTP_FROM_NAME: "VOIDTECH SOLUTION",
      SMTP_FROM_EMAIL: "support@voidtechsolution.com",
      ADMIN_ALERT_EMAIL: "admin@voidtechsolution.com",
    });

    expect(config.SMTP_HOST).toBe("smtp.mailgun.org");
    expect(config.SMTP_PORT).toBe(465);
    expect(config.SMTP_SECURE).toBe(true);
    expect(config.SMTP_USER).toBe("api_user");
    expect(config.SMTP_PASS).toBe("super_secret_smtp_password");
    expect(config.SMTP_FROM_EMAIL).toBe("support@voidtechsolution.com");
  });

  it("throws validation error when mandatory fields are missing or invalid", () => {
    expect(() =>
      getEmailConfig({
        SMTP_HOST: "",
        SMTP_USER: "",
        SMTP_PASS: "",
        SMTP_FROM_EMAIL: "invalid-email-format",
      })
    ).toThrow("SMTP configuration validation failed");
  });
});

describe("Phase 3: Email Templates Visual Identity & Content Integrity", () => {
  it("renders OTP verification template with 6-digit code and VoidTech branding", () => {
    const { subject, html, text } = renderOtpVerificationEmail({
      code: "847291",
      recipientName: "Alex Architect",
      purpose: "Super Admin Login",
      expiresInMinutes: 5,
    });

    expect(subject).toContain("847291");
    expect(html).toContain("847291");
    expect(html).toContain("VOIDTECH");
    expect(html).toContain("Build. Launch. Grow Online.");
    expect(html).toContain("Valid for 5 minutes only");
    expect(text).toContain("847291");
    expect(text).toContain("Alex Architect");
  });

  it("renders password reset template with secure link", () => {
    const resetUrl = "https://voidtechsolution.com/auth/reset-password?token=xyz789";
    const { subject, html, text } = renderPasswordResetEmail({
      resetUrl,
      recipientName: "Dev Lead",
      expiresInMinutes: 15,
    });

    expect(subject).toContain("Password Reset Request");
    expect(html).toContain(resetUrl);
    expect(html).toContain("Reset My Password");
    expect(text).toContain(resetUrl);
  });

  it("renders enquiry confirmation email with SLA guarantee", () => {
    const { subject, html, text } = renderEnquiryConfirmationEmail({
      recipientName: "Kavita Sharma",
      serviceTitle: "Enterprise ERP & CRM Development",
      enquiryId: "enq_test_123456",
    });

    expect(subject).toContain("Enquiry Received");
    expect(html).toContain("Enterprise ERP & CRM Development");
    expect(html).toContain("24 business hours");
    expect(text).toContain("Kavita Sharma");
  });

  it("renders inbound enquiry alert for internal admin notifications", () => {
    const { subject, html, text } = renderEnquiryAdminAlertEmail({
      enquiryId: "enq_lead_99",
      prospectName: "Rohan Varma",
      email: "rohan@enterprise.in",
      phone: "+91 9876543210",
      companyName: "Varma Logistics",
      serviceCategory: "ENTERPRISE_SYSTEMS",
      budgetRange: "₹50,000+",
      timeline: "1 Month",
      message: "We need custom inventory tracking and barcode scanning.",
    });

    expect(subject).toContain("[NEW LEAD]");
    expect(subject).toContain("Rohan Varma");
    expect(html).toContain("rohan@enterprise.in");
    expect(html).toContain("+91 9876543210");
    expect(html).toContain("Varma Logistics");
    expect(html).toContain("We need custom inventory tracking");
    expect(text).toContain("rohan@enterprise.in");
  });

  it("renders enquiry status update email", () => {
    const { subject, html, text } = renderEnquiryStatusUpdateEmail({
      recipientName: "Amitabh Sen",
      enquiryId: "enq_status_456",
      oldStatus: "NEW",
      newStatus: "IN_REVIEW",
      notes: "Lead architect assigned to review technical API dependencies.",
    });

    expect(subject).toContain("Update on Your Enquiry");
    expect(html).toContain("IN_REVIEW");
    expect(html).toContain("Lead architect assigned");
    expect(text).toContain("IN_REVIEW");
  });

  it("renders security notification email for account events", () => {
    const { subject, html, text } = renderSecurityNotificationEmail({
      recipientName: "Admin User",
      eventType: "NEW_ADMIN_SESSION_AUTHORIZED",
      ipAddress: "103.21.244.0",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      actionTaken: "Session token issued",
    });

    expect(subject).toContain("Security Alert");
    expect(html).toContain("NEW_ADMIN_SESSION_AUTHORIZED");
    expect(html).toContain("103.21.244.0");
    expect(text).toContain("NEW_ADMIN_SESSION_AUTHORIZED");
  });
});

describe("Phase 3: Nodemailer Transporter & Reusable Email Service", () => {
  beforeEach(() => {
    resetSmtpTransporter();
  });

  it("verifies SMTP connection using mock transporter", async () => {
    const mockSuccessTransporter = {
      verify: vi.fn().mockResolvedValue(true),
    } as unknown as Transporter;

    const isConnected = await verifySmtpConnection(mockSuccessTransporter);
    expect(isConnected).toBe(true);
    expect(mockSuccessTransporter.verify).toHaveBeenCalledTimes(1);
  });

  it("detects SMTP connection failure gracefully without unhandled exceptions", async () => {
    const mockFailTransporter = {
      verify: vi.fn().mockRejectedValue(new Error("ECONNREFUSED 127.0.0.1:587")),
    } as unknown as Transporter;

    const isConnected = await verifySmtpConnection(mockFailTransporter);
    expect(isConnected).toBe(false);
  });

  it("sends email successfully and records delivery tracking", async () => {
    const mockTransporter = {
      sendMail: vi.fn().mockResolvedValue({
        messageId: "<voidtech-msg-001@smtp.voidtechsolution.com>",
      }),
    } as unknown as Transporter;

    const result = await sendEmail({
      to: "prospect@example.com",
      subject: "Test Subject",
      html: "<p>Hello Test</p>",
      text: "Hello Test",
      templateName: "TEST_TEMPLATE",
      customTransporter: mockTransporter,
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe("<voidtech-msg-001@smtp.voidtechsolution.com>");
    expect(result.retries).toBe(0);
    expect(result.deliveryId).toBeDefined();
    expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
  });

  it("executes bounded retries on transient errors and succeeds upon retry", async () => {
    let callCount = 0;
    const mockTransporter = {
      sendMail: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error("ETIMEDOUT: Connection reset by peer"));
        }
        return Promise.resolve({
          messageId: "<voidtech-retry-success@smtp.voidtechsolution.com>",
        });
      }),
    } as unknown as Transporter;

    const result = await sendEmail({
      to: "retry-client@example.com",
      subject: "Retry Subject",
      html: "<p>Retry content</p>",
      text: "Retry content",
      templateName: "RETRY_TEST",
      customTransporter: mockTransporter,
      maxRetries: 3,
      initialBackoffMs: 1, // fast backoff for unit tests
    });

    expect(result.success).toBe(true);
    expect(result.retries).toBe(2);
    expect(mockTransporter.sendMail).toHaveBeenCalledTimes(3);
  });

  it("records failed delivery status and exhausts retries on permanent error", async () => {
    const mockTransporter = {
      sendMail: vi.fn().mockRejectedValue(new Error("550 5.1.1 User mailbox unknown")),
    } as unknown as Transporter;

    const result = await sendEmail({
      to: "nonexistent@example.com",
      subject: "Failure Subject",
      html: "<p>Content</p>",
      text: "Content",
      templateName: "FAILURE_TEST",
      customTransporter: mockTransporter,
      maxRetries: 2,
      initialBackoffMs: 1,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("550 5.1.1 User mailbox unknown");
    expect(result.retries).toBe(2);
    expect(mockTransporter.sendMail).toHaveBeenCalledTimes(3);
  });

  it("convenience dispatchers trigger typed sends seamlessly", async () => {
    const mockTransporter = {
      sendMail: vi.fn().mockResolvedValue({
        messageId: "<otp-msg@voidtechsolution.com>",
      }),
    } as unknown as Transporter;

    const otpResult = await sendOtpEmail(
      "user@example.com",
      { code: "654321", recipientName: "Test Lead" },
      mockTransporter
    );
    expect(otpResult.success).toBe(true);
    expect(mockTransporter.sendMail).toHaveBeenCalled();
  });
});
