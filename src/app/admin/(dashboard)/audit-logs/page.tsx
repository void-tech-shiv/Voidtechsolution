import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { hasPermission } from "@/server/security/rbac";
import { getAuditHistory } from "@/server/security/audit";
import { AuditLogsClient } from "@/components/admin/audit/audit-logs-client";
import { AdminAccessDenied } from "@/components/admin/admin-access-denied";

export const metadata = {
  title: "Audit Trail | VOIDTECH SOLUTION",
  description: "Immutable administrative audit event logs",
};

export default async function AdminAuditLogsPage() {
  const current = await getCurrentAdmin();
  if (!current || !current.user.isActive) {
    redirect("/admin/login");
  }

  // Strict RBAC: Restricted to SUPER_ADMIN
  if (!hasPermission(current.user.role, "audit_logs:view")) {
    return (
      <AdminAccessDenied
        requiredPermission="audit_logs:view"
        role={current.user.role}
        title="Access Restricted: SUPER_ADMIN Only"
        description="Audit logs and system security event inspection are restricted strictly to the master SUPER_ADMIN."
      />
    );
  }

  const { logs, total } = await getAuditHistory({ limit: 100, offset: 0 });

  return <AuditLogsClient initialLogs={logs} totalLogs={total} />;
}

