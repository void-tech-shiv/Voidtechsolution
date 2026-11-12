import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { hasPermission } from "@/server/security/rbac";
import { getAllSettings } from "@/server/repositories/settings.repo";
import { AdminSettingsClient } from "@/components/admin/settings/admin-settings-client";
import { AdminAccessDenied } from "@/components/admin/admin-access-denied";

export const metadata = {
  title: "Platform Settings | VOIDTECH SOLUTION",
  description: "Global platform configuration and system parameters",
};

export default async function AdminSettingsPage() {
  const current = await getCurrentAdmin();
  if (!current || !current.user.isActive) {
    redirect("/admin/login");
  }

  // Strict RBAC: Restricted to SUPER_ADMIN
  if (!hasPermission(current.user.role, "settings:manage")) {
    return (
      <AdminAccessDenied
        requiredPermission="settings:manage"
        role={current.user.role}
        title="Access Restricted: SUPER_ADMIN Only"
        description="Global platform configuration and parameter management are restricted strictly to the master SUPER_ADMIN."
      />
    );
  }

  const settings = await getAllSettings();

  return <AdminSettingsClient initialSettings={settings} />;
}

