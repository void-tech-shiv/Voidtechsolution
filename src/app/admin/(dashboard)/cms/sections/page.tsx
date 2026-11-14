import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { getAllPageSections } from "@/server/repositories/page-sections.repo";
import { AdminPageSectionsClient } from "@/components/admin/cms/admin-page-sections-client";

export const metadata = {
  title: "Page Sections & Copy | VOIDTECH SOLUTION",
  description: "Manage editable marketing copy and headlines across public pages",
};

export default async function AdminPageSectionsPage() {
  const current = await getCurrentAdmin();
  if (!current || !current.user.isActive) {
    redirect("/admin/login");
  }

  const sections = await getAllPageSections();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-void-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-void-purple/10 text-void-purple border border-void-purple/20">
              EDITORIAL COPY
            </span>
            <span className="text-xs text-void-gray">
              Homepage, About, Services & Contact Intros
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-void-light">
            Page Sections
          </h1>
          <p className="text-sm text-void-gray mt-1">
            Maintain marketing headlines, mission copy, and narrative blocks across the website.
          </p>
        </div>
      </div>

      <AdminPageSectionsClient
        initialSections={sections}
        userRole={current.user.role}
      />
    </div>
  );
}

