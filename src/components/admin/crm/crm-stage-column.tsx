"use client";

import * as React from "react";
import type { EnquiryStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { formatInr } from "./crm-dashboard-kpis";
import { CrmLeadCard, type KanbanLeadItem } from "./crm-lead-card";

interface CrmStageColumnProps {
  stage: EnquiryStatus;
  label: string;
  count: number;
  totalValueInr: number;
  leads: KanbanLeadItem[];
  canUpdateStatus: boolean;
  onSelectLead: (lead: KanbanLeadItem) => void;
  onStageChange: (lead: KanbanLeadItem, newStage: EnquiryStatus) => void;
  onDropLead: (leadId: string, targetStage: EnquiryStatus) => void;
}

const STAGE_THEME: Record<
  EnquiryStatus,
  { indicator: string; borderFocus: string; countBg: string }
> = {
  NEW: {
    indicator: "bg-blue-500",
    borderFocus: "border-blue-500/60 bg-blue-500/5",
    countBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  CONTACTED: {
    indicator: "bg-cyan-500",
    borderFocus: "border-cyan-500/60 bg-cyan-500/5",
    countBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
  QUALIFIED: {
    indicator: "bg-violet-500",
    borderFocus: "border-violet-500/60 bg-violet-500/5",
    countBg: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
  PROPOSAL_SENT: {
    indicator: "bg-purple-500",
    borderFocus: "border-purple-500/60 bg-purple-500/5",
    countBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  NEGOTIATION: {
    indicator: "bg-amber-500",
    borderFocus: "border-amber-500/60 bg-amber-500/5",
    countBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  WON: {
    indicator: "bg-emerald-500",
    borderFocus: "border-emerald-500/60 bg-emerald-500/5",
    countBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  LOST: {
    indicator: "bg-rose-500",
    borderFocus: "border-rose-500/60 bg-rose-500/5",
    countBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
  ON_HOLD: {
    indicator: "bg-neutral-500",
    borderFocus: "border-neutral-500/60 bg-neutral-500/5",
    countBg: "bg-neutral-800 text-neutral-400 border-neutral-700",
  },
};

export function CrmStageColumn({
  stage,
  label,
  count,
  totalValueInr,
  leads,
  canUpdateStatus,
  onSelectLead,
  onStageChange,
  onDropLead,
}: CrmStageColumnProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const theme = STAGE_THEME[stage];

  const handleDragOver = (e: React.DragEvent) => {
    if (!canUpdateStatus) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!canUpdateStatus) return;
    e.preventDefault();
    setIsDragOver(false);

    try {
      const dataStr = e.dataTransfer.getData("text/plain");
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        if (parsed.leadId && parsed.currentStatus !== stage) {
          onDropLead(parsed.leadId, stage);
        }
      }
    } catch {
      // Ignore invalid drag payload
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col w-72 sm:w-80 shrink-0 bg-void-dark/70 rounded-2xl border transition-all duration-200 min-h-[580px] max-h-[85vh] p-3",
        isDragOver
          ? theme.borderFocus
          : "border-void-border/80 hover:border-void-border"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-void-subtle/80">
        <div className="flex items-center gap-2">
          <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", theme.indicator)} />
          <h3 className="text-xs font-bold text-void-white uppercase tracking-wider">
            {label}
          </h3>
          <span
            className={cn(
              "text-[11px] font-bold px-2 py-0.5 rounded-full border",
              theme.countBg
            )}
          >
            {count}
          </span>
        </div>

        {/* Monetary aggregate for column */}
        <span className="text-[11px] font-semibold text-void-light font-mono">
          {formatInr(totalValueInr)}
        </span>
      </div>

      {/* Leads List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-void-surface scrollbar-track-transparent">
        {leads.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center rounded-xl border border-dashed border-void-subtle/50 text-center p-4">
            <span className="text-xs text-void-muted">No leads in {label}</span>
            {canUpdateStatus && (
              <span className="text-[10px] text-void-muted/60 mt-1">
                Drag a card here to update stage
              </span>
            )}
          </div>
        ) : (
          leads.map((lead) => (
            <CrmLeadCard
              key={lead.id}
              lead={lead}
              canUpdateStatus={canUpdateStatus}
              onSelect={onSelectLead}
              onStageChange={onStageChange}
            />
          ))
        )}
      </div>
    </div>
  );
}

