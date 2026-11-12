import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { hasPermission } from "@/server/security/rbac";
import { getAllAdmins } from "@/server/repositories/users.repo";
import { AdminUsersClient } from "@/components/admin/users/admin-users-client";
import { AdminAccessDenied } from "@/components/admin/admin-access-denied";

export const metadata = {
  title: "Team & Access Control | VOIDTECH SOLUTION",
  description: "Administrator provisioning and role assignments",
};

export default async function AdminUsersPage() {
  const current = await getCurrentAdmin();
  if (!current || !current.user.isActive) {
    redirect("/admin/login");
  }

  // Strict RBAC: Restricted to SUPER_ADMIN
  if (!hasPermission(current.user.role, "admins:manage")) {
    return (
      <AdminAccessDenied
        requiredPermission="admins:manage"
        role={current.user.role}
        title="Access Restricted: SUPER_ADMIN Only"
        description="Team account governance, provisioning, and role modification are restricted strictly to the master SUPER_ADMIN."
      />
    );
  }

  const admins = await getAllAdmins();

  return (
    <AdminUsersClient
      initialAdmins={admins}
      currentRole={current.user.role}
      currentUserId={current.user.id}
    />
  );
}

