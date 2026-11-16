"use client";

import * as React from "react";
import type { EnquiryStatus, ServiceCategory } from "@prisma/client";
import {
  Building2,
  Clock,
  MessageSquare,
  CheckSquare,
  User,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatInr } from "./crm-dashboard-kpis";
import { CRM_STAGES } from "@/validations/crm";

export interface KanbanLeadItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  serviceCategory: ServiceCategory;
  status: EnquiryStatus;
  estimatedValueInr?: number | null;
  budgetRange?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  nextFollowUpAt?: Date | string | null;
  assignedAdmin?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  _count?: {
    notes: number;
    followUps: number;
  };
  followUps?: Array<{
    id: string;
    title: string;
    dueAt: Date | string;
    priority: string;
  }>;
}

interface CrmLeadCardProps {
  lead: KanbanLeadItem;
  canUpdateStatus: boolean;
  onSelect: (lead: KanbanLeadItem) => void;
  onStageChange: (lead: KanbanLeadItem, newStage: EnquiryStatus) => void;
}

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  WEB_DEVELOPMENT: "Web Dev",
  MOBILE_DEVELOPMENT: "Mobile App",
  API_BACKEND: "Backend",
  AI_AUTOMATION: "AI & ML",
  BOTS_AUTOMATION: "Automation",
  DESIGN_CREATIVE: "UI/UX",
  ENTERPRISE_SYSTEMS: "Enterprise",
  FINTECH_PAYMENTS: "Fintech",
  CLOUD_HOSTING: "Cloud",
  OTHER: "Custom",
};

export function CrmLeadCard({
  lead,
  canUpdateStatus,
  onSelect,
  onStageChange,
}: CrmLeadCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const now = new Date();
  const nextFollowUp = lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt) : null;
  const isOverdue = nextFollowUp ? nextFollowUp < now : false;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ leadId: lead.id, currentStatus: lead.status }));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable={canUpdateStatus}
      onDragStart={handleDragStart}
      onClick={() => onSelect(lead)}
      className={cn(
        "group relative p-3.5 rounded-xl bg-void-surface/80 border border-void-subtle hover:border-violet-500/40 hover:bg-void-surface transition-all duration-150 shadow-sm cursor-pointer select-none",
        canUpdateStatus ? "cursor-grab active:cursor-grabbing" : ""
      )}
    >
      {/* Top row: Category tag & Quick Move Menu */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-void-dark border border-void-border text-violet-400">
          {CATEGORY_LABELS[lead.serviceCategory] || lead.serviceCategory}
        </span>

        {/* Quick Stage Move Dropdown (Keyboard & Touch accessible alternative) */}
        {canUpdateStatus && (
          <div
            ref={menuRef}
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label={`Move stage for ${lead.name}`}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-md text-void-muted hover:text-void-white hover:bg-void-dark transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1 w-44 p-1.5 bg-void-dark border border-void-border rounded-xl shadow-2xl z-20 space-y-0.5 animate-in fade-in duration-100"
              >
                <div className="px-2 py-1 text-[10px] font-semibold text-void-muted uppercase tracking-wider">
                  Move to Stage:
                </div>
                {CRM_STAGES.map((s) => (
                  <button
                    key={s}
                    role="menuitem"
                    disabled={s === lead.status}
                    onClick={() => {
                      setMenuOpen(false);
                      onStageChange(lead, s);
                    }}
                    className={cn(
                      "w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between",
                      s === lead.status
                        ? "text-void-muted bg-void-surface/30 cursor-default"
                        : "text-void-light hover:text-void-white hover:bg-violet-600/20"
                    )}
                  >
                    <span>{s}</span>
                    {s === lead.status && <span className="text-[10px] text-violet-400">Current</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Client Name & Company */}
      <h4 className="text-sm font-semibold text-void-white truncate group-hover:text-violet-300 transition-colors">
        {lead.name}
      </h4>

      {lead.companyName && (
        <div className="flex items-center gap-1 text-[11px] text-void-muted mt-0.5 truncate">
          <Building2 className="w-3 h-3 shrink-0" />
          <span className="truncate">{lead.companyName}</span>
        </div>
      )}

      {/* Value Badge */}
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-xs font-bold text-emerald-400">
          {formatInr(lead.estimatedValueInr || 0)}
        </span>

        {/* Assigned Admin badge */}
        <div className="flex items-center gap-1 text-[11px] text-void-light bg-void-dark/60 px-2 py-0.5 rounded-md border border-void-subtle">
          <User className="w-3 h-3 text-void-muted shrink-0" />
          <span className="truncate max-w-[80px]">
            {lead.assignedAdmin ? lead.assignedAdmin.name : "Unassigned"}
          </span>
        </div>
      </div>

      {/* Bottom telemetry & follow-up strip */}
      <div className="mt-3 pt-2 border-t border-void-subtle/60 flex items-center justify-between text-[11px]">
        {/* Next Follow-up indicator */}
        {nextFollowUp ? (
          <div
            className={cn(
              "flex items-center gap-1 font-medium text-[10px] px-1.5 py-0.5 rounded",
              isOverdue
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                : "bg-void-dark text-void-muted border border-void-border"
            )}
            title={`Follow-up due: ${nextFollowUp.toLocaleString()}`}
          >
            <Clock className="w-3 h-3 shrink-0" />
            <span>{isOverdue ? "Overdue" : nextFollowUp.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
          </div>
        ) : (
          <span className="text-[10px] text-void-muted">No task</span>
        )}

        {/* Notes & Tasks counters */}
        <div className="flex items-center gap-2 text-void-muted">
          {(lead._count?.notes ?? 0) > 0 && (
            <div className="flex items-center gap-0.5 text-[10px]" title={`${lead._count?.notes} notes`}>
              <MessageSquare className="w-3 h-3" />
              <span>{lead._count?.notes}</span>
            </div>
          )}
          {(lead._count?.followUps ?? 0) > 0 && (
            <div className="flex items-center gap-0.5 text-[10px]" title={`${lead._count?.followUps} tasks`}>
              <CheckSquare className="w-3 h-3" />
              <span>{lead._count?.followUps}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
