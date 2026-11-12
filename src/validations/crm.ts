import { z } from "zod";

export const CRM_STAGES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
  "ON_HOLD",
] as const;

export const FOLLOWUP_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const leadStageUpdateSchema = z
  .object({
    enquiryId: z.string().min(1, "Enquiry ID is required"),
    newStatus: z.enum(CRM_STAGES, {
      errorMap: () => ({ message: "Invalid CRM stage" }),
    }),
    expectedUpdatedAt: z.string().or(z.date()).optional(),
    lostReason: z.string().optional(),
    estimatedValueInr: z.number().min(0, "Estimated value must be non-negative").optional(),
    internalNotes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.newStatus === "LOST") {
        return !!data.lostReason && data.lostReason.trim().length > 0;
      }
      return true;
    },
    {
      message: "A non-empty lostReason is mandatory when moving a lead to LOST status.",
      path: ["lostReason"],
    }
  );

export type LeadStageUpdateInput = z.infer<typeof leadStageUpdateSchema>;

export const createLeadNoteSchema = z.object({
  enquiryId: z.string().min(1, "Enquiry ID is required"),
  content: z.string().min(1, "Note content cannot be empty").max(5000, "Note too long (max 5000 characters)"),
  isPinned: z.boolean().optional().default(false),
});

export type CreateLeadNoteInput = z.input<typeof createLeadNoteSchema>;

export const createLeadFollowUpSchema = z.object({
  enquiryId: z.string().min(1, "Enquiry ID is required"),
  title: z.string().min(1, "Task title is required").max(200, "Title too long (max 200 characters)"),
  description: z.string().max(2000, "Description too long").optional(),
  dueAt: z.string().or(z.date()).refine(
    (val) => !isNaN(new Date(val).getTime()),
    { message: "Valid due date and time is required" }
  ),
  priority: z.enum(FOLLOWUP_PRIORITIES).optional().default("MEDIUM"),
  assignedToId: z.string().optional().nullable(),
});

export type CreateLeadFollowUpInput = z.input<typeof createLeadFollowUpSchema>;

export const assignLeadSchema = z.object({
  enquiryId: z.string().min(1, "Enquiry ID is required"),
  adminId: z.string().min(1, "Target administrator ID is required"),
  notes: z.string().max(1000, "Assignment notes too long").optional(),
});

export type AssignLeadInput = z.infer<typeof assignLeadSchema>;
