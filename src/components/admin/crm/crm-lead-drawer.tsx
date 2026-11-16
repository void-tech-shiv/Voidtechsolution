"use client";

import * as React from "react";
import type { EnquiryStatus, UserRole } from "@prisma/client";
import {
  X,
  Building2,
  Mail,
  Phone,
  Calendar,
  IndianRupee,
  ShieldAlert,
  Pin,
  Trash2,
  Plus,
  AlertTriangle,
  History,
  FileText,
  UserCheck,
  CheckSquare,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatInr } from "./crm-dashboard-kpis";
import {
  getLeadDetailAction,
  createLeadNoteAction,
  togglePinLeadNoteAction,
  deleteLeadNoteAction,
  createLeadFollowUpAction,
  toggleLeadFollowUpAction,
  deleteLeadFollowUpAction,
  assignLeadAction,
  unassignLeadAction,
  updateLeadStageAction,
  getActiveAdminsAction,
} from "@/server/actions/crm.actions";
import { CRM_STAGES } from "@/validations/crm";

interface CrmLeadDrawerProps {
  leadId: string;
  userRole?: UserRole;
  canUpdateStatus: boolean;
  canDelete: boolean;
  onClose: () => void;
  onLeadUpdated: () => void;
}

interface LeadDetailItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  serviceCategory: string;
  status: EnquiryStatus;
  estimatedValueInr?: number | null;
  budgetRange?: string | null;
  timeline?: string | null;
  message: string;
  selectedPackage?: string | null;
  referenceUrl?: string | null;
  lostReason?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  assignedAdmin?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  notes?: Array<{
    id: string;
    authorName: string;
    content: string;
    isPinned: boolean;
    createdAt: Date | string;
  }>;
  activities?: Array<{
    id: string;
    type: string;
    description: string;
    actorName?: string | null;
    createdAt: Date | string;
  }>;
  followUps?: Array<{
    id: string;
    title: string;
    description?: string | null;
    dueAt: Date | string;
    priority: string;
    isCompleted: boolean;
  }>;
  assignments?: Array<{
    id: string;
    assignedAt: Date | string;
    assignedByName?: string | null;
    notes?: string | null;
    admin?: {
      id: string;
      name: string;
      email: string;
    } | null;
  }>;
}

interface AdminOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

type DrawerTab = "overview" | "notes" | "activity" | "followups" | "assignment";

export function CrmLeadDrawer({
  leadId,
  canUpdateStatus,
  canDelete,
  onClose,
  onLeadUpdated,
}: CrmLeadDrawerProps) {
  const [activeTab, setActiveTab] = React.useState<DrawerTab>("overview");
  const [lead, setLead] = React.useState<LeadDetailItem | null>(null);
  const [activeAdmins, setActiveAdmins] = React.useState<AdminOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  // Forms State
  const [newNoteContent, setNewNoteContent] = React.useState("");
  const [newNotePinned, setNewNotePinned] = React.useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = React.useState(false);

  // Follow-up Form State
  const [followUpTitle, setFollowUpTitle] = React.useState("");
  const [followUpDesc, setFollowUpDesc] = React.useState("");
  const [followUpDue, setFollowUpDue] = React.useState("");
  const [followUpPriority, setFollowUpPriority] = React.useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [followUpAssignee, setFollowUpAssignee] = React.useState("");
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = React.useState(false);

  // Assignment Form State
  const [selectedAdminId, setSelectedAdminId] = React.useState("");
  const [assignmentNotes, setAssignmentNotes] = React.useState("");
  const [isAssigning, setIsAssigning] = React.useState(false);

  // Escape key handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Load Lead Data & Admins
  const fetchLeadDetails = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [leadRes, adminsRes] = await Promise.all([
        getLeadDetailAction(leadId),
        getActiveAdminsAction(),
      ]);

      if (leadRes.success && leadRes.data) {
        setLead(leadRes.data as unknown as LeadDetailItem);
      } else {
        setFeedback({ type: "error", message: leadRes.error || "Failed to load lead details." });
      }

      if (adminsRes.success && adminsRes.data) {
        setActiveAdmins(adminsRes.data as unknown as AdminOption[]);
      }
    } catch {
      setFeedback({ type: "error", message: "Network error loading lead." });
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  React.useEffect(() => {
    fetchLeadDetails();
  }, [fetchLeadDetails]);

  // Stage change directly from drawer
  const handleStageSelect = async (newStage: EnquiryStatus) => {
    if (!lead || lead.status === newStage || !canUpdateStatus) return;

    if (newStage === "LOST") {
      const reason = window.prompt("Mandatory: Please provide a reason for marking this deal LOST:");
      if (!reason || !reason.trim()) {
        alert("Lost reason is mandatory.");
        return;
      }
      const res = await updateLeadStageAction({
        enquiryId: lead.id,
        newStatus: newStage,
        expectedUpdatedAt: lead.updatedAt,
        lostReason: reason.trim(),
      });
      if (res.success) {
        setFeedback({ type: "success", message: `Stage moved to ${newStage}.` });
        fetchLeadDetails();
        onLeadUpdated();
      } else {
        setFeedback({ type: "error", message: res.error || "Update failed." });
      }
      return;
    }

    const res = await updateLeadStageAction({
      enquiryId: lead.id,
      newStatus: newStage,
      expectedUpdatedAt: lead.updatedAt,
    });

    if (res.success) {
      setFeedback({ type: "success", message: `Stage moved to ${newStage}.` });
      fetchLeadDetails();
      onLeadUpdated();
    } else {
      setFeedback({ type: "error", message: res.error || "Update failed." });
    }
  };

  // Add Note
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !canUpdateStatus) return;

    setIsSubmittingNote(true);
    setFeedback(null);
    try {
      const res = await createLeadNoteAction({
        enquiryId: leadId,
        content: newNoteContent.trim(),
        isPinned: newNotePinned,
      });

      if (res.success) {
        setNewNoteContent("");
        setNewNotePinned(false);
        setFeedback({ type: "success", message: "Internal note added." });
        fetchLeadDetails();
        onLeadUpdated();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to add note." });
      }
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Pin Note
  const handleTogglePin = async (noteId: string, currentPin: boolean) => {
    if (!canUpdateStatus) return;
    const res = await togglePinLeadNoteAction(noteId, !currentPin);
    if (res.success) {
      fetchLeadDetails();
    }
  };

  // Delete Note
  const handleDeleteNote = async (noteId: string) => {
    if (!canDelete) {
      alert("Only SUPER_ADMIN can delete notes to protect the audit trail.");
      return;
    }
    if (!confirm("Are you sure you want to delete this internal note?")) return;

    const res = await deleteLeadNoteAction(noteId);
    if (res.success) {
      setFeedback({ type: "success", message: "Note deleted." });
      fetchLeadDetails();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to delete note." });
    }
  };

  // Schedule Follow-up
  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpTitle.trim() || !followUpDue || !canUpdateStatus) return;

    setIsSubmittingFollowUp(true);
    setFeedback(null);
    try {
      const res = await createLeadFollowUpAction({
        enquiryId: leadId,
        title: followUpTitle.trim(),
        description: followUpDesc.trim() || undefined,
        dueAt: followUpDue,
        priority: followUpPriority,
        assignedToId: followUpAssignee || undefined,
      });

      if (res.success) {
        setFollowUpTitle("");
        setFollowUpDesc("");
        setFollowUpDue("");
        setFeedback({ type: "success", message: "Follow-up scheduled." });
        fetchLeadDetails();
        onLeadUpdated();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to schedule follow-up." });
      }
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  // Toggle Follow-up completion
  const handleToggleFollowUp = async (followUpId: string, currentCompleted: boolean) => {
    if (!canUpdateStatus) return;
    const res = await toggleLeadFollowUpAction(followUpId, !currentCompleted);
    if (res.success) {
      fetchLeadDetails();
      onLeadUpdated();
    }
  };

  // Delete Follow-up
  const handleDeleteFollowUp = async (followUpId: string) => {
    if (!canUpdateStatus) return;
    if (!confirm("Are you sure you want to remove this follow-up task?")) return;
    const res = await deleteLeadFollowUpAction(followUpId);
    if (res.success) {
      fetchLeadDetails();
      onLeadUpdated();
    }
  };

  // Assign lead
  const handleAssignLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminId || !canUpdateStatus) return;

    setIsAssigning(true);
    setFeedback(null);
    try {
      const res = await assignLeadAction({
        enquiryId: leadId,
        adminId: selectedAdminId,
        notes: assignmentNotes.trim() || undefined,
      });

      if (res.success) {
        setAssignmentNotes("");
        setFeedback({ type: "success", message: "Lead assigned successfully." });
        fetchLeadDetails();
        onLeadUpdated();
      } else {
        setFeedback({ type: "error", message: res.error || "Assignment failed." });
      }
    } finally {
      setIsAssigning(false);
    }
  };

  // Unassign lead
  const handleUnassignLead = async () => {
    if (!canUpdateStatus) return;
    if (!confirm("Are you sure you want to unassign this lead?")) return;

    const res = await unassignLeadAction(leadId);
    if (res.success) {
      setFeedback({ type: "success", message: "Lead unassigned." });
      fetchLeadDetails();
      onLeadUpdated();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-lead-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full sm:max-w-xl md:max-w-2xl h-full bg-void-dark border-l border-void-border flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-void-border bg-void-dark/90 flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-void-surface border border-void-subtle text-violet-400">
                {lead?.serviceCategory || "LEAD"}
              </span>

              {/* Stage Selector */}
              {lead && canUpdateStatus ? (
                <select
                  value={lead.status}
                  onChange={(e) => handleStageSelect(e.target.value as EnquiryStatus)}
                  aria-label="Change Lead Stage"
                  className="text-xs font-bold py-1 px-2.5 rounded-lg bg-void-surface border border-void-subtle text-void-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
                >
                  {CRM_STAGES.map((s) => (
                    <option key={s} value={s} className="bg-void-dark text-void-white">
                      {s}
                    </option>
                  ))}
                </select>
              ) : lead ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-void-surface text-void-light border border-void-subtle">
                  {lead.status}
                </span>
              ) : null}
            </div>

            <h2 id="drawer-lead-title" className="text-lg sm:text-xl font-bold text-void-white truncate">
              {lead?.name || "Loading Lead Details..."}
            </h2>

            {lead?.companyName && (
              <div className="flex items-center gap-1.5 text-xs text-void-muted truncate">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{lead.companyName}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-void-muted hover:text-void-white hover:bg-void-surface border border-transparent hover:border-void-subtle transition-colors shrink-0"
            aria-label="Close lead drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-void-border bg-void-dark/50 px-4 sm:px-5 gap-1 overflow-x-auto scrollbar-none">
          {(
            [
              { id: "overview", label: "Overview", icon: FileText },
              { id: "notes", label: `Notes (${lead?.notes?.length ?? 0})`, icon: Pin },
              { id: "activity", label: "Activity", icon: History },
              { id: "followups", label: `Tasks (${lead?.followUps?.length ?? 0})`, icon: CheckSquare },
              { id: "assignment", label: "Assignment", icon: UserCheck },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 py-3 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap",
                  active
                    ? "border-violet-500 text-violet-400 font-semibold"
                    : "border-transparent text-void-muted hover:text-void-light"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <div
            className={cn(
              "p-3 mx-4 mt-3 rounded-xl border text-xs flex items-center justify-between",
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            )}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-void-muted hover:text-void-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-void-surface">
          {isLoading && !lead ? (
            <div className="py-20 flex flex-col items-center justify-center text-void-muted gap-2">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Loading real lead telemetry...</span>
            </div>
          ) : lead ? (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Commercial Value Header */}
                  <div className="p-4 rounded-xl bg-void-surface/50 border border-void-subtle flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-void-muted">Estimated Deal Value</div>
                      <div className="text-xl font-bold text-emerald-400">
                        {formatInr(lead.estimatedValueInr || 0)}
                      </div>
                    </div>
                    {lead.budgetRange && (
                      <div className="text-right">
                        <div className="text-xs font-medium text-void-muted">Stated Budget</div>
                        <div className="text-sm font-semibold text-void-white">{lead.budgetRange}</div>
                      </div>
                    )}
                  </div>

                  {/* Client Contact Grid */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-void-muted uppercase tracking-wider">
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-void-surface/30 border border-void-subtle/50 flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-violet-400 shrink-0" />
                        <div className="truncate">
                          <div className="text-[10px] text-void-muted">Email Address</div>
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-xs font-medium text-void-white hover:text-violet-400 transition-colors truncate block"
                          >
                            {lead.email}
                          </a>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-void-surface/30 border border-void-subtle/50 flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div className="truncate">
                          <div className="text-[10px] text-void-muted">Phone Number</div>
                          {lead.phone ? (
                            <a
                              href={`tel:${lead.phone}`}
                              className="text-xs font-medium text-void-white hover:text-cyan-400 transition-colors"
                            >
                              {lead.phone}
                            </a>
                          ) : (
                            <span className="text-xs text-void-muted italic">Not provided</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-void-muted uppercase tracking-wider">
                      Project Specification & Brief
                    </h3>

                    <div className="p-4 rounded-xl bg-void-surface/40 border border-void-subtle/80 space-y-3">
                      <div>
                        <div className="text-[10px] text-void-muted uppercase tracking-wider mb-1">
                          Client Message / Scope
                        </div>
                        <p className="text-xs text-void-light leading-relaxed whitespace-pre-wrap">
                          {lead.message}
                        </p>
                      </div>

                      {lead.timeline && (
                        <div className="pt-2 border-t border-void-subtle/50 flex items-center gap-2 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-void-muted" />
                          <span className="text-void-muted">Target Timeline:</span>
                          <span className="font-medium text-void-white">{lead.timeline}</span>
                        </div>
                      )}

                      {lead.selectedPackage && (
                        <div className="flex items-center gap-2 text-xs">
                          <IndianRupee className="w-3.5 h-3.5 text-void-muted" />
                          <span className="text-void-muted">Selected Tier:</span>
                          <span className="font-medium text-violet-400">{lead.selectedPackage}</span>
                        </div>
                      )}

                      {lead.referenceUrl && (
                        <div className="flex items-center gap-2 text-xs truncate">
                          <ExternalLink className="w-3.5 h-3.5 text-void-muted shrink-0" />
                          <span className="text-void-muted shrink-0">Reference URL:</span>
                          <a
                            href={lead.referenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-cyan-400 hover:underline truncate"
                          >
                            {lead.referenceUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* If LOST: Lost Reason Box */}
                  {lead.status === "LOST" && lead.lostReason && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Documented Lost Reason</span>
                      </div>
                      <p className="text-xs text-void-light italic pl-5">&ldquo;{lead.lostReason}&rdquo;</p>
                    </div>
                  )}

                  {/* Telemetry metadata */}
                  <div className="pt-4 border-t border-void-subtle/60 grid grid-cols-2 gap-2 text-[11px] text-void-muted">
                    <div>
                      <span>Created: </span>
                      <span className="text-void-light font-medium">
                        {new Date(lead.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span>Last Updated: </span>
                      <span className="text-void-light font-medium">
                        {new Date(lead.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: INTERNAL NOTES */}
              {activeTab === "notes" && (
                <div className="space-y-4">
                  {/* Security Notice */}
                  <div className="p-3 rounded-xl bg-void-surface/60 border border-void-subtle flex items-center gap-2 text-xs text-void-muted">
                    <ShieldAlert className="w-4 h-4 text-violet-400 shrink-0" />
                    <span>
                      Internal notes are confidential to administrators and strictly excluded from client notifications.
                    </span>
                  </div>

                  {/* Add Note Form */}
                  {canUpdateStatus && (
                    <form onSubmit={handleCreateNote} className="space-y-3 p-4 rounded-xl bg-void-surface/30 border border-void-subtle">
                      <label htmlFor="crm-new-note" className="text-xs font-semibold text-void-light block">
                        Add Engineering Note / Deal Assessment
                      </label>
                      <textarea
                        id="crm-new-note"
                        rows={3}
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder="Add private technical evaluation, pricing decisions, or client context..."
                        className="w-full text-xs p-3 rounded-lg bg-void-dark border border-void-border text-void-white placeholder:text-void-muted focus:outline-none focus:border-violet-500/50 resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs text-void-muted cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={newNotePinned}
                            onChange={(e) => setNewNotePinned(e.target.checked)}
                            className="rounded bg-void-dark border-void-border text-violet-500 focus:ring-0"
                          />
                          <span>Pin note to top</span>
                        </label>

                        <button
                          type="submit"
                          disabled={isSubmittingNote || !newNoteContent.trim()}
                          className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isSubmittingNote ? "Adding..." : "Add Note"}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Notes Feed */}
                  <div className="space-y-3 pt-2">
                    {lead.notes?.length === 0 ? (
                      <div className="text-center py-10 text-xs text-void-muted italic border border-dashed border-void-subtle rounded-xl p-4">
                        No internal notes recorded yet.
                      </div>
                    ) : (
                      lead.notes?.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            "p-3.5 rounded-xl border transition-colors space-y-2",
                            n.isPinned
                              ? "bg-violet-500/5 border-violet-500/30"
                              : "bg-void-surface/40 border-void-subtle/80"
                          )}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-void-white">{n.authorName}</span>
                              {n.isPinned && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center gap-1">
                                  <Pin className="w-2.5 h-2.5" /> Pinned
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-void-muted">
                                {new Date(n.createdAt).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>

                              {canUpdateStatus && (
                                <button
                                  type="button"
                                  onClick={() => handleTogglePin(n.id, n.isPinned)}
                                  className="p-1 rounded text-void-muted hover:text-void-white"
                                  title={n.isPinned ? "Unpin note" : "Pin note"}
                                >
                                  <Pin className="w-3 h-3" />
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(n.id)}
                                  className="p-1 rounded text-void-muted hover:text-rose-400"
                                  title="Delete note (Super Admin)"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-void-light whitespace-pre-wrap leading-relaxed">
                            {n.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: ACTIVITY TIMELINE */}
              {activeTab === "activity" && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-void-muted uppercase tracking-wider">
                    Immutable Lifecycle Audit Timeline
                  </h3>

                  <div className="relative pl-6 space-y-4 border-l border-void-subtle ml-2">
                    {lead.activities?.length === 0 ? (
                      <div className="text-xs text-void-muted italic py-4">No activity history recorded yet.</div>
                    ) : (
                      lead.activities?.map((act) => (
                        <div key={act.id} className="relative group">
                          {/* Dot on line */}
                          <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-violet-500 border-2 border-void-dark" />

                          <div className="p-3 rounded-lg bg-void-surface/30 border border-void-subtle/50 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-void-white">{act.description}</span>
                              <span className="text-[10px] text-void-muted">
                                {new Date(act.createdAt).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div className="text-[10px] text-void-muted flex items-center gap-1">
                              <span>Actor:</span>
                              <span className="text-violet-400 font-medium">{act.actorName || "System"}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: FOLLOW-UPS & TASKS */}
              {activeTab === "followups" && (
                <div className="space-y-4">
                  {/* Schedule New Follow-up */}
                  {canUpdateStatus && (
                    <form onSubmit={handleCreateFollowUp} className="space-y-3 p-4 rounded-xl bg-void-surface/30 border border-void-subtle">
                      <h3 className="text-xs font-semibold text-void-light">Schedule Follow-up Task</h3>
                      <div>
                        <input
                          type="text"
                          value={followUpTitle}
                          onChange={(e) => setFollowUpTitle(e.target.value)}
                          placeholder="Task title (e.g. Call client regarding proposal feedback)..."
                          className="w-full text-xs p-2.5 rounded-lg bg-void-dark border border-void-border text-void-white placeholder:text-void-muted focus:outline-none focus:border-violet-500/50"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-void-muted block mb-1">Due Date & Time *</label>
                          <input
                            type="datetime-local"
                            value={followUpDue}
                            onChange={(e) => setFollowUpDue(e.target.value)}
                            className="w-full text-xs p-2 rounded-lg bg-void-dark border border-void-border text-void-white focus:outline-none focus:border-violet-500/50"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-void-muted block mb-1">Priority</label>
                          <select
                            value={followUpPriority}
                            onChange={(e) => setFollowUpPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT")}
                            className="w-full text-xs p-2 rounded-lg bg-void-dark border border-void-border text-void-white focus:outline-none focus:border-violet-500/50"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-void-muted block mb-1">Assign Task To (Optional)</label>
                        <select
                          value={followUpAssignee}
                          onChange={(e) => setFollowUpAssignee(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg bg-void-dark border border-void-border text-void-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
                        >
                          <option value="">Unassigned</option>
                          {activeAdmins.map((adm) => (
                            <option key={adm.id} value={adm.id}>
                              {adm.name} ({adm.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSubmittingFollowUp || !followUpTitle.trim() || !followUpDue}
                          className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors shadow-sm"
                        >
                          {isSubmittingFollowUp ? "Scheduling..." : "Schedule Task"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Tasks List */}
                  <div className="space-y-2.5 pt-2">
                    {lead.followUps?.length === 0 ? (
                      <div className="text-center py-10 text-xs text-void-muted italic border border-dashed border-void-subtle rounded-xl p-4">
                        No follow-up tasks recorded for this lead.
                      </div>
                    ) : (
                      lead.followUps?.map((f) => {
                        const dueDate = new Date(f.dueAt);
                        const isOverdue = !f.isCompleted && dueDate < new Date();
                        return (
                          <div
                            key={f.id}
                            className={cn(
                              "p-3 rounded-xl border flex items-start justify-between gap-3 transition-colors",
                              f.isCompleted
                                ? "bg-void-surface/20 border-void-subtle/40 opacity-70"
                                : isOverdue
                                ? "bg-rose-500/5 border-rose-500/30"
                                : "bg-void-surface/40 border-void-subtle"
                            )}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={f.isCompleted}
                                disabled={!canUpdateStatus}
                                onChange={() => handleToggleFollowUp(f.id, f.isCompleted)}
                                className="mt-0.5 rounded bg-void-dark border-void-border text-violet-500 focus:ring-0 cursor-pointer"
                              />
                              <div className="space-y-0.5">
                                <div
                                  className={cn(
                                    "text-xs font-semibold text-void-white truncate",
                                    f.isCompleted ? "line-through text-void-muted" : ""
                                  )}
                                >
                                  {f.title}
                                </div>
                                {f.description && (
                                  <p className="text-[11px] text-void-light">{f.description}</p>
                                )}
                                <div className="flex items-center gap-2 text-[10px] text-void-muted pt-1">
                                  <span
                                    className={cn(
                                      "px-1.5 py-0.2 rounded font-medium",
                                      isOverdue
                                        ? "text-rose-400 bg-rose-500/10"
                                        : "text-void-light"
                                    )}
                                  >
                                    Due: {dueDate.toLocaleString()}
                                  </span>
                                  <span className="uppercase text-[9px] font-bold tracking-wider text-amber-400">
                                    {f.priority}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {canUpdateStatus && (
                              <button
                                type="button"
                                onClick={() => handleDeleteFollowUp(f.id)}
                                className="p-1 rounded text-void-muted hover:text-rose-400 shrink-0"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: ASSIGNMENT */}
              {activeTab === "assignment" && (
                <div className="space-y-5">
                  {/* Current Assigned Owner */}
                  <div className="p-4 rounded-xl bg-void-surface/40 border border-void-subtle space-y-2">
                    <div className="text-xs font-semibold text-void-muted uppercase tracking-wider">
                      Current Lead Administrator
                    </div>
                    {lead.assignedAdmin ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-300 font-bold text-sm">
                            {lead.assignedAdmin.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-void-white">
                              {lead.assignedAdmin.name}
                            </div>
                            <div className="text-[11px] text-void-muted">
                              {lead.assignedAdmin.email} ({lead.assignedAdmin.role})
                            </div>
                          </div>
                        </div>

                        {canUpdateStatus && (
                          <button
                            type="button"
                            onClick={handleUnassignLead}
                            className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                          >
                            Unassign
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-void-muted italic">
                        Unassigned — Any authorized administrator may claim or assign this lead.
                      </div>
                    )}
                  </div>

                  {/* Reassign Form */}
                  {canUpdateStatus && (
                    <form onSubmit={handleAssignLead} className="p-4 rounded-xl bg-void-surface/30 border border-void-subtle space-y-3">
                      <h3 className="text-xs font-semibold text-void-light">
                        {lead.assignedAdmin ? "Reassign Deal" : "Assign to Team Member"}
                      </h3>

                      <div>
                        <label className="text-[10px] text-void-muted block mb-1">Eligible Active Administrator</label>
                        <select
                          value={selectedAdminId}
                          onChange={(e) => setSelectedAdminId(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-lg bg-void-dark border border-void-border text-void-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
                        >
                          <option value="">Select Administrator...</option>
                          {activeAdmins.map((adm) => (
                            <option key={adm.id} value={adm.id}>
                              {adm.name} ({adm.role}) — {adm.email}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-void-muted block mb-1">Assignment Note (Optional)</label>
                        <input
                          type="text"
                          value={assignmentNotes}
                          onChange={(e) => setAssignmentNotes(e.target.value)}
                          placeholder="e.g. Lead requested high-concurrency cloud architecture expertise..."
                          className="w-full text-xs p-2.5 rounded-lg bg-void-dark border border-void-border text-void-white placeholder:text-void-muted focus:outline-none focus:border-violet-500/50"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isAssigning || !selectedAdminId}
                          className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors shadow-sm"
                        >
                          {isAssigning ? "Assigning..." : "Confirm Assignment"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Assignment History */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-void-muted uppercase tracking-wider">
                      Assignment History
                    </h4>
                    {lead.assignments?.length === 0 ? (
                      <div className="text-xs text-void-muted italic">No previous assignments.</div>
                    ) : (
                      lead.assignments?.map((asg) => (
                        <div
                          key={asg.id}
                          className="p-3 rounded-lg bg-void-surface/30 border border-void-subtle text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-void-white">
                              {asg.admin?.name || "Admin"}
                            </span>
                            <span className="text-[10px] text-void-muted">
                              {new Date(asg.assignedAt).toLocaleDateString()}
                            </span>
                          </div>
                          {asg.assignedByName && (
                            <div className="text-[10px] text-void-muted">
                              Assigned by: <span className="text-void-light">{asg.assignedByName}</span>
                            </div>
                          )}
                          {asg.notes && <p className="text-[11px] text-void-light italic">&ldquo;{asg.notes}&rdquo;</p>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
