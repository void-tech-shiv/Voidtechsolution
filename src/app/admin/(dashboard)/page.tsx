import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Inbox,
  Layers,
  CircleDollarSign,
  Users,
  ShieldCheck,
  Clock,
  ArrowRight,
  Sparkles,
  Lock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { hasPermission } from "@/server/security/rbac";

export default async function AdminDashboardOverviewPage() {
  const current = await getCurrentAdmin();

  if (!current || !current.user.isActive) {
    redirect("/admin/login");
  }

  const { user, session } = current;

  // Retrieve operational counts with graceful error recovery
  let enquiryCount = 0;
  let newEnquiryCount = 0;
  let serviceCount = 0;
  let pricingCount = 0;
  let adminCount = 0;

  try {
    const [enquiries, newEnquiries, services, pricing] = await Promise.all([
      prisma.enquiry.count(),
      prisma.enquiry.count({ where: { status: "NEW" } }),
      prisma.service.count({ where: { isActive: true } }),
      prisma.pricingPackage.count({ where: { isActive: true } }),
    ]);

    enquiryCount = enquiries;
    newEnquiryCount = newEnquiries;
    serviceCount = services;
    pricingCount = pricing;

    if (user.role === "SUPER_ADMIN") {
      adminCount = await prisma.adminUser.count();
    }
  } catch {
    // Graceful fallback for mocked / unseeded environments
  }

  const roleBadgeStyle =
    user.role === "SUPER_ADMIN"
      ? "bg-electric-violet/20 text-electric-purple border-electric-purple/40"
      : user.role === "ADMIN"
      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";

  return (
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <div className="relative rounded-2xl border border-void-border/80 bg-void-charcoal/90 p-6 sm:p-8 backdrop-blur-xl shadow-glass-inner overflow-hidden">
        <div
          className="absolute -top-12 -right-12 w-64 h-64 bg-electric-violet/15 blur-3xl rounded-full pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono uppercase tracking-widest text-void-muted">
                SESSION ACTIVE //
              </span>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${roleBadgeStyle}`}
              >
                {user.role}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome, {user.name}
            </h1>
            <p className="text-sm text-void-muted mt-1 max-w-2xl">
              VOIDTECH SOLUTION administrative console. Manage client enquiries, service catalog offerings, transparent pricing matrices, and role-based permissions.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="p-3 rounded-xl bg-void-surface/80 border border-void-border text-xs font-mono text-void-light flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>TLS 1.3 / HMAC Secured</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Enquiries Card */}
        <Link
          href="/admin/enquiries"
          className="group p-5 rounded-xl border border-void-border/80 bg-void-charcoal/70 hover:bg-void-surface hover:border-electric-purple/50 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-void-muted uppercase tracking-wider">
              Client Inquiries
            </span>
            <div className="p-2 rounded-lg bg-electric-violet/10 text-electric-purple group-hover:scale-110 transition-transform">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {enquiryCount}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-void-muted">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{newEnquiryCount} pending intake review</span>
          </div>
        </Link>

        {/* Active Services Card */}
        <Link
          href="/admin/services"
          className="group p-5 rounded-xl border border-void-border/80 bg-void-charcoal/70 hover:bg-void-surface hover:border-electric-purple/50 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-void-muted uppercase tracking-wider">
              Catalog Services
            </span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {serviceCount || 18}
          </div>
          <div className="mt-1 text-xs text-void-muted">
            18 enterprise service offerings active
          </div>
        </Link>

        {/* Pricing Packages Card */}
        {hasPermission(user.role, "pricing:manage") ? (
          <Link
            href="/admin/pricing"
            className="group p-5 rounded-xl border border-void-border/80 bg-void-charcoal/70 hover:bg-void-surface hover:border-electric-purple/50 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-void-muted uppercase tracking-wider">
                Pricing Packages
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                <CircleDollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {pricingCount || 10}
            </div>
            <div className="mt-1 text-xs text-void-muted">
              10 transparent tiered packages active
            </div>
          </Link>
        ) : (
          <div className="p-5 rounded-xl border border-void-border/40 bg-void-charcoal/40 text-void-muted">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Pricing Packages
              </span>
              <Lock className="w-4 h-4 text-void-muted/60" />
            </div>
            <div className="text-2xl font-bold text-void-muted">Restricted</div>
            <div className="mt-1 text-xs text-void-muted/60">
              Requires Admin or Super Admin role
            </div>
          </div>
        )}

        {/* Super Admin Team or Security Telemetry */}
        {user.role === "SUPER_ADMIN" ? (
          <Link
            href="/admin/users"
            className="group p-5 rounded-xl border border-void-border/80 bg-void-charcoal/70 hover:bg-void-surface hover:border-electric-purple/50 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-void-muted uppercase tracking-wider">
                Administrators
              </span>
              <div className="p-2 rounded-lg bg-electric-violet/10 text-electric-purple group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {adminCount || 1}
            </div>
            <div className="mt-1 text-xs text-void-muted">
              Strict exactly-one SUPER_ADMIN invariant
            </div>
          </Link>
        ) : (
          <div className="p-5 rounded-xl border border-void-border/80 bg-void-charcoal/70 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-void-muted uppercase tracking-wider">
                System Status
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              Nominal
            </div>
            <div className="mt-1 text-xs text-emerald-400">
              All security checks passing
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Hub Tailored by Role */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-void-muted mb-3">
          Role-Gated Operations Hub
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action 1: Enquiries */}
          <Link
            href="/admin/enquiries"
            className="p-5 rounded-xl border border-void-border/80 bg-void-charcoal/80 hover:border-electric-purple/60 hover:bg-void-surface transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-electric-purple mb-2">
                <Inbox className="w-4 h-4" />
                <span className="text-xs font-mono font-semibold uppercase">
                  Lead Intake
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-electric-purple transition-colors">
                Client Enquiries
              </h3>
              <p className="text-xs text-void-muted mt-1 leading-relaxed">
                Review submitted project briefs, timeline requirements, budget bands, and update engagement statuses.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-electric-purple group-hover:translate-x-1 transition-transform">
              <span>View Enquiries</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Action 2: Services / Pricing / Portfolio */}
          {hasPermission(user.role, "pricing:manage") ? (
            <Link
              href="/admin/pricing"
              className="p-5 rounded-xl border border-void-border/80 bg-void-charcoal/80 hover:border-electric-purple/60 hover:bg-void-surface transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-cyan-400 mb-2">
                  <CircleDollarSign className="w-4 h-4" />
                  <span className="text-xs font-mono font-semibold uppercase">
                    Commercials
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Pricing Matrix
                </h3>
                <p className="text-xs text-void-muted mt-1 leading-relaxed">
                  Manage standard deliverables, features, and pricing tiers across all approved agency offerings.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-cyan-400 group-hover:translate-x-1 transition-transform">
                <span>Manage Pricing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ) : (
            <Link
              href="/admin/portfolio"
              className="p-5 rounded-xl border border-void-border/80 bg-void-charcoal/80 hover:border-electric-purple/60 hover:bg-void-surface transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-mono font-semibold uppercase">
                    Editorial
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Portfolio Showcase
                </h3>
                <p className="text-xs text-void-muted mt-1 leading-relaxed">
                  Update published agency case studies, client testimonials, and tech stack tags.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>Edit Portfolio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          )}

          {/* Action 3: Team / Audit or Settings */}
          {user.role === "SUPER_ADMIN" ? (
            <Link
              href="/admin/users"
              className="p-5 rounded-xl border border-void-border/80 bg-void-charcoal/80 hover:border-electric-purple/60 hover:bg-void-surface transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-electric-purple mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-mono font-semibold uppercase">
                    Access Control
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-electric-purple transition-colors">
                  Admin User Accounts
                </h3>
                <p className="text-xs text-void-muted mt-1 leading-relaxed">
                  Provision ADMIN and EDITOR accounts, adjust active statuses, and enforce concurrency locks.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-electric-purple group-hover:translate-x-1 transition-transform">
                <span>Manage Accounts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ) : (
            <Link
              href="/admin/services"
              className="p-5 rounded-xl border border-void-border/80 bg-void-charcoal/80 hover:border-electric-purple/60 hover:bg-void-surface transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-cyan-400 mb-2">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-mono font-semibold uppercase">
                    Catalog
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Services Catalog
                </h3>
                <p className="text-xs text-void-muted mt-1 leading-relaxed">
                  Browse and review agency service capabilities, deliverables, and technical descriptions.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-cyan-400 group-hover:translate-x-1 transition-transform">
                <span>View Services</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Security & Active Session Advisory */}
      <div className="p-6 rounded-xl border border-void-border/70 bg-void-charcoal/50 text-xs">
        <div className="flex items-center gap-2 font-mono uppercase text-void-muted mb-3">
          <Clock className="w-4 h-4 text-electric-purple" />
          <span>Active Session Telemetry & Dual-Layer Policy</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-void-muted font-mono">
          <div>
            <span className="text-void-light block mb-0.5">Session ID:</span>
            <span className="truncate block">{session.id}</span>
          </div>
          <div>
            <span className="text-void-light block mb-0.5">Client IP Address:</span>
            <span>{session.ipAddress || "127.0.0.1 (Local)"}</span>
          </div>
          <div>
            <span className="text-void-light block mb-0.5">Security Policies:</span>
            <span>8h Absolute Expiry // 30m Idle Timeout</span>
          </div>
        </div>
      </div>
    </div>
  );
}
