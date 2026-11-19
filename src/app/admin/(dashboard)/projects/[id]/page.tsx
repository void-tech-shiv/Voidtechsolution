import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { hasPermission } from "@/server/security/rbac";
import { AdminAccessDenied } from "@/components/admin/admin-access-denied";
import { updateAgencyProjectAction, setAgencyMilestoneAction } from "@/server/actions/agency.actions";

export const metadata: Metadata = { title: "Project Delivery | VOIDTECH SOLUTION", robots: { index: false } };
export const dynamic = "force-dynamic";
const field = "w-full min-h-11 rounded-lg border border-void-border bg-void-black px-3 py-2 text-sm text-white focus:border-electric-purple focus:outline-none";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const current = await getCurrentAdmin();
  if (!current?.user.isActive) redirect("/admin/login");
  if (!hasPermission(current.user.role, "projects:manage")) {
    return <AdminAccessDenied role={current.user.role} requiredPermission="projects:manage"
      title="Project Restricted" description="Only agency administrators may view delivery milestones." />;
  }
  const { id } = await params;
  const { error, updated } = await searchParams;
  const project = await prisma.agencyProject.findUnique({
    where: { id },
    include: {
      enquiry: { select: { name: true, companyName: true, email: true } },
      proposal: { select: { id: true, totalInr: true, status: true } },
      milestones: { orderBy: { orderIndex: "asc" } },
    },
  });
  if (!project) notFound();
  const done = project.milestones.filter(m => m.isCompleted).length;
  const percentage = project.milestones.length ? Math.round(100 * done / project.milestones.length) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/admin/projects" className="text-sm font-semibold text-electric-purple hover:underline">← Back to projects</Link>
      <header className="rounded-2xl border border-void-border bg-void-charcoal/80 p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-electric-purple">Client Project / {project.status.replaceAll("_", " ")}</p>
        <h1 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">{project.title}</h1>
        <p className="mt-2 text-sm text-void-muted">{project.enquiry.companyName || project.enquiry.name} · {project.enquiry.email}</p>
        <Link href={`/admin/proposals/${project.proposal.id}`} className="mt-3 inline-block text-sm text-electric-purple underline">
          View accepted proposal and quotation
        </Link>
        <div className="mt-6 flex items-center justify-between text-sm text-void-light">
          <span>{done} of {project.milestones.length} milestones completed</span>
          <span className="font-mono">{percentage}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-void-surface">
          <div className="h-full rounded-full bg-electric-violet" style={{ width: `${percentage}%` }} />
        </div>
      </header>

      {error && <div role="alert" className="rounded-lg border border-amber-400/50 bg-amber-400/10 p-4 text-sm text-amber-100">
        {error === "milestones" ? "Complete all milestones before marking this project completed." :
          "Invalid project update. Please check the fields and try again."}
      </div>}
      {updated && <p role="status" className="rounded-lg border border-emerald-400/50 bg-emerald-400/10 p-4 text-sm text-emerald-100">Project updated.</p>}

      <section className="rounded-2xl border border-void-border bg-void-charcoal/70 p-6">
        <h2 className="mb-4 text-lg font-bold text-white">Delivery milestones</h2>
        <div className="divide-y divide-void-border/70">
          {project.milestones.map((m) => (
            <form key={m.id} action={setAgencyMilestoneAction} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <h3 className={`text-sm font-semibold ${m.isCompleted ? "text-emerald-300" : "text-void-light"}`}>
                  {m.isCompleted ? "✓ " : "○ "}{m.title}
                </h3>
                {m.completedAt && <p className="mt-1 text-xs text-void-muted">Completed {m.completedAt.toLocaleDateString("en-IN")}</p>}
              </div>
              <input type="hidden" name="milestoneId" value={m.id} />
              <input type="hidden" name="completed" value={m.isCompleted ? "false" : "true"} />
              <button type="submit"
                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${m.isCompleted
                  ? "border-void-border text-void-light"
                  : "border-emerald-500/50 text-emerald-200"}`}
              >{m.isCompleted ? "Reopen" : "Mark complete"}</button>
            </form>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-void-border bg-void-charcoal/70 p-6">
        <h2 className="mb-4 text-lg font-bold text-white">Project management</h2>
        <form action={updateAgencyProjectAction} className="space-y-5">
          <input type="hidden" name="projectId" value={project.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-void-light" htmlFor="project-status">Status</label>
              <select id="project-status" name="status" defaultValue={project.status} className={field}>
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="ON_HOLD">On hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-void-light" htmlFor="project-deadline">Target delivery date</label>
              <input id="project-deadline" name="dueAt" type="date" defaultValue={project.dueAt?.toISOString().slice(0, 10) ?? ""} className={field} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-void-light" htmlFor="project-notes">Internal project notes</label>
            <textarea id="project-notes" name="notes" maxLength={5000} rows={5} defaultValue={project.notes ?? ""}
              placeholder="Requirements updates, client approvals, blockers, handover notes…" className={field} />
            <p className="mt-1 text-xs text-void-muted">Internal administration only; not visible to public customers.</p>
          </div>
          <button type="submit" className="rounded-lg bg-electric-violet px-5 py-3 text-sm font-bold text-white hover:opacity-90">Save project</button>
        </form>
      </section>
    </div>
  );
}
