"use client";

import * as React from "react";
import type { EnquiryStatus, UserRole } from "@prisma/client";
import { AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { CrmStageColumn } from "./crm-stage-column";
import { CrmLostReasonModal } from "./crm-lost-reason-modal";
import { CrmLeadDrawer } from "./crm-lead-drawer";
import {
  updateLeadStageAction,
  type KanbanStageColumn,
} from "@/server/actions/crm.actions";
import { hasPermission } from "@/server/security/rbac";
import type { KanbanLeadItem } from "./crm-lead-card";

interface CrmKanbanProps {
  initialColumns: KanbanStageColumn[];
  userRole: UserRole;
  onRefresh?: () => void;
}

export function CrmKanban({
  initialColumns,
  userRole,
  onRefresh,
}: CrmKanbanProps) {
  const [columns, setColumns] = React.useState<KanbanStageColumn[]>(initialColumns);
  const [selectedLeadId, setSelectedLeadId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error" | "conflict";
    message: string;
  } | null>(null);

  // Lost Reason Modal State
  const [lostModalState, setLostModalState] = React.useState<{
    isOpen: boolean;
    lead: KanbanLeadItem | null;
  }>({ isOpen: false, lead: null });

  const canUpdateStatus = hasPermission(userRole, "enquiries:update_status");
  const canDelete = hasPermission(userRole, "enquiries:delete");

  // Keep internal columns in sync when props change
  React.useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  // Execute stage update with optimistic UI & rollback
  const executeStageUpdate = async (
    lead: KanbanLeadItem,
    targetStage: EnquiryStatus,
    lostReason?: string
  ) => {
    if (lead.status === targetStage) return;

    // Snapshot previous columns for rollback
    const previousColumns: KanbanStageColumn[] = columns.map((col) => ({
      ...col,
      leads: [...col.leads],
    }));

    // Optimistic UI Update: Move lead between columns
    setColumns((prevCols) => {
      const updatedLead = { ...lead, status: targetStage, updatedAt: new Date() };
      return prevCols.map((col) => {
        if (col.stage === lead.status) {
          const filtered = col.leads.filter((l) => l.id !== lead.id);
          const val = col.totalValueInr - (lead.estimatedValueInr || 0);
          return {
            ...col,
            count: filtered.length,
            totalValueInr: Math.max(0, val),
            leads: filtered,
          };
        }
        if (col.stage === targetStage) {
          const added = [updatedLead, ...col.leads];
          const val = col.totalValueInr + (lead.estimatedValueInr || 0);
          return {
            ...col,
            count: added.length,
            totalValueInr: val,
            leads: added,
          };
        }
        return col;
      });
    });

    try {
      const res = await updateLeadStageAction({
        enquiryId: lead.id,
        newStatus: targetStage,
        expectedUpdatedAt: lead.updatedAt,
        lostReason,
      });

      if (!res.success) {
        // Rollback on server rejection
        setColumns(previousColumns);
        setFeedback({
          type: res.code === "CONFLICT_DETECTED" ? "conflict" : "error",
          message: res.error || "Failed to update lead stage.",
        });
        return;
      }

      setFeedback({
        type: "success",
        message: `Lead "${lead.name}" moved to ${targetStage}.`,
      });

      // Update lead with official server data
      setColumns((prevCols) =>
        prevCols.map((col) => {
          if (col.stage === targetStage) {
            return {
              ...col,
              leads: col.leads.map((l) =>
                l.id === lead.id ? ({ ...l, ...res.data } as unknown as KanbanLeadItem) : l
              ),
            };
          }
          return col;
        })
      );
    } catch {
      // Rollback on network/client error
      setColumns(previousColumns);
      setFeedback({
        type: "error",
        message: "An unexpected error occurred while updating lead stage.",
      });
    }
  };

  const handleStageChangeRequest = (
    lead: KanbanLeadItem,
    targetStage: EnquiryStatus
  ) => {
    if (!canUpdateStatus) {
      setFeedback({
        type: "error",
        message: "Your role (EDITOR) does not have permission to update lead stages.",
      });
      return;
    }

    if (targetStage === "LOST") {
      setLostModalState({ isOpen: true, lead });
    } else {
      executeStageUpdate(lead, targetStage);
    }
  };

  const handleLostConfirm = (reason: string) => {
    if (lostModalState.lead) {
      executeStageUpdate(lostModalState.lead, "LOST", reason);
    }
    setLostModalState({ isOpen: false, lead: null });
  };

  const handleDropLead = (leadId: string, targetStage: EnquiryStatus) => {
    let targetLead: KanbanLeadItem | null = null;
    for (const col of columns) {
      const match = col.leads.find((l) => l.id === leadId);
      if (match) {
        targetLead = match;
        break;
      }
    }
    if (targetLead) {
      handleStageChangeRequest(targetLead, targetStage);
    }
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          className={`p-3 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : feedback.type === "conflict"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>

          <div className="flex items-center gap-2">
            {feedback.type === "conflict" && onRefresh && (
              <button
                type="button"
                onClick={() => {
                  setFeedback(null);
                  onRefresh();
                }}
                className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 font-medium flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Refresh Board
              </button>
            )}
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="px-2 py-0.5 rounded text-void-muted hover:text-void-white transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 8-Stage Kanban Pipeline Scroll Container */}
      <div className="relative w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-void-surface scrollbar-track-transparent">
        <div className="flex items-start gap-4 min-w-[2600px] xl:min-w-full">
          {columns.map((col) => (
            <CrmStageColumn
              key={col.stage}
              stage={col.stage}
              label={col.label}
              count={col.count}
              totalValueInr={col.totalValueInr}
              leads={col.leads}
              canUpdateStatus={canUpdateStatus}
              onSelectLead={(lead) => setSelectedLeadId(lead.id)}
              onStageChange={handleStageChangeRequest}
              onDropLead={handleDropLead}
            />
          ))}
        </div>
      </div>

      {/* Mandatory Lost Reason Modal */}
      <CrmLostReasonModal
        isOpen={lostModalState.isOpen}
        leadName={lostModalState.lead?.name || ""}
        onConfirm={handleLostConfirm}
        onCancel={() => setLostModalState({ isOpen: false, lead: null })}
      />

      {/* Lead Detail Drawer */}
      {selectedLeadId && (
        <CrmLeadDrawer
          leadId={selectedLeadId}
          userRole={userRole}
          canUpdateStatus={canUpdateStatus}
          canDelete={canDelete}
          onClose={() => setSelectedLeadId(null)}
          onLeadUpdated={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
