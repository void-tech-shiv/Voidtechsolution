"use client";

import * as React from "react";
import type { UserRole, ServiceCategory } from "@prisma/client";
import { CrmDashboardKpis } from "./crm-dashboard-kpis";
import { CrmFilters } from "./crm-filters";
import { CrmKanban } from "./crm-kanban";
import { CrmFollowupsView } from "./crm-followups-view";
import { CrmLeadDrawer } from "./crm-lead-drawer";
import {
  getCrmMetricsAction,
  getKanbanLeadsAction,
  type CrmMetrics,
  type KanbanStageColumn,
} from "@/server/actions/crm.actions";
import { hasPermission } from "@/server/security/rbac";

interface CrmDashboardClientProps {
  initialMetrics: CrmMetrics;
  initialColumns: KanbanStageColumn[];
  activeAdmins: Array<{ id: string; name: string; role: string }>;
  userRole: UserRole;
}

export function CrmDashboardClient({
  initialMetrics,
  initialColumns,
  activeAdmins,
  userRole,
}: CrmDashboardClientProps) {
  const [metrics, setMetrics] = React.useState<CrmMetrics>(initialMetrics);
  const [columns, setColumns] = React.useState<KanbanStageColumn[]>(initialColumns);
  const [viewMode, setViewMode] = React.useState<"kanban" | "followups">("kanban");
  const [drawerLeadId, setDrawerLeadId] = React.useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");
  const [selectedAdminId, setSelectedAdminId] = React.useState("ALL");
  const [overdueOnly, setOverdueOnly] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const canUpdateStatus = hasPermission(userRole, "enquiries:update_status");
  const canDelete = hasPermission(userRole, "enquiries:delete");

  // Re-fetch Kanban leads & metrics based on active filters
  const reloadData = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [metricsRes, kanbanRes] = await Promise.all([
        getCrmMetricsAction(),
        getKanbanLeadsAction({
          category: selectedCategory === "ALL" ? undefined : (selectedCategory as ServiceCategory),
          assignedAdminId: selectedAdminId === "ALL" ? undefined : selectedAdminId,
          search: searchTerm || undefined,
          hasOverdueFollowUp: overdueOnly ? true : undefined,
        }),
      ]);

      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }
      if (kanbanRes.success && kanbanRes.data) {
        setColumns(kanbanRes.data);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [searchTerm, selectedCategory, selectedAdminId, overdueOnly]);

  // Debounced search / filter trigger
  React.useEffect(() => {
    const handler = setTimeout(() => {
      reloadData();
    }, 250);
    return () => clearTimeout(handler);
  }, [reloadData]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("ALL");
    setSelectedAdminId("ALL");
    setOverdueOnly(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-void-white tracking-tight flex items-center gap-2">
            <span>CRM Pipeline</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-bold uppercase tracking-wider">
              Phase 9.2
            </span>
          </h1>
          <p className="text-xs text-void-muted mt-1">
            Real-time commercial pipeline stages, lead tracking, and client follow-ups.
          </p>
        </div>
      </div>

      {/* 6 Top KPI Metrics Cards & Stage Distribution */}
      <CrmDashboardKpis metrics={metrics} />

      {/* Filter and View Switcher Toolbar */}
      <CrmFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedAdminId={selectedAdminId}
        onAdminChange={setSelectedAdminId}
        overdueOnly={overdueOnly}
        onOverdueToggle={setOverdueOnly}
        onResetFilters={handleResetFilters}
        onRefresh={reloadData}
        activeAdmins={activeAdmins}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area: Kanban Board vs Follow-up Tasks View */}
      {viewMode === "kanban" ? (
        <CrmKanban
          initialColumns={columns}
          userRole={userRole}
          onRefresh={reloadData}
        />
      ) : (
        <CrmFollowupsView
          canUpdateStatus={canUpdateStatus}
          onOpenLead={(id) => setDrawerLeadId(id)}
        />
      )}

      {/* Standalone Lead Detail Drawer when triggered from Followups View */}
      {drawerLeadId && (
        <CrmLeadDrawer
          leadId={drawerLeadId}
          userRole={userRole}
          canUpdateStatus={canUpdateStatus}
          canDelete={canDelete}
          onClose={() => setDrawerLeadId(null)}
          onLeadUpdated={reloadData}
        />
      )}
    </div>
  );
}
