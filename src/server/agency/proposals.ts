import { z } from "zod";

export const itemSchema = z.object({
  description: z.string().trim().min(2).max(180),
  quantity: z.number().int().min(1).max(100),
  unitPriceInr: z.number().int().min(0).max(10_000_000),
});

export const createProposalSchema = z.object({
  enquiryId: z.string().min(5).max(100),
  title: z.string().trim().min(3).max(150),
  scope: z.string().trim().min(10).max(8_000),
  terms: z.string().trim().min(5).max(5_000),
  discountInr: z.number().int().min(0).max(2_000_000_000),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  items: z.array(itemSchema).min(1).max(8),
});

export type ProposalInput = z.infer<typeof createProposalSchema>;

export function calculateQuote(items: ProposalInput["items"], discountInr: number) {
  if (!Number.isSafeInteger(discountInr) || discountInr < 0) {
    throw new Error("Invalid discount.");
  }

  const lines = items.map((item, orderIndex) => {
    const parsed = itemSchema.parse(item);
    const lineTotalInr = parsed.quantity * parsed.unitPriceInr;
    return { ...parsed, lineTotalInr, orderIndex };
  });
  const subtotalInr = lines.reduce((total, item) => total + item.lineTotalInr, 0);
  if (!Number.isSafeInteger(subtotalInr) || subtotalInr > 2_000_000_000 ||
      discountInr > subtotalInr) {
    throw new Error("Quote amounts must be valid whole INR and the discount cannot exceed the subtotal.");
  }
  return { lines, subtotalInr, discountInr, totalInr: subtotalInr - discountInr };
}

export const PROPOSAL_TRANSITIONS = {
  DRAFT: ["SENT"],
  SENT: ["ACCEPTED", "REJECTED"],
  ACCEPTED: [],
  REJECTED: [],
} as const;

export type ProposalState = keyof typeof PROPOSAL_TRANSITIONS;
export function canTransitionProposal(from: ProposalState, to: ProposalState) {
  return (PROPOSAL_TRANSITIONS[from] as readonly string[]).includes(to);
}

export const PROJECT_STATES = [
  "PLANNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED",
] as const;

export const DEFAULT_MILESTONES = [
  "Discovery & requirements",
  "UI/UX design approval",
  "Development",
  "Testing & revisions",
  "Deployment & handover",
] as const;

export function parseProposalForm(form: FormData) {
  const descriptions = form.getAll("itemDescription").map(String);
  const quantities = form.getAll("quantity").map(String);
  const prices = form.getAll("unitPriceInr").map(String);
  const items = descriptions.flatMap((description, index) => {
    if (!description.trim()) return [];
    return [{
      description,
      quantity: Number(quantities[index]),
      unitPriceInr: Number(prices[index]),
    }];
  });

  const validUntil = String(form.get("validUntil") ?? "").trim();
  return createProposalSchema.safeParse({
    enquiryId: String(form.get("enquiryId") ?? ""),
    title: String(form.get("title") ?? ""),
    scope: String(form.get("scope") ?? ""),
    terms: String(form.get("terms") ?? ""),
    discountInr: Number(form.get("discountInr")),
    validUntil: validUntil || undefined,
    items,
  });
}
