import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { hasPermission } from "@/server/security/rbac";
import { getEnquiries, getEnquiryStats } from "@/server/repositories/enquiries.repo";
import { AdminEnquiriesClient } from "@/components/admin/enquiries/admin-enquiries-client";
import { AdminAccessDenied } from "@/components/admin/admin-access-denied";

export const metadata = {
  title: "Client Enquiries | VOIDTECH SOLUTION",
  description: "Inbound client leads and enquiry management",
};

export default async function AdminEnquiriesPage() {
  const current = await getCurrentAdmin();
  if (!current || !current.user.isActive) {
    redirect("/admin/login");
  }

  // RBAC: Requires enquiries:view (Authorized for SUPER_ADMIN, ADMIN, EDITOR)
  if (!hasPermission(current.user.role, "enquiries:view")) {
    return (
      <AdminAccessDenied
        requiredPermission="enquiries:view"
        role={current.user.role}
        title="Access Restricted"
        description="Viewing client leads requires the enquiries:view permission."
      />
    );
  }

  const [{ items: enquiries }, stats] = await Promise.all([
    getEnquiries({ limit: 100 }),
    getEnquiryStats(),
  ]);

  return (
    <AdminEnquiriesClient
      initialEnquiries={enquiries}
      stats={stats}
      userRole={current.user.role}
    />
  );
}

