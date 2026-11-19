import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { hasPermission } from "@/server/security/rbac";
import { AdminAccessDenied } from "@/components/admin/admin-access-denied";
import { PrintProposalButton } from "@/components/admin/agency/print-proposal-button";
import { changeAgencyProposalStatusAction, convertProposalToProjectAction } from "@/server/actions/agency.actions";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Proposal Detail | VOIDTECH SOLUTION", robots: { index: false } };
export const dynamic = "force-dynamic";
const money = (n: number) => "₹" + new Intl.NumberFormat("en-IN").format(n);

export default async function ProposalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const current = await getCurrentAdmin();
  if (!current?.user.isActive) redirect("/admin/login");
  if (!hasPermission(current.user.role, "proposals:manage")) {
    return <AdminAccessDenied role={current.user.role} requiredPermission="proposals:manage"
      title="Proposal Restricted" description="Only authorized administrators can open client quotations." />;
  }
  const { id } = await params;
  const { error, updated } = await searchParams;
  const proposal = await prisma.agencyProposal.findUnique({
    where: { id },
    include: {
      enquiry: { select: { id: true, name: true, email: true, phone: true, companyName: true } },
      items: { orderBy: { orderIndex: "asc" } },
      project: { select: { id: true } },
    },
  });
  if (!proposal) notFound();

  const canModify = proposal.status === "DRAFT" || proposal.status === "SENT";
  const expired = proposal.validUntil && proposal.validUntil.getTime() < Date.now();
  const customerLabel = proposal.enquiry.companyName || proposal.enquiry.name;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/admin/proposals" className="text-sm font-semibold text-electric-purple hover:underline">← Back to proposals</Link>
        <PrintProposalButton />
      </div>
      {error && <div role="alert" className="rounded-lg border border-amber-400/50 bg-amber-400/10 p-4 text-sm text-amber-100 print:hidden">
        {error === "not-accepted" ? "Only accepted proposals can become projects." :
          error === "expired" ? "This quotation has expired. Prepare a new proposal." :
          "Proposal changed or transition was rejected. Refresh before retrying."}
      </div>}
      {updated && <p role="status" className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-200 print:hidden">Proposal status updated.</p>}

      <article className="rounded-2xl border border-void-border bg-void-charcoal p-5 text-void-light shadow-xl sm:p-9 print:rounded-none print:border-0 print:bg-white print:p-0 print:text-black print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-void-border pb-6 print:border-gray-300">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-electric-purple print:text-black">VOIDTECH SOLUTION</p>
            <h1 className="mt-3 text-3xl font-extrabold text-white print:text-black">Project Proposal</h1>
            <p className="mt-2 text-sm text-void-muted print:text-gray-700">Build. Launch. Grow Online.</p>
            <p className="mt-2 text-xs text-void-muted print:text-gray-700">{siteConfig.contactEmail}</p>
          </div>
          <div className="space-y-1 text-right text-xs text-void-muted print:text-gray-700">
            <p><span className="font-semibold">Reference:</span> QT-{proposal.id.slice(-9).toUpperCase()}</p>
            <p><span className="font-semibold">Date:</span> {proposal.createdAt.toLocaleDateString("en-IN")}</p>
            {proposal.validUntil && <p><span className="font-semibold">Valid until:</span> {proposal.validUntil.toLocaleDateString("en-IN")}</p>}
            <p><span className="font-semibold">Status:</span> {proposal.status}</p>
          </div>
        </div>

        <div className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-electric-purple print:text-black">Prepared for</p>
            <h2 className="mt-2 text-lg font-bold text-white print:text-black">{customerLabel}</h2>
            {proposal.enquiry.companyName && <p className="text-sm">{proposal.enquiry.name}</p>}
            <p className="mt-1 text-sm">{proposal.enquiry.email}</p>
            {proposal.enquiry.phone && <p className="mt-1 text-sm">{proposal.enquiry.phone}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-electric-purple print:text-black">Proposed work</p>
            <h2 className="mt-2 text-lg font-bold text-white print:text-black">{proposal.title}</h2>
            <p className="mt-2 text-xs text-void-muted print:text-gray-700">All amounts in Indian Rupees (INR).</p>
          </div>
        </div>

        <section className="border-t border-void-border py-6 print:border-gray-300">
          <h2 className="text-base font-bold text-white print:text-black">Scope & Deliverables</h2>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{proposal.scope}</p>
        </section>

        <section className="border-t border-void-border py-6 print:border-gray-300">
          <h2 className="text-base font-bold text-white print:text-black">Cost Breakdown</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[340px] text-left text-xs sm:text-sm">
              <thead><tr className="border-b border-void-border text-void-muted print:border-gray-300 print:text-black">
                <th scope="col" className="py-3">Description</th>
                <th scope="col" className="py-3 text-right">Qty</th>
                <th scope="col" className="py-3 text-right">Unit price</th>
                <th scope="col" className="py-3 text-right">Amount</th>
              </tr></thead>
              <tbody>{proposal.items.map((item) => (
                <tr key={item.id} className="border-b border-void-border/40 print:border-gray-200">
                  <td className="py-3 pr-3">{item.description}</td>
                  <td className="py-3 text-right">{item.quantity}</td>
                  <td className="py-3 text-right">{money(item.unitPriceInr)}</td>
                  <td className="py-3 text-right font-semibold">{money(item.lineTotalInr)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <dl className="ml-auto mt-6 max-w-xs space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(proposal.subtotalInr)}</dd></div>
            <div className="flex justify-between"><dt>Discount</dt><dd>− {money(proposal.discountInr)}</dd></div>
            <div className="flex justify-between border-t border-void-border pt-3 text-lg font-bold text-white print:border-gray-300 print:text-black"><dt>Total</dt><dd>{money(proposal.totalInr)}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-void-muted print:text-gray-700">Tax treatment and any applicable taxes must be agreed separately. This document is not a tax invoice.</p>
        </section>

        <section className="border-t border-void-border py-6 print:border-gray-300">
          <h2 className="text-base font-bold text-white print:text-black">Terms & Payment Schedule</h2>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{proposal.terms}</p>
        </section>
        <p className="border-t border-void-border pt-5 text-xs text-void-muted print:border-gray-300 print:text-gray-700">
          This quotation describes proposed work only. Acceptance must be confirmed by the client separately.
        </p>
      </article>

      <section className="space-y-4 rounded-2xl border border-void-border bg-void-charcoal/80 p-6 print:hidden">
        <h2 className="text-lg font-bold text-white">Sales workflow</h2>
        {proposal.status === "DRAFT" && (
          <form action={changeAgencyProposalStatusAction} className="space-y-2">
            <input type="hidden" name="proposalId" value={proposal.id} />
            <input type="hidden" name="status" value="SENT" />
            <button type="submit" className="rounded-lg bg-electric-violet px-4 py-2 text-sm font-bold text-white">Mark as sent</button>
            <p className="text-xs text-void-muted">First share the PDF with the customer yourself. This button only updates the CRM stage—it does not send an email.</p>
          </form>
        )}
        {proposal.status === "SENT" && (
          <div className="flex flex-wrap gap-3">
            {expired ? <p className="text-sm text-amber-300">The validity date has expired. Prepare a revised proposal.</p> : (
              <form action={changeAgencyProposalStatusAction}>
                <input type="hidden" name="proposalId" value={proposal.id} />
                <input type="hidden" name="status" value="ACCEPTED" />
                <button type="submit" className="rounded-lg border border-emerald-500/60 px-4 py-2 text-sm font-semibold text-emerald-200">Confirm client accepted</button>
              </form>
            )}
            <form action={changeAgencyProposalStatusAction}>
              <input type="hidden" name="proposalId" value={proposal.id} />
              <input type="hidden" name="status" value="REJECTED" />
              <button type="submit" className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-semibold text-red-200">Mark rejected</button>
            </form>
          </div>
        )}
        {proposal.status === "ACCEPTED" && (
          proposal.project ? (
            <Link href={`/admin/projects/${proposal.project.id}`} className="inline-block rounded-lg bg-electric-violet px-4 py-2 text-sm font-bold text-white">Open linked project</Link>
          ) : (
            <form action={convertProposalToProjectAction}>
              <input type="hidden" name="proposalId" value={proposal.id} />
              <button type="submit" className="rounded-lg bg-electric-violet px-4 py-2 text-sm font-bold text-white">Create client project & milestones</button>
            </form>
          )
        )}
        {proposal.status === "REJECTED" && <p className="text-sm text-void-muted">This proposal is closed. Create a revised quotation from the Proposals page.</p>}
        {canModify && <p className="text-xs text-void-muted">All status changes are recorded in the audit log. Acceptance is manually recorded by an admin, not an electronic signature.</p>}
      </section>
    </div>
  );
}
