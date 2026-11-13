import { prisma } from "@/lib/prisma";
import type { FAQ, Prisma } from "@prisma/client";

/**
 * Baseline fallback FAQs when database is offline.
 */
const fallbackFaqs: FAQ[] = [
  {
    id: "faq-01",
    contentItemId: null,
    publishedAt: null,
    question: "What is the typical development turnaround time for a project?",
    answer: "Turnaround depends on the tier: static landing pages deploy in 3-5 business days; standard business websites take 7-10 days; while complex custom web applications, SaaS, and AI automations typically span 2-6 weeks with agile milestone delivery.",
    category: "GENERAL",
    orderIndex: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "faq-02",
    contentItemId: null,
    publishedAt: null,
    question: "Do you build custom solutions or use off-the-shelf templates?",
    answer: "Every VoidTech Solution digital asset is engineered bespoke using modern frameworks like Next.js, React, Tailwind CSS, and Node.js. We never use bloated, slow third-party templates.",
    category: "TECHNICAL",
    orderIndex: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "faq-03",
    contentItemId: null,
    publishedAt: null,
    question: "Are your prices really starting at ₹999 for static sites?",
    answer: "Yes. Our Basic Static package starts at ₹999 for lightweight, ultra-fast landing pages. For enterprise systems, custom applications, and autonomous AI agents, pricing scales predictably based on specifications and complexity.",
    category: "PRICING",
    orderIndex: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "faq-04",
    contentItemId: null,
    publishedAt: null,
    question: "How do you handle Indian and international payment gateways?",
    answer: "We engineer frictionless payment checkouts supporting UPI intent flows, QR code generation, Net Banking, credit/debit cards, and global currencies via Razorpay, Cashfree, and Stripe.",
    category: "PAYMENTS",
    orderIndex: 4,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "faq-05",
    contentItemId: null,
    publishedAt: null,
    question: "What warranty or post-deployment support do you provide?",
    answer: "All deliverables include a limited 30-day bug-fix warranty following final handover, covering defects in functionality explicitly within agreed project scope. New features, scope changes, client-side modifications, third-party service failures, and external infrastructure issues are excluded. Ongoing maintenance agreements are available upon request.",
    category: "SUPPORT",
    orderIndex: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

/**
 * Retrieves all FAQs ordered by orderIndex.
 */
export async function getAllFaqs(): Promise<FAQ[]> {
  try {
    const faqs = await prisma.fAQ.findMany({
      orderBy: { orderIndex: "asc" },
    });

    if (faqs.length > 0) return faqs;
  } catch (error) {
    console.warn("[faq.repo] Database query failed, using fallback:", error);
  }

  return fallbackFaqs;
}

/**
 * Retrieves active FAQs.
 */
export async function getActiveFaqs(): Promise<FAQ[]> {
  try {
    const faqs = await prisma.fAQ.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: "asc" },
    });

    if (faqs.length > 0) return faqs;
  } catch (error) {
    console.warn("[faq.repo] Database query failed, using fallback:", error);
  }

  return fallbackFaqs.filter((f) => f.isActive);
}

/**
 * Retrieves FAQs filtered by category.
 */
export async function getFaqsByCategory(category: string): Promise<FAQ[]> {
  try {
    const faqs = await prisma.fAQ.findMany({
      where: {
        category: { equals: category, mode: "insensitive" },
        isActive: true,
      },
      orderBy: { orderIndex: "asc" },
    });

    if (faqs.length > 0) return faqs;
  } catch (error) {
    console.warn(`[faq.repo] Failed to fetch FAQs for category '${category}':`, error);
  }

  return fallbackFaqs.filter(
    (f) => f.isActive && f.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Creates a new FAQ entry (admin write).
 */
export async function createFaq(data: Prisma.FAQCreateInput): Promise<FAQ> {
  try {
    return await prisma.fAQ.create({
      data,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[faq.repo] createFaq failed:", msg);
    throw new Error("Failed to create FAQ: Database write operation failed.");
  }
}

