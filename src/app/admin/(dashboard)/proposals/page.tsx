import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, IndianRupee, Plus, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { hasPermission } from "@/server/security/rbac";
import { AdminAccessDenied } from "@/components/admin/admin-access-denied";
import { createAgencyProposalAction } from "@/server/actions/agency.actions";

export const metadata: Metadata = { title: "Client Proposals | VOIDTECH SOLUTION", robots: { index: false } };
export const dynamic = "force-dynamic";
const money = (n: number) => "₹" + new Intl.NumberFormat("en-IN").format(n);
const field = "w-full min-h-11 rounded-lg border border-void-border bg-void-black px-3 py-2 text-sm text-white focus:border-electric-purple focus:outline-none";
const label = "block text-xs font-semibold text-void-light mb-1.5";

export default async function ProposalsPage({
  searchParams,
}: { searchParams: Promise<{ error?: string }> }) {
  const current = await getCurrentAdmin();
  if (!current?.user.isActive) redirect("/admin/login");
  if (!hasPermission(current.user.role, "proposals:manage")) {
    return <AdminAccessDenied
      role={current.user.role}
      requiredPermission="proposals:manage"
      title="Proposals Restricted"
      description="Only agency administrators can manage commercial proposals."
    />;
  }

  const [proposalsResult, enquiriesResult] = await Promise.allSettled([
    prisma.agencyProposal.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        enquiry: { select: { id: true, name: true, companyName: true } },
        project: { select: { id: true } },
      },
    }),
    prisma.enquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, name: true, companyName: true, status: true },
    }),
  ]);
  const unavailable = proposalsResult.status !== "fulfilled" || enquiriesResult.status !== "fulfilled";
  const proposals = proposalsResult.status === "fulfilled" ? proposalsResult.value : [];
  const enquiries = enquiriesResult.status === "fulfilled" ? enquiriesResult.value : [];
  const { error } = await searchParams;

  return (
    <div className="space-y-7">
      <header className="rounded-2xl border border-void-border bg-void-charcoal/70 p-6">
        <div className="flex items-center gap-2 text-electric-purple"><FileText className="h-5 w-5" /><span className="font-mono text-xs uppercase tracking-widest">Agency Sales</span></div>
        <h1 className="mt-3 text-3xl font-extrabold text-white">Proposals & Quotations</h1>
        <p className="mt-2 text-sm text-void-muted">Prepare a client-specific INR quotation, review it, and manually confirm acceptance before creating a project.</p>
        <Link href="/admin/crm" className="mt-4 inline-flex text-sm text-electric-purple hover:underline">View CRM leads</Link>
      </header>

      {unavailable && (
        <div role="alert" className="rounded-xl border border-amber-400/50 bg-amber-400/10 p-5 text-sm text-amber-100">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          Proposals or enquiries could not be loaded. Check database availability and apply the Phase 3 Prisma migration. No counts are being presented as real data.
        </div>
      )}
      {error && <div role="alert" className="rounded-xl border border-red-400/50 bg-red-400/10 p-4 text-sm text-red-100">
        {error === "amount" ? "Invalid line item prices or discount." :
          error === "enquiry" ? "Selected CRM enquiry no longer exists." :
          error === "validity" ? "Proposal expiry must be a valid future date." :
          "Please check the form fields and try again."}
      </div>}

      {!unavailable && (
        <>
          <section className="rounded-2xl border border-void-border bg-void-charcoal/60 p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2"><Plus className="h-4 w-4 text-electric-purple" /><h2 className="text-lg font-bold text-white">Create a proposal</h2></div>
            {enquiries.length === 0 ? (
              <p className="text-sm text-void-muted">No enquiries yet. <Link href="/admin/enquiries" className="text-electric-purple underline">Capture a lead first.</Link></p>
            ) : (
              <form action={createAgencyProposalAction} className="space-y-5">
                <div>
                  <label className={label} htmlFor="proposal-enquiry">CRM enquiry *</label>
                  <select id="proposal-enquiry" name="enquiryId" required className={field} defaultValue="">
                    <option value="" disabled>Select a customer enquiry</option>
                    {enquiries.map((e) => <option key={e.id} value={e.id}>{e.name}{e.companyName ? " · " + e.companyName : ""} · {e.status}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label} htmlFor="proposal-title">Project / quotation title *</label>
                  <input id="proposal-title" name="title" required minLength={3} maxLength={150} className={field} placeholder="Business website with enquiry form" />
                </div>
                <div>
                  <label className={label} htmlFor="proposal-scope">Deliverables & scope *</label>
                  <textarea id="proposal-scope" name="scope" required minLength={10} maxLength={8000} rows={4} className={field} placeholder="Pages, design, integrations, hosting responsibilities, revisions…" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className={label} htmlFor="proposal-valid">Valid until (optional)</label><input id="proposal-valid" type="date" name="validUntil" className={field} /></div>
                  <div><label className={label} htmlFor="proposal-discount">Discount (whole INR)</label><input id="proposal-discount" type="number" min="0" max="2000000000" step="1" name="discountInr" defaultValue="0" className={field} /></div>
                </div>
                <fieldset className="space-y-3">
                  <legend className="mb-2 text-sm font-semibold text-white">Line items (at least one required)</legend>
                  <div className="hidden grid-cols-[minmax(0,1fr)_5rem_8rem] gap-3 text-xs text-void-muted sm:grid">
                    <span>Description</span><span>Quantity</span><span>Unit price ₹</span>
                  </div>
                  {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="grid grid-cols-1 gap-2 rounded-lg border border-void-border/60 p-3 sm:grid-cols-[minmax(0,1fr)_5rem_8rem] sm:gap-3 sm:border-0 sm:p-0">
                      <label className="sm:sr-only" htmlFor={`line-desc-${i}`}>Line {i + 1} description</label>
                      <input id={`line-desc-${i}`} name="itemDescription" aria-label={`Line ${i + 1} description`} placeholder="Website design and development"
                        required={i === 0} className={field} maxLength={180} />
                      <label className="sm:sr-only" htmlFor={`line-qty-${i}`}>Line {i + 1} quantity</label>
                      <input id={`line-qty-${i}`} name="quantity" aria-label={`Line ${i + 1} quantity`} type="number" min="1" max="100" step="1" defaultValue="1" className={field} />
                      <label className="sm:sr-only" htmlFor={`line-price-${i}`}>Line {i + 1} unit price INR</label>
                      <input id={`line-price-${i}`} name="unitPriceInr" aria-label={`Line ${i + 1} price`} type="number" min="0" max="10000000" step="1" placeholder="2999" required={i === 0} className={field} />
                    </div>
                  ))}
                </fieldset>
                <div>
                  <label className={label} htmlFor="proposal-terms">Terms and payment milestones *</label>
                  <textarea id="proposal-terms" name="terms" required minLength={5} maxLength={5000} rows={3} className={field}
                    defaultValue={"Scope changes require a revised quote. Payment milestones and delivery dates must be agreed before work begins."} />
                </div>
                <p className="text-xs text-void-muted"><IndianRupee className="mr-1 inline h-3.5 w-3.5" /> Totals are recalculated on the server; creating a proposal does not send an email or charge the customer.</p>
                <button type="submit" className="rounded-lg bg-electric-violet px-5 py-3 text-sm font-bold text-white hover:opacity-90">Save draft proposal</button>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-void-border bg-void-charcoal/60 p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-white">Recent proposals</h2>
            {proposals.length === 0 ? <p className="text-sm text-void-muted">No proposals created yet.</p> :
              <div className="divide-y divide-void-border/70">
                {proposals.map((p) => (
                  <Link key={p.id} href={`/admin/proposals/${p.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:text-electric-purple">
                    <div><p className="text-sm font-semibold text-white">{p.title}</p>
                      <p className="text-xs text-void-muted">{p.enquiry.name} · {p.createdAt.toLocaleDateString("en-IN")} · {p.status}</p></div>
                    <div className="text-right"><p className="font-mono text-sm font-bold text-white">{money(p.totalInr)}</p>
                      {p.project && <p className="text-xs text-emerald-300">Project created</p>}</div>
                  </Link>
                ))}
              </div>
            }
          </section>
        </>
      )}
    </div>
  );
}
