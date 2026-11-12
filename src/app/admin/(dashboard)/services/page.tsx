import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { hasPermission } from "@/server/security/rbac";
import { getAllServices } from "@/server/repositories/services.repo";
import { AdminServicesClient } from "@/components/admin/services/admin-services-client";
import { AdminAccessDenied } from "@/components/admin/admin-access-denied";

export const metadata = {
  title: "Services Catalog | VOIDTECH SOLUTION",
  description: "Registered software engineering and digital services catalog",
};

export default async function AdminServicesPage() {
  const current = await getCurrentAdmin();
  if (!current || !current.user.isActive) {
    redirect("/admin/login");
  }

  // RBAC: Requires services:manage (Authorized for SUPER_ADMIN, ADMIN, EDITOR)
  if (!hasPermission(current.user.role, "services:manage")) {
    return (
      <AdminAccessDenied
        requiredPermission="services:manage"
        role={current.user.role}
        title="Access Restricted"
        description="Managing service offerings requires the services:manage permission."
      />
    );
  }

  const services = await getAllServices();

  return <AdminServicesClient initialServices={services} />;
}

