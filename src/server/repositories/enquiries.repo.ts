import { prisma } from "@/lib/prisma";
import type { Enquiry, EnquiryStatus, ServiceCategory, Prisma } from "@prisma/client";
import type { EnquiryInput } from "@/types";

export interface GetEnquiriesParams {
  status?: EnquiryStatus;
  category?: ServiceCategory;
  assignedAdminId?: string;
  search?: string;
  hasOverdueFollowUp?: boolean;
  page?: number;
  limit?: number;
  includeRelations?: boolean;
  sortBy?: "createdAt" | "updatedAt" | "name" | "status";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedEnquiries {
  items: Enquiry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Creates a new client lead enquiry in the database.
 * Write operation strictly throws descriptive errors on failure without leaking connection details.
 */
export async function createEnquiry(
  input: EnquiryInput,
  meta?: { ipHash?: string; userAgent?: string }
): Promise<Enquiry> {
  try {
    return await prisma.enquiry.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        companyName: input.companyName || null,
        serviceCategory: input.serviceCategory,
        budgetRange: input.budgetRange || null,
        timeline: input.timeline || null,
        message: input.message,
        selectedPackage: input.selectedPackage || null,
        additionalConfig: input.additionalConfig || undefined,
        referenceUrl: input.referenceUrl || null,
        consentGiven: input.consentGiven !== undefined ? input.consentGiven : null,
        status: "NEW",
        ipHash: meta?.ipHash || null,
        userAgent: meta?.userAgent || null,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[enquiries.repo] createEnquiry write failed:", msg);
    throw new Error("Failed to submit client enquiry: Database write operation failed.");
  }
}

/**
 * Retrieves paginated enquiries with optional status, category, and search filters.
 */
export async function getEnquiries(
  params: GetEnquiriesParams = {}
): Promise<PaginatedEnquiries> {
  const {
    status,
    category,
    assignedAdminId,
    search,
    hasOverdueFollowUp,
    page = 1,
    limit = 20,
    includeRelations = false,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.EnquiryWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (category) {
    where.serviceCategory = category;
  }

  if (assignedAdminId) {
    where.assignedAdminId = assignedAdminId;
  }

  if (hasOverdueFollowUp) {
    where.followUps = {
      some: {
        isCompleted: false,
        dueAt: { lt: new Date() },
      },
    };
  }

  if (search && search.trim() !== "") {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
      { message: { contains: search, mode: "insensitive" } },
    ];
  }

  const include = includeRelations
    ? {
        assignedAdmin: {
          select: { id: true, name: true, email: true, role: true, isActive: true },
        },
        notes: {
          orderBy: { createdAt: "desc" as const },
          take: 5,
        },
        followUps: {
          where: { isCompleted: false },
          orderBy: { dueAt: "asc" as const },
          take: 3,
        },
      }
    : undefined;

  try {
    const [items, total] = await Promise.all([
      prisma.enquiry.findMany({
        where,
        include,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.enquiry.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (error) {
    console.warn("[enquiries.repo] getEnquiries query failed:", error);
    return {
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 1,
    };
  }
}

/**
 * Retrieves a single enquiry by its unique ID with optional relation hydration.
 */
export async function getEnquiryById(
  id: string,
  includeRelations = false
): Promise<Enquiry | null> {
  try {
    const include = includeRelations
      ? {
          assignedAdmin: {
            select: { id: true, name: true, email: true, role: true, isActive: true },
          },
          notes: {
            orderBy: [{ isPinned: "desc" as const }, { createdAt: "desc" as const }],
          },
          followUps: {
            orderBy: [{ isCompleted: "asc" as const }, { dueAt: "asc" as const }],
          },
          activities: {
            orderBy: { createdAt: "desc" as const },
            take: 50,
          },
          assignments: {
            include: {
              admin: { select: { id: true, name: true, email: true, role: true } },
            },
            orderBy: { assignedAt: "desc" as const },
          },
        }
      : undefined;

    return await prisma.enquiry.findUnique({
      where: { id },
      include,
    });
  } catch (error) {
    console.warn(`[enquiries.repo] getEnquiryById failed for id '${id}':`, error);
    return null;
  }
}

export interface UpdateEnquiryStatusOptions {
  internalNotes?: string;
  lostReason?: string;
  estimatedValueInr?: number;
  expectedUpdatedAt?: Date;
}

/**
 * Updates an enquiry status with optional concurrency checking and metadata.
 * Write operation strictly throws descriptive errors on failure.
 */
export async function updateEnquiryStatus(
  id: string,
  status: EnquiryStatus,
  optionsOrNotes?: string | UpdateEnquiryStatusOptions
): Promise<Enquiry> {
  const options: UpdateEnquiryStatusOptions =
    typeof optionsOrNotes === "string"
      ? { internalNotes: optionsOrNotes }
      : optionsOrNotes || {};

  const current = await prisma.enquiry.findUnique({ where: { id } });
  if (!current) {
    throw new Error(`Enquiry with id '${id}' not found`);
  }

  // Optimistic Concurrency Control guard
  if (options.expectedUpdatedAt) {
    const currentMs = current.updatedAt.getTime();
    const expectedMs = options.expectedUpdatedAt.getTime();
    if (Math.abs(currentMs - expectedMs) > 1000) {
      throw new Error(`Concurrency conflict: Enquiry was modified by another administrator.`);
    }
  }

  const data: Prisma.EnquiryUpdateInput = { status };

  if (options.internalNotes !== undefined) {
    data.internalNotes = options.internalNotes;
  }
  if (options.lostReason !== undefined) {
    data.lostReason = options.lostReason;
  }
  if (options.estimatedValueInr !== undefined) {
    data.estimatedValueInr = options.estimatedValueInr;
  }

  try {
    return await prisma.enquiry.update({
      where: { id },
      data,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[enquiries.repo] updateEnquiryStatus failed:", msg);
    throw new Error(`Failed to update status for enquiry '${id}': Database write operation failed.`);
  }
}

/**
 * Appends internal notes to an enquiry record.
 * Write operation strictly throws descriptive errors on failure.
 */
export async function appendEnquiryNote(
  id: string,
  note: string,
  authorName?: string
): Promise<Enquiry> {
  const current = await getEnquiryById(id);
  if (!current) {
    throw new Error(`Enquiry with id ${id} not found`);
  }

  const timestamp = new Date().toISOString();
  const authorPrefix = authorName ? `[${authorName} - ${timestamp}]` : `[${timestamp}]`;
  const formattedNote = `${authorPrefix} ${note}`;
  const updatedNotes = current.internalNotes
    ? `${current.internalNotes}\n\n${formattedNote}`
    : formattedNote;

  try {
    return await prisma.enquiry.update({
      where: { id },
      data: { internalNotes: updatedNotes },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[enquiries.repo] appendEnquiryNote failed:", msg);
    throw new Error(`Failed to append note to enquiry '${id}': Database write operation failed.`);
  }
}

/**
 * Permanently deletes an enquiry record by ID.
 * Write operation strictly throws descriptive errors on failure.
 */
export async function deleteEnquiry(id: string): Promise<Enquiry> {
  try {
    return await prisma.enquiry.delete({
      where: { id },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[enquiries.repo] deleteEnquiry failed:", msg);
    throw new Error(`Failed to delete enquiry '${id}': Database write operation failed.`);
  }
}

/**
 * Returns aggregated enquiry metrics by status.
 */
export async function getEnquiryStats(): Promise<Record<EnquiryStatus, number>> {
  const defaultStats: Record<EnquiryStatus, number> = {
    NEW: 0,
    CONTACTED: 0,
    QUALIFIED: 0,
    PROPOSAL_SENT: 0,
    NEGOTIATION: 0,
    WON: 0,
    LOST: 0,
    ON_HOLD: 0,
  };

  try {
    const counts = await prisma.enquiry.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    for (const item of counts) {
      defaultStats[item.status] = item._count.status;
    }

    return defaultStats;
  } catch (error) {
    console.warn("[enquiries.repo] getEnquiryStats query failed, using empty counts:", error);
    return defaultStats;
  }
}
