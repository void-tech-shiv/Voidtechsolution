import { prisma } from "@/lib/prisma";
import type { LeadNote, Prisma } from "@prisma/client";

export interface CreateLeadNoteInput {
  enquiryId: string;
  authorId?: string | null;
  authorName: string;
  content: string;
  isPinned?: boolean;
}

/**
 * Creates an internal engineering/administrative note for a lead.
 * Internal notes are private and must NEVER be exposed to clients.
 */
export async function createLeadNote(
  input: CreateLeadNoteInput,
  tx?: Prisma.TransactionClient
): Promise<LeadNote> {
  const db = tx || prisma;
  try {
    return await db.leadNote.create({
      data: {
        enquiryId: input.enquiryId,
        authorId: input.authorId || null,
        authorName: input.authorName,
        content: input.content.trim(),
        isPinned: input.isPinned ?? false,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[lead-notes.repo] createLeadNote failed:", msg);
    throw new Error(`Failed to create internal note for lead '${input.enquiryId}': Database write operation failed.`);
  }
}

/**
 * Retrieves all internal notes for a specific lead, ordered by pinned status and creation date.
 */
export async function getLeadNotes(enquiryId: string): Promise<LeadNote[]> {
  try {
    return await prisma.leadNote.findMany({
      where: { enquiryId },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });
  } catch (error) {
    console.warn(`[lead-notes.repo] getLeadNotes failed for enquiry '${enquiryId}':`, error);
    return [];
  }
}

/**
 * Toggles the pinned status of a lead note.
 */
export async function togglePinLeadNote(
  noteId: string,
  isPinned: boolean
): Promise<LeadNote> {
  try {
    return await prisma.leadNote.update({
      where: { id: noteId },
      data: { isPinned },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[lead-notes.repo] togglePinLeadNote failed for note '${noteId}':`, msg);
    throw new Error(`Failed to toggle pin for note '${noteId}': Database write operation failed.`);
  }
}

/**
 * Deletes a lead note (restricted to SUPER_ADMIN).
 */
export async function deleteLeadNote(noteId: string): Promise<LeadNote> {
  try {
    return await prisma.leadNote.delete({
      where: { id: noteId },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[lead-notes.repo] deleteLeadNote failed for note '${noteId}':`, msg);
    throw new Error(`Failed to delete note '${noteId}': Database write operation failed.`);
  }
}
