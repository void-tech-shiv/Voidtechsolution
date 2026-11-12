"use client";

import * as React from "react";
import type { EnquiryStatus } from "@prisma/client";
import {
  Users,
  Sparkles,
  TrendingUp,
  Award,
  Target,
  AlertTriangle,
} from "lucide-react";
import type { CrmMetrics } from "@/server/actions/crm.actions";
import { cn } from "@/lib/utils";

interface CrmDashboardKpisProps {
  metrics: CrmMetrics;
}

export function formatInr(val: number): string {
  if (isNaN(val) || val === 0) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

const STAGE_CONFIG: Record<
  EnquiryStatus,
  { label: string; color: string; bg: string }
> = {
  NEW: { label: "New", color: "text-blue-400", bg: "bg-blue-500" },
  CONTACTED: { label: "Contacted", color: "text-cyan-400", bg: "bg-cyan-500" },
  QUALIFIED: { label: "Qualified", color: "text-violet-400", bg: "bg-violet-500" },
  PROPOSAL_SENT: { label: "Proposal Sent", color: "text-purple-400", bg: "bg-purple-500" },
  NEGOTIATION: { label: "Negotiation", color: "text-amber-400", bg: "bg-amber-500" },
  WON: { label: "Won", color: "text-emerald-400", bg: "bg-emerald-500" },
  LOST: { label: "Lost", color: "text-rose-400", bg: "bg-rose-500" },
  ON_HOLD: { label: "On Hold", color: "text-neutral-400", bg: "bg-neutral-600" },
};

export function CrmDashboardKpis({ metrics }: CrmDashboardKpisProps) {
  const kpis = [
    {
      id: "total-leads",
      label: "Total Leads",
      value: metrics.totalLeads.toLocaleString(),
      subtext: "All recorded enquiries",
      icon: Users,
      color: "text-void-white",
      iconColor: "text-blue-400",
      borderGlow: "hover:border-blue-500/30",
    },
    {
      id: "new-leads",
      label: "New Leads",
      value: metrics.newLeads.toLocaleString(),
      subtext: "Awaiting first response",
      icon: Sparkles,
      color: "text-blue-400",
      iconColor: "text-blue-400",
      borderGlow: "hover:border-blue-500/40",
    },
    {
      id: "active-pipeline",
      label: "Active Pipeline",
      value: formatInr(metrics.activePipelineValueInr),
      subtext: "Estimated deal value",
      icon: TrendingUp,
      color: "text-violet-400",
      iconColor: "text-violet-400",
      borderGlow: "hover:border-violet-500/30",
    },
    {
      id: "won-revenue",
      label: "Won Revenue",
      value: formatInr(metrics.wonRevenueInr),
      subtext: "Closed-won contracts",
      icon: Award,
      color: "text-emerald-400",
      iconColor: "text-emerald-400",
      borderGlow: "hover:border-emerald-500/30",
    },
    {
      id: "win-rate",
      label: "Win Rate",
      value: `${metrics.winRatePercentage}%`,
      subtext: "Won / (Won + Lost)",
      icon: Target,
      color: "text-purple-400",
      iconColor: "text-purple-400",
      borderGlow: "hover:border-purple-500/30",
    },
    {
      id: "overdue-followups",
      label: "Overdue Follow-ups",
      value: metrics.overdueFollowUpsCount.toLocaleString(),
      subtext: "Tasks past due date",
      icon: AlertTriangle,
      color: metrics.overdueFollowUpsCount > 0 ? "text-amber-400" : "text-neutral-400",
      iconColor: metrics.overdueFollowUpsCount > 0 ? "text-amber-400" : "text-neutral-500",
      borderGlow: metrics.overdueFollowUpsCount > 0 ? "border-amber-500/40 hover:border-amber-500/60" : "hover:border-neutral-700",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 6 Top KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.id}
              className={cn(
                "p-4 rounded-xl bg-void-dark/80 border border-void-border backdrop-blur-sm transition-all duration-200",
                kpi.borderGlow
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-void-muted tracking-wider uppercase">
                  {kpi.label}
                </span>
                <div className="p-1.5 rounded-lg bg-void-surface border border-void-subtle">
                  <Icon className={cn("w-4 h-4", kpi.iconColor)} />
                </div>
              </div>
              <div className={cn("text-xl sm:text-2xl font-bold tracking-tight", kpi.color)}>
                {kpi.value}
              </div>
              <div className="text-[11px] text-void-muted mt-1 truncate">
                {kpi.subtext}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage Distribution Visualizer */}
      <div className="p-4 sm:p-5 rounded-xl bg-void-dark/60 border border-void-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-void-white">Pipeline Stage Distribution</h3>
          <span className="text-xs text-void-muted">
            {metrics.totalLeads} Total Lead{metrics.totalLeads === 1 ? "" : "s"}
          </span>
        </div>

        {/* Multi-segment distribution progress bar */}
        <div className="h-2.5 w-full bg-void-surface rounded-full overflow-hidden flex">
          {Object.entries(metrics.stageDistribution).map(([stageKey, data]) => {
            const pct = metrics.totalLeads > 0 ? (data.count / metrics.totalLeads) * 100 : 0;
            if (pct === 0) return null;
            const cfg = STAGE_CONFIG[stageKey as EnquiryStatus];
            return (
              <div
                key={stageKey}
                style={{ width: `${pct}%` }}
                className={cn("h-full transition-all duration-300", cfg.bg)}
                title={`${cfg.label}: ${data.count} (${Math.round(pct)}%) — ${formatInr(data.totalValueInr)}`}
              />
            );
          })}
        </div>

        {/* Stage Pills & Counts */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {Object.entries(metrics.stageDistribution).map(([stageKey, data]) => {
            const cfg = STAGE_CONFIG[stageKey as EnquiryStatus];
            return (
              <div
                key={stageKey}
                className="p-2 rounded-lg bg-void-surface/50 border border-void-subtle/50 text-center"
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className={cn("w-2 h-2 rounded-full", cfg.bg)} />
                  <span className="text-xs font-medium text-void-light truncate">
                    {cfg.label}
                  </span>
                </div>
                <div className="text-sm font-bold text-void-white">{data.count}</div>
                <div className="text-[10px] text-void-muted truncate">
                  {formatInr(data.totalValueInr)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
