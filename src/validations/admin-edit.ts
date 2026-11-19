import { z } from "zod";

/**
 * Domain-level validation for the four customer-facing admin catalog editors.
 * Slugs/IDs are intentionally not editable because public URLs refer to them.
 */
export const adminEditKindSchema = z.enum(["pricing", "service", "portfolio", "faq"]);
export type AdminEditKind = z.infer<typeof adminEditKindSchema>;

const base = z.object({
  id: z.string().min(2).max(100),
  expectedUpdatedAt: z.coerce.date(),
});

const text = (max: number, min = 2) => z.string().trim().min(min).max(max);
const wholeInr = z.coerce.number().int().min(1).max(2_000_000_000);
const order = z.coerce.number().int().min(0).max(100_000);
const flag = z.boolean();

const lines = z.array(text(240)).min(1).max(30).refine(
  (values) => new Set(values.map((v) => v.toLowerCase())).size === values.length,
  "Please remove duplicate list entries."
);

export const editPricingSchema = base.extend({
  name: text(120),
  priceInr: wholeInr,
  isStartingPrice: flag,
  billingPeriod: z.string().trim().max(40).nullable(),
  features: lines,
  popular: flag,
  orderIndex: order,
  isActive: flag,
});

export const editServiceSchema = base.extend({
  title: text(140),
  shortDesc: text(350),
  fullDesc: text(6000, 10),
  startingPriceInr: wholeInr.nullable(),
  deliverables: lines,
  technologies: lines,
  isFeatured: flag,
  isActive: flag,
  orderIndex: order,
});

const urlField = z.string().trim().max(500).url().refine(
  (value) => new URL(value).protocol === "https:" || new URL(value).protocol === "http:",
  "Only http/https links are supported."
).nullable();

export const editPortfolioSchema = base.extend({
  title: text(160),
  clientName: text(150),
  industry: text(100),
  summary: text(1200, 10),
  challenge: text(6000, 10),
  solution: text(6000, 10),
  results: text(6000, 10),
  techStack: lines,
  liveUrl: urlField,
  githubUrl: urlField,
  projectType: z.enum(["CONCEPT", "INTERNAL_PROTOTYPE", "PRODUCTION"]),
  isFeatured: flag,
  orderIndex: order,
});

export const editFaqSchema = base.extend({
  question: text(500, 8),
  answer: text(5000, 10),
  category: z.string().trim().toUpperCase().regex(/^[A-Z0-9_]{2,40}$/),
  isActive: flag,
  orderIndex: order,
});

export function textLines(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string" || raw.length > 10_000) return [];
  return raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function formText(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}
function formFlag(form: FormData, name: string): boolean {
  return form.get(name) === "on";
}

export function parseAdminEditForm(kind: AdminEditKind, form: FormData) {
  const common = {
    id: formText(form, "id"),
    expectedUpdatedAt: formText(form, "expectedUpdatedAt"),
    orderIndex: formText(form, "orderIndex"),
  };
  switch (kind) {
    case "pricing":
      return editPricingSchema.safeParse({
        ...common,
        name: formText(form, "name"),
        priceInr: formText(form, "priceInr"),
        isStartingPrice: formFlag(form, "isStartingPrice"),
        billingPeriod: formText(form, "billingPeriod") || null,
        features: textLines(form.get("features")),
        popular: formFlag(form, "popular"),
        isActive: formFlag(form, "isActive"),
      });
    case "service":
      return editServiceSchema.safeParse({
        ...common,
        title: formText(form, "title"),
        shortDesc: formText(form, "shortDesc"),
        fullDesc: formText(form, "fullDesc"),
        startingPriceInr: formText(form, "startingPriceInr") || null,
        deliverables: textLines(form.get("deliverables")),
        technologies: textLines(form.get("technologies")),
        isFeatured: formFlag(form, "isFeatured"),
        isActive: formFlag(form, "isActive"),
      });
    case "portfolio":
      return editPortfolioSchema.safeParse({
        ...common,
        title: formText(form, "title"),
        clientName: formText(form, "clientName"),
        industry: formText(form, "industry"),
        summary: formText(form, "summary"),
        challenge: formText(form, "challenge"),
        solution: formText(form, "solution"),
        results: formText(form, "results"),
        techStack: textLines(form.get("techStack")),
        liveUrl: formText(form, "liveUrl") || null,
        githubUrl: formText(form, "githubUrl") || null,
        projectType: formText(form, "projectType"),
        isFeatured: formFlag(form, "isFeatured"),
      });
    case "faq":
      return editFaqSchema.safeParse({
        ...common,
        question: formText(form, "question"),
        answer: formText(form, "answer"),
        category: formText(form, "category"),
        isActive: formFlag(form, "isActive"),
      });
  }
}
