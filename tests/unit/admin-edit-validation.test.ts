import { describe, expect, it } from "vitest";
import {
  editPricingSchema, editServiceSchema, editPortfolioSchema, editFaqSchema,
  parseAdminEditForm, textLines,
} from "@/validations/admin-edit";

const makeForm = (data: Record<string, string | boolean>) => {
  const form = new FormData();
  for (const [name, value] of Object.entries(data)) {
    if (typeof value === "boolean") {
      if (value) form.set(name, "on");
    } else {
      form.set(name, value);
    }
  }
  return form;
};

const common = { id: "clwvalidrecord12345", expectedUpdatedAt: "2026-11-19T14:10:00.000Z", orderIndex: "1" };

describe("Admin inline editors: validation and commercial safety", () => {
  it("accepts a valid tier and normalizes multiline features", () => {
    const result = parseAdminEditForm("pricing", makeForm({
      ...common, name: "Standard Business Website", priceInr: "3999",
      features: "Responsive design\r\nContact form\n\nSEO setup",
      popular: true, isStartingPrice: true, isActive: true,
      billingPeriod: "one-time",
    }));
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = editPricingSchema.parse(result.data);
      expect(parsed.priceInr).toBe(3999);
      expect(parsed.features).toEqual(["Responsive design", "Contact form", "SEO setup"]);
      expect(parsed.isActive).toBe(true);
      expect(parsed.expectedUpdatedAt).toBeInstanceOf(Date);
    }
  });

  it.each(["0", "-1", "1.25", "2147483648", "Infinity", "not-a-price"])(
    "rejects invalid whole-INR pricing: %s", (price) => {
      const result = parseAdminEditForm("pricing", makeForm({
        ...common, name: "Website", priceInr: price,
        features: "Business website", isActive: true,
      }));
      expect(result.success).toBe(false);
    }
  );

  it("rejects repeated lines, oversize text and missing update version", () => {
    const repeated = parseAdminEditForm("pricing", makeForm({
      ...common, name: "Website", priceInr: "999",
      features: "Hosting\nhosting",
    }));
    expect(repeated.success).toBe(false);
    expect(textLines("X".repeat(10001))).toEqual([]);
    expect(editPricingSchema.safeParse({
      ...common, name: "Website", priceInr: 999, features: ["Website"],
      popular: false, isActive: true, isStartingPrice: false,
      billingPeriod: null, expectedUpdatedAt: "garbage",
    }).success).toBe(false);
  });

  it("supports optional custom-service price and rejects negative service price", () => {
    const valid = parseAdminEditForm("service", makeForm({
      ...common, title: "API development", shortDesc: "Custom APIs",
      fullDesc: "Build and operate production APIs for businesses.",
      startingPriceInr: "", deliverables: "API implementation",
      technologies: "TypeScript\nNode.js", isFeatured: true,
      isActive: true,
    }));
    expect(valid.success).toBe(true);
    if (valid.success) expect(editServiceSchema.parse(valid.data).startingPriceInr).toBeNull();
    expect(editServiceSchema.safeParse({
      ...common, title: "API development", shortDesc: "Custom APIs",
      fullDesc: "Build and operate production APIs for businesses.",
      startingPriceInr: -1, deliverables: ["API"], technologies: ["Node.js"],
      isFeatured: false, isActive: true,
    }).success).toBe(false);
  });

  it("rejects unsafe portfolio URLs and preserves concept lab labels", () => {
    const payload = {
      ...common, title: "IoT concept", clientName: "VoidTech Concept Lab",
      industry: "IOT", summary: "Prototype overview for internal testing.",
      challenge: "Simulate test device behavior at scale.",
      solution: "Build software for simulating devices.",
      results: "Internal synthetic bench results only.",
      techStack: ["React", "Node.js"], isFeatured: false,
      liveUrl: null, githubUrl: null, projectType: "CONCEPT" as const,
    };
    expect(editPortfolioSchema.safeParse(payload).success).toBe(true);
    expect(editPortfolioSchema.safeParse({ ...payload, liveUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(editPortfolioSchema.safeParse({ ...payload, projectType: "FAKE_CLIENT" }).success).toBe(false);
  });

  it("supports FAQ visibility and normalizes category", () => {
    const result = parseAdminEditForm("faq", makeForm({
      ...common, question: "What support is provided?",
      answer: "We provide scoped post-deployment support.",
      category: "support", isActive: false,
    }));
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = editFaqSchema.parse(result.data);
      expect(parsed.category).toBe("SUPPORT");
      expect(parsed.isActive).toBe(false);
    }
    expect(editFaqSchema.safeParse({
      ...common, question: "What support is provided?",
      answer: "We provide scoped post-deployment support.",
      category: "<script>", isActive: true,
    }).success).toBe(false);
  });
});
