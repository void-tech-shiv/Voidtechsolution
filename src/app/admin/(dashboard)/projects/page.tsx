import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { hasPermission } from "@/server/security/rbac";
import { AdminAccessDenied } from "@/components/admin/admin-access-denied";

export const metadata: Metadata = { title: "Client Projects | VOIDTECH SOLUTION", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const current = await getCurrentAdmin();
  if (!current?.user.isActive) redirect("/admin/login");
  if (!hasPermission(current.user.role, "projects:manage")) {
    return <AdminAccessDenied role={current.user.role} requiredPermission="projects:manage"
      title="Client Projects Restricted"
      description="Only authorized administrators can manage client delivery work." />;
  }

  let unavailable = false;
  const result = await prisma.agencyProject.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      enquiry: { select: { name: true, companyName: true } },
      milestones: { select: { id: true, isCompleted: true } },
    },
  }).catch(() => {
    unavailable = true;
    return [];
  });

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-void-border bg-void-charcoal/80 p-6">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-electric-purple"><ClipboardList className="h-4 w-4" /> Agency Delivery</p>
        <h1 className="mt-3 text-3xl font-extrabold text-white">Client Projects</h1>
        <p className="mt-2 text-sm text-void-muted">Track agreed delivery work and milestones. Projects originate from accepted proposals.</p>
        <Link href="/admin/proposals" className="mt-4 inline-block text-sm text-electric-purple hover:underline">View proposals →</Link>
      </header>

      {unavailable ? <div role="alert" className="rounded-xl border border-amber-400/50 bg-amber-400/10 p-5 text-sm text-amber-100">
        <AlertTriangle className="mr-2 inline h-4 w-4" /> Project data is unavailable. Verify the Phase 3 database migration and database connectivity.
      </div> : result.length === 0 ? (
        <div className="rounded-2xl border border-void-border bg-void-charcoal/70 p-8 text-sm text-void-muted">
          No projects yet. <Link href="/admin/proposals" className="text-electric-purple underline">Create a proposal</Link>, mark it sent and accepted, then convert it to a project.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {result.map((p) => {
            const done = p.milestones.filter((m) => m.isCompleted).length;
            const progress = p.milestones.length ? Math.round(done / p.milestones.length * 100) : 0;
            return (
              <Link key={p.id} href={`/admin/projects/${p.id}`}
                className="rounded-2xl border border-void-border bg-void-charcoal/70 p-5 transition-colors hover:border-electric-purple">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-electric-purple">{p.status.replaceAll("_", " ")}</span>
                  <span className="text-xs text-void-muted">{progress}% complete</span>
                </div>
                <h2 className="mt-3 text-lg font-bold text-white">{p.title}</h2>
                <p className="mt-1 text-sm text-void-muted">{p.enquiry.companyName || p.enquiry.name}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-void-surface">
                  <div className="h-full rounded-full bg-electric-violet" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-3 text-xs text-void-muted">{done} / {p.milestones.length} milestones completed · {p.dueAt ? "Due " + p.dueAt.toLocaleDateString("en-IN") : "No deadline set"}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
