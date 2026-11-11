import { prisma } from "@/lib/prisma";
import { servicesRegistry } from "@/config/site";
import type { Service, Prisma, ServiceCategory } from "@prisma/client";

/**
 * Maps a static ServiceDefinition from siteConfig into a Service model representation.
 */
function mapStaticToServiceModel(def: (typeof servicesRegistry)[number], index: number): Service {
  return {
    id: def.id,
    slug: def.slug,
    title: def.title,
    shortDesc: def.shortDescription,
    fullDesc: def.fullDescription,
    icon: def.iconName,
    category: def.category as ServiceCategory,
    deliverables: def.deliverables,
    technologies: def.technologies,
    startingPriceInr: def.startingPriceInr || null,
    currency: def.currency || "INR",
    isFeatured: def.isFeatured,
    isActive: true,
    orderIndex: index + 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Retrieves all services from the database with orderIndex sorting.
 * If the database query fails or returns empty, falls back to the static registry.
 */
export async function getAllServices(): Promise<Service[]> {
  try {
    const services = await prisma.service.findMany({
      orderBy: { orderIndex: "asc" },
    });

    if (services.length > 0) {
      return services;
    }
  } catch (error) {
    console.warn("[services.repo] Database query failed, using static fallback:", error);
  }

  // Fallback to static servicesRegistry
  return servicesRegistry.map(mapStaticToServiceModel);
}

/**
 * Retrieves only active services for public display.
 */
export async function getActiveServices(): Promise<Service[]> {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: "asc" },
    });

    if (services.length > 0) {
      return services;
    }
  } catch (error) {
    console.warn("[services.repo] Database query failed, using static fallback:", error);
  }

  return servicesRegistry.map(mapStaticToServiceModel);
}

/**
 * Retrieves a single service by its URL-safe slug.
 */
export async function getServiceBySlug(slug: string): Promise<Service | null> {
  try {
    const service = await prisma.service.findUnique({
      where: { slug },
    });

    if (service) return service;
  } catch (error) {
    console.warn(`[services.repo] Database query for slug '${slug}' failed:`, error);
  }

  const staticMatch = servicesRegistry.find((s) => s.slug === slug);
  if (staticMatch) {
    const index = servicesRegistry.findIndex((s) => s.slug === slug);
    return mapStaticToServiceModel(staticMatch, index);
  }

  return null;
}

/**
 * Retrieves featured services highlighted on the homepage.
 */
export async function getFeaturedServices(): Promise<Service[]> {
  try {
    const services = await prisma.service.findMany({
      where: { isFeatured: true, isActive: true },
      orderBy: { orderIndex: "asc" },
    });

    if (services.length > 0) {
      return services;
    }
  } catch (error) {
    console.warn("[services.repo] Database query failed, using static fallback:", error);
  }

  return servicesRegistry
    .filter((s) => s.isFeatured)
    .map(mapStaticToServiceModel);
}

/**
 * Creates a new service offering in the database (administrative write).
 * Writes strictly throw descriptive errors on failure without leaking credentials.
 */
export async function createService(data: Prisma.ServiceCreateInput): Promise<Service> {
  try {
    return await prisma.service.create({
      data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[services.repo] Write operation failed:", message);
    throw new Error("Failed to create service: Database write operation failed.");
  }
}

/**
 * Updates an existing service by ID (administrative write).
 */
export async function updateService(
  id: string,
  data: Prisma.ServiceUpdateInput
): Promise<Service> {
  try {
    return await prisma.service.update({
      where: { id },
      data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[services.repo] Update operation failed:", message);
    throw new Error(`Failed to update service '${id}': Database write operation failed.`);
  }
}

/**
 * Deletes a service by ID (administrative write).
 */
export async function deleteService(id: string): Promise<Service> {
  try {
    return await prisma.service.delete({
      where: { id },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[services.repo] Delete operation failed:", message);
    throw new Error(`Failed to delete service '${id}': Database write operation failed.`);
  }
}
