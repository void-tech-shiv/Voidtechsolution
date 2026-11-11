import { prisma } from "@/lib/prisma";
import type { Enquiry, EnquiryStatus, ServiceCategory, Prisma } from "@prisma/client";
import type { EnquiryInput } from "@/types";

export interface GetEnquiriesParams {
  status?: EnquiryStatus;
  category?: ServiceCategory;
  search?: string;
  page?: number;
  limit?: number;
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
 */
export async function createEnquiry(
  input: EnquiryInput,
  meta?: { ipHash?: string; userAgent?: string }
): Promise<Enquiry> {
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
      status: "NEW",
      ipHash: meta?.ipHash || null,
      userAgent: meta?.userAgent || null,
    },
  });
}

/**
 * Retrieves paginated enquiries with optional status, category, and search filters.
 */
export async function getEnquiries(
  params: GetEnquiriesParams = {}
): Promise<PaginatedEnquiries> {
  const { status, category, search, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.EnquiryWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (category) {
    where.serviceCategory = category;
  }

  if (search && search.trim() !== "") {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
      { message: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
}

/**
 * Retrieves a single enquiry by its unique ID.
 */
export async function getEnquiryById(id: string): Promise<Enquiry | null> {
  return await prisma.enquiry.findUnique({
    where: { id },
  });
}

/**
 * Updates an enquiry status and optionally updates internal notes.
 */
export async function updateEnquiryStatus(
  id: string,
  status: EnquiryStatus,
  internalNotes?: string
): Promise<Enquiry> {
  const data: Prisma.EnquiryUpdateInput = { status };

  if (internalNotes !== undefined) {
    data.internalNotes = internalNotes;
  }

  return await prisma.enquiry.update({
    where: { id },
    data,
  });
}

/**
 * Appends internal notes to an enquiry record.
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

  return await prisma.enquiry.update({
    where: { id },
    data: { internalNotes: updatedNotes },
  });
}

/**
 * Permanently deletes an enquiry record by ID.
 */
export async function deleteEnquiry(id: string): Promise<Enquiry> {
  return await prisma.enquiry.delete({
    where: { id },
  });
}

/**
 * Returns aggregated enquiry metrics by status.
 */
export async function getEnquiryStats(): Promise<Record<EnquiryStatus, number>> {
  const counts = await prisma.enquiry.groupBy({
    by: ["status"],
    _count: {
      status: true,
    },
  });

  const stats: Record<EnquiryStatus, number> = {
    NEW: 0,
    IN_REVIEW: 0,
    CONTACTED: 0,
    CONVERTED: 0,
    ARCHIVED: 0,
  };

  for (const item of counts) {
    stats[item.status] = item._count.status;
  }

  return stats;
}
