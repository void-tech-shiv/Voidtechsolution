import { prisma } from "@/lib/prisma";
import { approvedPricingPackages } from "@/config/pricing";
import type { PricingPackage, Prisma, ServiceCategory } from "@prisma/client";

/**
 * Maps a static PricingPackageDefinition into a Prisma PricingPackage model representation.
 */
function mapStaticToPricingModel(
  def: (typeof approvedPricingPackages)[number],
  index: number
): PricingPackage {
  return {
    id: `pkg-${index + 1}`,
    slug: def.slug,
    name: def.name,
    category: def.category as ServiceCategory,
    priceInr: def.priceInr,
    currency: def.currency || "INR",
    isStartingPrice: def.isStartingPrice,
    billingPeriod: def.billingPeriod || null,
    features: def.features,
    popular: def.popular,
    orderIndex: def.orderIndex,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Retrieves all pricing packages ordered by orderIndex.
 * Falls back to approvedPricingPackages if database is offline.
 */
export async function getAllPricingPackages(): Promise<PricingPackage[]> {
  try {
    const packages = await prisma.pricingPackage.findMany({
      orderBy: { orderIndex: "asc" },
    });

    if (packages.length > 0) return packages;
  } catch (error) {
    console.warn("[pricing.repo] Database query failed, using static fallback:", error);
  }

  return approvedPricingPackages.map(mapStaticToPricingModel);
}

/**
 * Retrieves only active pricing packages.
 */
export async function getActivePricingPackages(): Promise<PricingPackage[]> {
  try {
    const packages = await prisma.pricingPackage.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: "asc" },
    });

    if (packages.length > 0) return packages;
  } catch (error) {
    console.warn("[pricing.repo] Database query failed, using static fallback:", error);
  }

  return approvedPricingPackages.map(mapStaticToPricingModel);
}

/**
 * Retrieves a single pricing package by slug.
 */
export async function getPricingPackageBySlug(slug: string): Promise<PricingPackage | null> {
  try {
    const pkg = await prisma.pricingPackage.findUnique({
      where: { slug },
    });

    if (pkg) return pkg;
  } catch (error) {
    console.warn(`[pricing.repo] Database query for slug '${slug}' failed:`, error);
  }

  const staticPkg = approvedPricingPackages.find((p) => p.slug === slug);
  if (staticPkg) {
    const idx = approvedPricingPackages.findIndex((p) => p.slug === slug);
    return mapStaticToPricingModel(staticPkg, idx);
  }

  return null;
}

/**
 * Creates a new pricing package (admin write).
 */
export async function createPricingPackage(
  data: Prisma.PricingPackageCreateInput
): Promise<PricingPackage> {
  try {
    return await prisma.pricingPackage.create({
      data,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[pricing.repo] createPricingPackage failed:", msg);
    throw new Error("Failed to create pricing package: Database write operation failed.");
  }
}
