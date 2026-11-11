import { describe, it, expect } from "vitest";
import { cn, formatCurrency, truncate } from "@/lib/utils";
import { enquiryFormSchema } from "@/validations/enquiry";
import { siteConfig, servicesRegistry } from "@/config/site";

describe("Utility Functions", () => {
  it("merges tailwind class names correctly without conflicts", () => {
    const result = cn("px-2 py-1", "px-4", { "bg-electric-purple": true });
    expect(result).toBe("py-1 px-4 bg-electric-purple");
  });

  it("formats currency to USD correctly", () => {
    expect(formatCurrency(1500)).toBe("$1,500");
    expect(formatCurrency(0)).toBe("$0");
  });

  it("truncates long strings cleanly", () => {
    expect(truncate("Hello World", 5)).toBe("Hello...");
    expect(truncate("Short", 10)).toBe("Short");
  });
});

describe("Project Specification & Service Registry", () => {
  it("has siteConfig defined with correct brand identity", () => {
    expect(siteConfig.name).toBe("VOIDTECH SOLUTION");
    expect(siteConfig.tagline).toBe("Build. Launch. Grow Online.");
    expect(siteConfig.mainNav.length).toBe(6);
  });

  it("registers all 18 mandatory business services", () => {
    expect(servicesRegistry.length).toBe(18);

    const serviceSlugs = servicesRegistry.map((s) => s.slug);
    expect(serviceSlugs).toContain("website-development");
    expect(serviceSlugs).toContain("app-development");
    expect(serviceSlugs).toContain("custom-api-development");
    expect(serviceSlugs).toContain("ai-automation");
    expect(serviceSlugs).toContain("ai-agents");
    expect(serviceSlugs).toContain("telegram-bots");
    expect(serviceSlugs).toContain("whatsapp-automation");
    expect(serviceSlugs).toContain("youtube-automation");
    expect(serviceSlugs).toContain("ui-ux-design");
    expect(serviceSlugs).toContain("graphic-design");
    expect(serviceSlugs).toContain("hosting-deployment");
    expect(serviceSlugs).toContain("ecommerce-development");
    expect(serviceSlugs).toContain("saas-development");
    expect(serviceSlugs).toContain("lms-development");
    expect(serviceSlugs).toContain("marketplace-development");
    expect(serviceSlugs).toContain("erp-crm-development");
    expect(serviceSlugs).toContain("upi-payment-solutions");
    expect(serviceSlugs).toContain("custom-software-solutions");
  });
});

describe("Zod Enquiry Validation Schema", () => {
  it("accepts a valid enquiry submission payload", () => {
    const validData = {
      name: "Alex Vance",
      email: "alex@enterprise.com",
      companyName: "Vance Technologies",
      serviceCategory: "AI_AUTOMATION",
      budgetRange: "15K_TO_50K",
      timeline: "1_TO_3_MONTHS",
      message: "We need an autonomous AI multi-agent workflow integrated with our ERP.",
    };

    const parseResult = enquiryFormSchema.safeParse(validData);
    expect(parseResult.success).toBe(true);
  });

  it("rejects an invalid email format", () => {
    const invalidData = {
      name: "Alex Vance",
      email: "not-an-email",
      serviceCategory: "WEB_DEVELOPMENT",
      message: "Please build our company website.",
    };

    const parseResult = enquiryFormSchema.safeParse(invalidData);
    expect(parseResult.success).toBe(false);
  });

  it("rejects a message shorter than 10 characters", () => {
    const shortMessage = {
      name: "Alex",
      email: "alex@test.com",
      serviceCategory: "WEB_DEVELOPMENT",
      message: "Hi",
    };

    const parseResult = enquiryFormSchema.safeParse(shortMessage);
    expect(parseResult.success).toBe(false);
  });
});
