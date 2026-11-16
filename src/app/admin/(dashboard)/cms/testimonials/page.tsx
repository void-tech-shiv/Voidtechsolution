import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { getAllTestimonialsAdmin } from "@/server/repositories/testimonials.repo";
import { AdminTestimonialsClient } from "@/components/admin/cms/admin-testimonials-client";


export const metadata = {
  title: "Testimonials Verification & Legal Consent | VOIDTECH SOLUTION",
  description: "Audit client claims and manage written legal consent for public endorsements",
};

export default async function AdminTestimonialsPage() {
  const current = await getCurrentAdmin();
  if (!current || !current.user.isActive) {
    redirect("/admin/login");
  }

  const testimonials = await getAllTestimonialsAdmin();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-void-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-void-purple/10 text-void-purple border border-void-purple/20">
              SAFEGUARD 4
            </span>
            <span className="text-xs text-void-gray">
              Dual Audit Gate: Verification + Consent
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-void-light">
            Testimonials & Endorsements
          </h1>
          <p className="text-sm text-void-gray mt-1">
            Factual claims auditing and verifiable client legal consent management before publication.
          </p>
        </div>
      </div>

      <AdminTestimonialsClient
        initialTestimonials={testimonials}
        userRole={current.user.role}
      />
    </div>
  );
}
