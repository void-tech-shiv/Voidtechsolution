"use client";

import * as React from "react";
import type { ServiceCategory } from "@prisma/client";
import {
  Search,
  X,
  RefreshCw,
  Kanban,
  CheckSquare,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CrmFiltersProps {
  viewMode: "kanban" | "followups";
  onViewModeChange: (mode: "kanban" | "followups") => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  selectedAdminId: string;
  onAdminChange: (val: string) => void;
  overdueOnly: boolean;
  onOverdueToggle: (val: boolean) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  activeAdmins: Array<{ id: string; name: string }>;
  isRefreshing?: boolean;
}

const CATEGORIES: Array<{ id: ServiceCategory; label: string }> = [
  { id: "WEB_DEVELOPMENT", label: "Web Development" },
  { id: "MOBILE_DEVELOPMENT", label: "Mobile Apps" },
  { id: "API_BACKEND", label: "API & Backend" },
  { id: "AI_AUTOMATION", label: "AI & Automation" },
  { id: "BOTS_AUTOMATION", label: "Bots & Workflows" },
  { id: "DESIGN_CREATIVE", label: "UI/UX Design" },
  { id: "ENTERPRISE_SYSTEMS", label: "Enterprise Systems" },
  { id: "FINTECH_PAYMENTS", label: "Fintech & Payments" },
  { id: "CLOUD_HOSTING", label: "Cloud & DevOps" },
  { id: "OTHER", label: "Other Solutions" },
];

export function CrmFilters({
  viewMode,
  onViewModeChange,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedAdminId,
  onAdminChange,
  overdueOnly,
  onOverdueToggle,
  onResetFilters,
  onRefresh,
  activeAdmins,
  isRefreshing,
}: CrmFiltersProps) {
  const hasActiveFilters =
    Boolean(searchTerm) ||
    selectedCategory !== "ALL" ||
    selectedAdminId !== "ALL" ||
    overdueOnly;

  return (
    <div className="space-y-3">
      {/* Top row: View Switcher & Action buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Switcher */}
        <div className="flex items-center gap-1 bg-void-dark p-1 rounded-xl border border-void-border w-fit">
          <button
            type="button"
            onClick={() => onViewModeChange("kanban")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
              viewMode === "kanban"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                : "text-void-muted hover:text-void-white"
            )}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban Pipeline</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange("followups")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
              viewMode === "followups"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                : "text-void-muted hover:text-void-white"
            )}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Follow-Up Tasks</span>
          </button>
        </div>

        {/* Right refresh & reset */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs text-void-muted hover:text-void-white flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-void-surface/50 border border-void-subtle transition-colors"
            >
              <X className="w-3 h-3" /> Clear Filters
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-xs text-void-light hover:text-void-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-void-surface border border-void-subtle hover:border-violet-500/40 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing ? "animate-spin text-violet-400" : "")} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Filter inputs bar */}
      <div className="p-3 rounded-xl bg-void-dark/80 border border-void-border flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-void-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search leads by client name, email, company, or message..."
            className="w-full text-xs pl-9 pr-8 py-2 rounded-lg bg-void-surface border border-void-subtle text-void-white placeholder:text-void-muted focus:outline-none focus:border-violet-500/50"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-void-muted hover:text-void-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="w-full md:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full text-xs py-2 px-3 rounded-lg bg-void-surface border border-void-subtle text-void-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Assigned Admin Dropdown */}
        <div className="w-full md:w-48">
          <select
            value={selectedAdminId}
            onChange={(e) => onAdminChange(e.target.value)}
            className="w-full text-xs py-2 px-3 rounded-lg bg-void-surface border border-void-subtle text-void-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
          >
            <option value="ALL">All Assignees</option>
            {activeAdmins.map((adm) => (
              <option key={adm.id} value={adm.id}>
                {adm.name}
              </option>
            ))}
          </select>
        </div>

        {/* Overdue Only Filter */}
        <button
          type="button"
          onClick={() => onOverdueToggle(!overdueOnly)}
          className={cn(
            "flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap",
            overdueOnly
              ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
              : "bg-void-surface text-void-muted border-void-subtle hover:text-void-white"
          )}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Overdue Tasks Only</span>
        </button>
      </div>
    </div>
  );
}
