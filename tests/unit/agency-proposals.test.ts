import { describe, expect, it } from "vitest";
import {
  calculateQuote, canTransitionProposal, createProposalSchema,
  parseProposalForm, DEFAULT_MILESTONES,
} from "@/server/agency/proposals";
import { hasPermission } from "@/server/security/rbac";

const items = [
  { description: "Responsive business website", quantity: 1, unitPriceInr: 2999 },
  { description: "Additional pages", quantity: 3, unitPriceInr: 500 },
];

describe("Agency proposal pricing integrity", () => {
  it("recalculates all INR totals on the server and applies a bounded discount", () => {
    expect(calculateQuote(items, 499)).toEqual({
      lines: [
        { ...items[0], lineTotalInr: 2999, orderIndex: 0 },
        { ...items[1], lineTotalInr: 1500, orderIndex: 1 },
      ],
      subtotalInr: 4499,
      discountInr: 499,
      totalInr: 4000,
    });
  });

  it("rejects negative, fractional, excessive and over-discounted quotes", () => {
    expect(() => calculateQuote(items, 5000)).toThrow(/discount/);
    expect(() => calculateQuote(items, -1)).toThrow(/discount/);
    expect(() => calculateQuote(items, 0.5)).toThrow(/discount/);
    expect(() => calculateQuote([{ description: "Enterprise platform", quantity: 100, unitPriceInr: 10_000_000 }, { description: "Second enterprise module", quantity: 100, unitPriceInr: 10_000_000 }, { description: "Third enterprise module", quantity: 100, unitPriceInr: 10_000_000 }], 0)).toThrow(/amounts/);
    expect(() => calculateQuote([{ description: "Invalid quantity", quantity: 0, unitPriceInr: 999 }], 0)).toThrow();
  });

  it("parses repeated HTML form line items and excludes unused empty rows", () => {
    const form = new FormData();
    form.set("enquiryId", "ckl12345678900");
    form.set("title", "Website for a local business");
    form.set("scope", "Build a modern landing page with a contact form.");
    form.set("terms", "50% advance, remainder on delivery.");
    form.set("discountInr", "100");
    form.append("itemDescription", "Responsive website");
    form.append("quantity", "1");
    form.append("unitPriceInr", "3000");
    form.append("itemDescription", "");
    form.append("quantity", "1");
    form.append("unitPriceInr", "");
    const result = parseProposalForm(form);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toEqual([{ description: "Responsive website", quantity: 1, unitPriceInr: 3000 }]);
      expect(calculateQuote(result.data.items, result.data.discountInr).totalInr).toBe(2900);
    }
  });

  it("refuses malformed forms and more than eight line items", () => {
    const input = {
      enquiryId: "ckl12345678900", title: "Business website",
      scope: "Responsive design and inquiry functionality.",
      terms: "Terms agreed in writing.",
      discountInr: 0,
      items,
    };
    expect(createProposalSchema.safeParse(input).success).toBe(true);
    expect(createProposalSchema.safeParse({ ...input, discountInr: -1 }).success).toBe(false);
    expect(createProposalSchema.safeParse({ ...input, items: Array(9).fill(items[0]) }).success).toBe(false);
    expect(createProposalSchema.safeParse({ ...input, items: [{ ...items[0], unitPriceInr: 1.25 }] }).success).toBe(false);
  });
});

describe("Sales to delivery invariants", () => {
  it("requires sending a draft before recording client acceptance", () => {
    expect(canTransitionProposal("DRAFT", "SENT")).toBe(true);
    expect(canTransitionProposal("DRAFT", "ACCEPTED")).toBe(false);
    expect(canTransitionProposal("SENT", "ACCEPTED")).toBe(true);
    expect(canTransitionProposal("SENT", "REJECTED")).toBe(true);
    expect(canTransitionProposal("ACCEPTED", "REJECTED")).toBe(false);
    expect(canTransitionProposal("REJECTED", "ACCEPTED")).toBe(false);
  });

  it("provides the standard client handover milestones", () => {
    expect(DEFAULT_MILESTONES).toHaveLength(5);
    expect(new Set(DEFAULT_MILESTONES).size).toBe(5);
  });

  it("allows only administrator roles to manage proposals and projects", () => {
    for (const permission of ["proposals:manage", "projects:manage"] as const) {
      expect(hasPermission("SUPER_ADMIN", permission)).toBe(true);
      expect(hasPermission("ADMIN", permission)).toBe(true);
      expect(hasPermission("EDITOR", permission)).toBe(false);
    }
  });
});
