import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { hasPermission } from "@/server/security/rbac";
import { getAllPricingPackages } from "@/server/repositories/pricing.repo";
import { AdminPricingClient } from "@/components/admin/pricing/admin-pricing-client";
import { AdminAccessDenied } from "@/components/admin/admin-access-denied";

export const metadata = {
  title: "Pricing Packages | VOIDTECH SOLUTION",
  description: "Approved investment tiers and baseline INR pricing matrices",
};

export default async function AdminPricingPage() {
  const current = await getCurrentAdmin();
  if (!current || !current.user.isActive) {
    redirect("/admin/login");
  }

  // Strict RBAC: Requires pricing:manage (Authorized for SUPER_ADMIN, ADMIN; Denied for EDITOR)
  if (!hasPermission(current.user.role, "pricing:manage")) {
    return (
      <AdminAccessDenied
        requiredPermission="pricing:manage"
        role={current.user.role}
        title="Access Restricted: Commercial Authorization Required"
        description="Pricing tier configuration and commercial management are restricted to ADMIN and SUPER_ADMIN roles."
      />
    );
  }

  const packages = await getAllPricingPackages();

  return <AdminPricingClient initialPackages={packages} />;
}

