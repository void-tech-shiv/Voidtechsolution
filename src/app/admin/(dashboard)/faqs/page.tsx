import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { hasPermission } from "@/server/security/rbac";
import { getAllFaqs } from "@/server/repositories/faq.repo";
import { AdminFaqsClient } from "@/components/admin/faqs/admin-faqs-client";
import { AdminAccessDenied } from "@/components/admin/admin-access-denied";

export const metadata = {
  title: "Knowledgebase (FAQ) | VOIDTECH SOLUTION",
  description: "Manage frequently asked questions, client policies, and warranty documentation",
};

export default async function AdminFaqsPage() {
  const current = await getCurrentAdmin();
  if (!current || !current.user.isActive) {
    redirect("/admin/login");
  }

  // RBAC: Requires faqs:manage (Authorized for SUPER_ADMIN, ADMIN, EDITOR)
  if (!hasPermission(current.user.role, "faqs:manage")) {
    return (
      <AdminAccessDenied
        requiredPermission="faqs:manage"
        role={current.user.role}
        title="Access Restricted"
        description="Knowledgebase FAQ management requires the faqs:manage permission."
      />
    );
  }

  const faqs = await getAllFaqs();

  return <AdminFaqsClient initialFaqs={faqs} />;
}

