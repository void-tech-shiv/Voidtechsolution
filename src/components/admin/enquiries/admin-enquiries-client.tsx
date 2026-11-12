"use client";

import * as React from "react";
import type { Enquiry, EnquiryStatus, UserRole } from "@prisma/client";
import {
  Search,
  Filter,
  Eye,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
import {
  updateEnquiryStatusAction,
  appendEnquiryNoteAction,
  deleteEnquiryAction,
} from "@/server/actions/admin-content.actions";
import { hasPermission } from "@/server/security/rbac";

interface AdminEnquiriesClientProps {
  initialEnquiries: Enquiry[];
  stats: Record<EnquiryStatus, number>;
  userRole: UserRole;
}

const STATUS_CONFIG: Record<
  EnquiryStatus,
  { label: string; badgeClass: string }
> = {
  NEW: { label: "New", badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  CONTACTED: { label: "Contacted", badgeClass: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  QUALIFIED: { label: "Qualified", badgeClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  PROPOSAL_SENT: { label: "Proposal Sent", badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  NEGOTIATION: { label: "Negotiation", badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  WON: { label: "Won", badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  LOST: { label: "Lost", badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  ON_HOLD: { label: "On Hold", badgeClass: "bg-neutral-800 text-neutral-400 border-neutral-700" },
};

export function AdminEnquiriesClient({
  initialEnquiries,
  stats,
  userRole,
}: AdminEnquiriesClientProps) {
  const [enquiries, setEnquiries] = React.useState<Enquiry[]>(initialEnquiries);
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedEnquiry, setSelectedEnquiry] = React.useState<Enquiry | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const [newNote, setNewNote] = React.useState("");
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const canUpdateStatus = hasPermission(userRole, "enquiries:update_status");
  const canDelete = hasPermission(userRole, "enquiries:delete");

  const filteredEnquiries = React.useMemo(() => {
    return enquiries.filter((item) => {
      const matchesStatus = selectedStatus === "ALL" || item.status === selectedStatus;
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        (item.companyName && item.companyName.toLowerCase().includes(q)) ||
        item.message.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [enquiries, selectedStatus, searchTerm]);

  const handleStatusChange = async (enquiryId: string, newStatus: EnquiryStatus) => {
    if (!canUpdateStatus) {
      setFeedback({ type: "error", message: "Your role (EDITOR) is read-only for enquiry status." });
      return;
    }

    setIsPending(true);
    setFeedback(null);

    try {
      const res = await updateEnquiryStatusAction(enquiryId, newStatus);
      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to update status." });
        return;
      }

      setEnquiries((prev) =>
        prev.map((e) => (e.id === enquiryId ? { ...e, status: newStatus } : e))
      );
      if (selectedEnquiry && selectedEnquiry.id === enquiryId) {
        setSelectedEnquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      setFeedback({ type: "success", message: `Enquiry status updated to ${newStatus}.` });
    } catch {
      setFeedback({ type: "error", message: "Failed to update status." });
    } finally {
      setIsPending(false);
    }
  };

  const handleAppendNote = async (enquiryId: string) => {
    if (!canUpdateStatus) return;
    if (!newNote.trim()) return;

    setIsPending(true);
    setFeedback(null);

    try {
      const res = await appendEnquiryNoteAction(enquiryId, newNote.trim());
      if (!res.success || !res.data) {
        setFeedback({ type: "error", message: res.error || "Failed to append note." });
        return;
      }

      setEnquiries((prev) =>
        prev.map((e) => (e.id === enquiryId ? (res.data as Enquiry) : e))
      );
      setSelectedEnquiry(res.data as Enquiry);
      setNewNote("");
      setFeedback({ type: "success", message: "Internal note added." });
    } catch {
      setFeedback({ type: "error", message: "Failed to add note." });
    } finally {
      setIsPending(false);
    }
  };

  const handleDeleteEnquiry = async (enquiryId: string) => {
    if (!canDelete) {
      setFeedback({ type: "error", message: "Only SUPER_ADMIN can delete enquiries." });
      return;
    }

    if (!window.confirm("Permanently delete this enquiry record?")) return;

    setIsPending(true);
    setFeedback(null);

    try {
      const res = await deleteEnquiryAction(enquiryId);
      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to delete enquiry." });
        return;
      }

      setEnquiries((prev) => prev.filter((e) => e.id !== enquiryId));
      if (selectedEnquiry && selectedEnquiry.id === enquiryId) {
        setSelectedEnquiry(null);
      }
      setFeedback({ type: "success", message: "Enquiry permanently deleted." });
    } catch {
      setFeedback({ type: "error", message: "Failed to delete enquiry." });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-enquiries-page">
      {/* Header & Role Indicator */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Client Enquiries & Leads
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            {canUpdateStatus
              ? "Review, manage status, and track internal notes on inbound leads."
              : "Read-only lead inspection mode (EDITOR role)."}
          </p>
        </div>
        {!canUpdateStatus && (
          <span className="rounded-xl border border-amber-500/20 bg-amber-950/30 px-3 py-1.5 text-xs text-amber-300">
            Read-Only Access
          </span>
        )}
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(Object.keys(STATUS_CONFIG) as EnquiryStatus[]).map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(selectedStatus === st ? "ALL" : st)}
            className={`flex flex-col rounded-2xl border p-4 text-left transition-all ${
              selectedStatus === st
                ? "border-violet-500/50 bg-violet-600/10 shadow-lg shadow-violet-600/5"
                : "border-white/10 bg-neutral-900/40 hover:border-white/20"
            }`}
          >
            <span className="text-xs text-neutral-400">{STATUS_CONFIG[st].label}</span>
            <span className="mt-1 text-2xl font-bold text-white">{stats[st] || 0}</span>
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-neutral-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client name, email, company, or message..."
            className="w-full rounded-xl border border-white/10 bg-neutral-950 py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-500" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
          >
            <option value="ALL">All Statuses ({enquiries.length})</option>
            {(Object.keys(STATUS_CONFIG) as EnquiryStatus[]).map((st) => (
              <option key={st} value={st}>
                {STATUS_CONFIG[st].label} ({stats[st] || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          data-testid="admin-enquiries-feedback"
          className={`flex items-center justify-between rounded-xl border p-4 text-sm ${
            feedback.type === "success"
              ? "border-emerald-500/20 bg-emerald-950/30 text-emerald-300"
              : "border-red-500/20 bg-red-950/30 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Enquiries Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-300" data-testid="admin-enquiries-table">
            <thead className="border-b border-white/10 bg-neutral-950/60 text-xs uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Lead Contact</th>
                <th className="px-6 py-4 font-semibold">Category & Package</th>
                <th className="px-6 py-4 font-semibold">Budget</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Received</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    No client enquiries found.
                  </td>
                </tr>
              ) : (
                filteredEnquiries.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-neutral-400">{item.email}</div>
                      {item.companyName && (
                        <div className="text-[11px] text-neutral-500">{item.companyName}</div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-neutral-200">{item.serviceCategory}</div>
                      <div className="text-[11px] text-violet-400">
                        {item.selectedPackage || "Custom Scope"}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-neutral-300">
                      {item.budgetRange || "Flexible"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                          STATUS_CONFIG[item.status]?.badgeClass
                        }`}
                      >
                        {STATUS_CONFIG[item.status]?.label || item.status}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-neutral-500">
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedEnquiry(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/5 bg-neutral-800/80 px-2.5 py-1 text-xs text-neutral-300 hover:border-violet-500/30 hover:bg-neutral-800 hover:text-white"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </button>
                        {canDelete && (
                          <button
                            disabled={isPending}
                            onClick={() => handleDeleteEnquiry(item.id)}
                            className="rounded-lg border border-red-500/20 bg-red-950/20 p-1 text-red-400 hover:bg-red-900/40"
                            title="Delete enquiry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enquiry Details Modal */}
      {selectedEnquiry && (
        <div
          data-testid="enquiry-detail-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Lead Details & Requirements</h2>
                <div className="text-xs text-neutral-400">ID: {selectedEnquiry.id}</div>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Client Info Grid */}
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-neutral-950 p-4 sm:grid-cols-3">
                <div>
                  <span className="text-neutral-500">Contact:</span>
                  <div className="font-semibold text-white">{selectedEnquiry.name}</div>
                </div>
                <div>
                  <span className="text-neutral-500">Email:</span>
                  <div className="font-mono text-neutral-300">{selectedEnquiry.email}</div>
                </div>
                <div>
                  <span className="text-neutral-500">Phone:</span>
                  <div className="text-neutral-300">{selectedEnquiry.phone || "Not provided"}</div>
                </div>
                <div>
                  <span className="text-neutral-500">Organization:</span>
                  <div className="text-neutral-300">{selectedEnquiry.companyName || "N/A"}</div>
                </div>
                <div>
                  <span className="text-neutral-500">Category:</span>
                  <div className="text-violet-400">{selectedEnquiry.serviceCategory}</div>
                </div>
                <div>
                  <span className="text-neutral-500">Budget / Timeline:</span>
                  <div className="text-neutral-300">
                    {selectedEnquiry.budgetRange || "Open"} • {selectedEnquiry.timeline || "Normal"}
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <div className="mb-1 font-semibold text-neutral-300">Client Project Brief:</div>
                <div className="rounded-xl border border-white/5 bg-neutral-950 p-4 text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {selectedEnquiry.message}
                </div>
              </div>

              {/* Status Update Control */}
              {canUpdateStatus && (
                <div className="rounded-xl border border-white/10 bg-neutral-950 p-4">
                  <div className="mb-2 font-semibold text-white">Manage Status:</div>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(STATUS_CONFIG) as EnquiryStatus[]).map((st) => (
                      <button
                        key={st}
                        disabled={isPending || selectedEnquiry.status === st}
                        onClick={() => handleStatusChange(selectedEnquiry.id, st)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                          selectedEnquiry.status === st
                            ? "border-violet-500 bg-violet-600 text-white"
                            : "border-white/10 bg-neutral-900 text-neutral-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {STATUS_CONFIG[st].label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Internal Notes */}
              <div>
                <div className="mb-1 font-semibold text-neutral-300">Internal Audit & Review Notes:</div>
                <div className="rounded-xl border border-white/5 bg-neutral-950 p-4 font-mono text-[11px] text-neutral-400 whitespace-pre-wrap">
                  {selectedEnquiry.internalNotes || "No internal notes recorded yet."}
                </div>

                {canUpdateStatus && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add an internal reviewer note..."
                      className="flex-1 rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-violet-500 focus:outline-none"
                    />
                    <button
                      disabled={isPending || !newNote.trim()}
                      onClick={() => handleAppendNote(selectedEnquiry.id)}
                      className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
                    >
                      Add Note
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="rounded-xl border border-white/10 bg-neutral-800 px-4 py-2 text-xs font-medium text-white hover:bg-neutral-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
