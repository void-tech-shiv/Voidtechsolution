import { prisma } from "@/lib/prisma";
import type { PageSection, Prisma } from "@prisma/client";

/**
 * VOIDTECH SOLUTION — Page Sections Repository
 * 
 * Provides transactional access to editable page copy (Hero, About, CTA, etc.).
 * Includes resilient static fallbacks in case of database unavailability.
 */

export const staticPageSections: Record<string, Partial<PageSection>> = {
  "home-hero": {
    id: "sec-home-hero",
    key: "home-hero",
    pageSlug: "home",
    title: "Build. Launch. Grow Online.",
    subtitle: "Enterprise-grade digital engineering for visionary businesses.",
    content: "We design, build, and scale high-performance web applications, mobile platforms, and AI systems.",
    isActive: true,
    orderIndex: 0,
  },
  "about-intro": {
    id: "sec-about-intro",
    key: "about-intro",
    pageSlug: "about",
    title: "About VOIDTECH SOLUTION",
    subtitle: "Engineering excellence with obsessive attention to detail.",
    content: "Founded with a vision to deliver unmatched software architecture, we turn complex problems into elegant systems.",
    isActive: true,
    orderIndex: 0,
  },
  "contact-prompt": {
    id: "sec-contact-prompt",
    key: "contact-prompt",
    pageSlug: "contact",
    title: "Let's Build Something Exceptional",
    subtitle: "Reach out to our engineering team for strategic advisory or custom solutions.",
    content: "Tell us about your project requirements and target timeline.",
    isActive: true,
    orderIndex: 0,
  },
};

function mapStaticToSection(key: string, data: Partial<PageSection>): PageSection {
  return {
    id: data.id || `sec-${key}`,
    contentItemId: null,
    key,
    pageSlug: data.pageSlug || "home",
    title: data.title || "",
    subtitle: data.subtitle || null,
    content: data.content || "",
    metadata: data.metadata || null,
    mediaUrl: data.mediaUrl || null,
    isActive: data.isActive ?? true,
    orderIndex: data.orderIndex ?? 0,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function getAllPageSections(pageSlug?: string): Promise<PageSection[]> {
  try {
    const where: Prisma.PageSectionWhereInput = pageSlug ? { pageSlug } : {};
    const sections = await prisma.pageSection.findMany({
      where,
      orderBy: { orderIndex: "asc" },
    });

    if (sections.length > 0) {
      return sections;
    }
  } catch (error) {
    console.warn("[page-sections.repo] Database query failed, using static fallback:", error);
  }

  const allStatic = Object.entries(staticPageSections).map(([k, v]) =>
    mapStaticToSection(k, v)
  );

  return pageSlug ? allStatic.filter((s) => s.pageSlug === pageSlug) : allStatic;
}

export async function getActivePageSections(pageSlug?: string): Promise<PageSection[]> {
  try {
    const where: Prisma.PageSectionWhereInput = {
      isActive: true,
      ...(pageSlug ? { pageSlug } : {}),
    };
    const sections = await prisma.pageSection.findMany({
      where,
      orderBy: { orderIndex: "asc" },
    });

    if (sections.length > 0) {
      return sections;
    }
  } catch (error) {
    console.warn("[page-sections.repo] Database query failed, using static fallback:", error);
  }

  const allStatic = Object.entries(staticPageSections)
    .filter(([_, v]) => v.isActive)
    .map(([k, v]) => mapStaticToSection(k, v));

  return pageSlug ? allStatic.filter((s) => s.pageSlug === pageSlug) : allStatic;
}

export async function getPageSectionByKey(key: string): Promise<PageSection | null> {
  try {
    const section = await prisma.pageSection.findUnique({
      where: { key },
    });

    if (section) {
      // Scenario 3: If archived/inactive, deliberately do not fall back to static
      if (!section.isActive) {
        return null;
      }
      return section;
    }
  } catch (error) {
    console.warn(`[page-sections.repo] Database query for key '${key}' failed:`, error);
  }

  // Fallback if DB missing or failed
  if (staticPageSections[key] && staticPageSections[key].isActive) {
    return mapStaticToSection(key, staticPageSections[key]);
  }

  return null;
}
