import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { hasPermission } from "@/server/security/rbac";
import { AdminAccessDenied } from "@/components/admin/admin-access-denied";
import { CrmDashboardClient } from "@/components/admin/crm/crm-dashboard-client";
import {
  getCrmMetricsAction,
  getKanbanLeadsAction,
  getActiveAdminsAction,
} from "@/server/actions/crm.actions";

export const metadata: Metadata = {
  title: "CRM Lead Pipeline | VOIDTECH SOLUTION",
  description: "Commercial pipeline, 8-stage Kanban board, client follow-up tracking and lead management",
};

export default async function AdminCrmPage() {
  const current = await getCurrentAdmin();
  if (!current || !current.user.isActive) {
    redirect("/admin/login");
  }

  // RBAC Assertion: requires enquiries:view (SUPER_ADMIN, ADMIN, EDITOR)
  if (!hasPermission(current.user.role, "enquiries:view")) {
    return (
      <AdminAccessDenied
        requiredPermission="enquiries:view"
        role={current.user.role}
        title="CRM Access Restricted"
        description="Viewing the CRM pipeline and client leads requires the enquiries:view permission."
      />
    );
  }

  // Preload initial metrics, kanban columns, and eligible admins in parallel
  const [metricsRes, kanbanRes, adminsRes] = await Promise.all([
    getCrmMetricsAction(),
    getKanbanLeadsAction(),
    getActiveAdminsAction(),
  ]);

  const metrics = metricsRes.success && metricsRes.data ? metricsRes.data : {
    totalLeads: 0,
    newLeads: 0,
    activePipelineValueInr: 0,
    wonRevenueInr: 0,
    winRatePercentage: 0,
    overdueFollowUpsCount: 0,
    stageDistribution: {
      NEW: { count: 0, totalValueInr: 0 },
      CONTACTED: { count: 0, totalValueInr: 0 },
      QUALIFIED: { count: 0, totalValueInr: 0 },
      PROPOSAL_SENT: { count: 0, totalValueInr: 0 },
      NEGOTIATION: { count: 0, totalValueInr: 0 },
      WON: { count: 0, totalValueInr: 0 },
      LOST: { count: 0, totalValueInr: 0 },
      ON_HOLD: { count: 0, totalValueInr: 0 },
    },
  };

  const columns = kanbanRes.success && kanbanRes.data ? kanbanRes.data : [];
  const activeAdmins = adminsRes.success && adminsRes.data ? adminsRes.data : [];

  return (
    <CrmDashboardClient
      initialMetrics={metrics}
      initialColumns={columns}
      activeAdmins={activeAdmins}
      userRole={current.user.role}
    />
  );
}

