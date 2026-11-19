import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity, ArrowUpRight, BarChart3, CalendarDays, Globe2,
  Laptop, Layers3, MousePointerClick, RefreshCw, Smartphone,
} from "lucide-react";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { hasPermission } from "@/server/security/rbac";
import { AdminAccessDenied } from "@/components/admin/admin-access-denied";
import {
  getTrafficReport, normalizeTrafficPeriod,
  type TrafficDay, type TrafficDimension, type TrafficPeriod, type TrafficReport,
} from "@/server/analytics/cloudflare-traffic";

export const metadata: Metadata = {
  title: "Traffic Analytics | VOIDTECH SOLUTION",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const periods: Array<{ value: TrafficPeriod; label: string }> = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

const formatNumber = (value: number) => new Intl.NumberFormat("en-IN").format(value);

function MetricCard({ title, value, note, icon: Icon }: {
  title: string;
  value: string;
  note: string;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-2xl border border-void-border/70 bg-void-charcoal/80 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-void-muted">{title}</span>
        <Icon className="h-5 w-5 text-electric-purple" aria-hidden="true" />
      </div>
      <p className="mt-3 text-3xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs text-void-muted">{note}</p>
    </div>
  );
}

function Breakdown({ title, data, empty = "No traffic data for this period." }: {
  title: string;
  data: TrafficDimension[];
  empty?: string;
}) {
  const max = Math.max(1, ...data.map((row) => row.views));
  return (
    <section className="rounded-2xl border border-void-border/70 bg-void-charcoal/70 p-5" aria-label={title}>
      <h2 className="mb-5 font-mono text-base font-bold text-white">{title}</h2>
      {data.length === 0 ? (
        <p className="py-6 text-sm text-void-muted">{empty}</p>
      ) : (
        <div className="space-y-4">
          {data.map((row) => (
            <div key={row.label} className="space-y-1.5">
              <div className="flex min-w-0 items-center justify-between gap-3 text-xs">
                <span className="truncate text-void-light" title={row.label}>{row.label}</span>
                <span className="shrink-0 font-mono text-white">{formatNumber(row.views)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-void-surface">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-electric-violet to-electric-purple"
                  style={{ width: `${Math.max(2, (row.views / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TrafficTrend({ data }: { data: TrafficDay[] }) {
  const max = Math.max(1, ...data.map((row) => row.pageViews));
  return (
    <section className="rounded-2xl border border-void-border/70 bg-void-charcoal/70 p-5" aria-label="Daily page views">
      <div className="mb-5">
        <h2 className="font-mono text-base font-bold text-white">Traffic over time</h2>
        <p className="mt-1 text-xs text-void-muted">Daily page views · UTC calendar dates</p>
      </div>
      {data.length === 0 ? (
        <p className="py-8 text-sm text-void-muted">No traffic recorded in this date range.</p>
      ) : (
        <>
          <div className="flex h-44 items-end gap-1 border-b border-void-border/70 pb-1" role="img" aria-label={data.map(row => `${row.date}: ${row.pageViews} page views`).join(", ")}>
            {data.map((row) => (
              <div key={row.date} className="group relative flex h-full flex-1 items-end justify-center">
                <div
                  className="w-full max-w-12 rounded-t bg-gradient-to-t from-electric-violet/70 to-electric-purple transition-opacity hover:opacity-80"
                  style={{ height: `${Math.max(3, (row.pageViews / max) * 100)}%` }}
                  title={`${row.date}: ${formatNumber(row.pageViews)} page views, ${formatNumber(row.visits)} visits`}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between gap-3 text-[11px] font-mono text-void-muted">
            <span>{data[0]?.date}</span>
            <span>{data[data.length - 1]?.date}</span>
          </div>
        </>
      )}
    </section>
  );
}

function TrafficContent({ report }: { report: TrafficReport }) {
  const topCountry = report.countries[0]?.label ?? "No data";
  const pagePerVisit = report.visits > 0 ? (report.pageViews / report.visits).toFixed(1) : "—";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visits" value={formatNumber(report.visits)} note="Visits, not uniquely identified people" icon={MousePointerClick} />
        <MetricCard title="Page views" value={formatNumber(report.pageViews)} note="Public pages only, excluding known bots" icon={Layers3} />
        <MetricCard title="Pages / visit" value={pagePerVisit} note="Page views divided by visits" icon={BarChart3} />
        <MetricCard title="Top country" value={topCountry} note="Approximate country, not precise location" icon={Globe2} />
      </div>

      <TrafficTrend data={report.daily} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Breakdown title="Countries" data={report.countries} />
        <Breakdown title="Device types · Mobile / Desktop / Tablet" data={report.devices} />
        <Breakdown title="Popular public pages" data={report.pages} />
        <Breakdown title="Traffic sources / referrers" data={report.sources} />
        <Breakdown title="Browsers" data={report.browsers} />
        <Breakdown title="Operating systems" data={report.operatingSystems} />
      </div>
      <div className="rounded-xl border border-void-border/60 bg-void-charcoal/60 p-4 text-xs leading-relaxed text-void-muted">
        Cloudflare Web Analytics is privacy-focused and approximate. Visits are not exact unique visitors.
        Referrer values such as “Direct / unknown” and “Internal navigation” are not confirmed acquisition channels.
        This report includes only <strong className="text-void-light">voidtechsolution.codedev.co.in</strong> and excludes
        known bots and <strong className="text-void-light">/admin</strong> routes. Data is grouped by UTC dates and may be delayed.
        Only the aggregated counts shown here are returned to the browser; no API token or visitor IPs are exposed.
      </div>
    </>
  );
}

export default async function AdminTrafficPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin || !admin.user.isActive) {
    redirect("/admin/login");
  }
  if (!hasPermission(admin.user.role, "traffic:view")) {
    return <AdminAccessDenied
      role={admin.user.role}
      requiredPermission="traffic:view"
      title="Traffic Analytics Restricted"
      description="Only authorized agency administrators can view website traffic analytics."
    />;
  }

  const period = normalizeTrafficPeriod((await searchParams).period);
  let report: TrafficReport | null = null;
  let failed = false;
  try {
    report = await getTrafficReport(period);
  } catch {
    // A failed upstream response must not be presented as 0 visits.
    failed = true;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-void-border/70 bg-void-charcoal/80 p-6">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-electric-purple">
            <Activity className="h-4 w-4" aria-hidden="true" /> Agency Growth / Traffic
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Traffic Analytics</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-void-muted">
            See how visitors discover VOIDTECH SOLUTION, which public pages they open, and the devices they use.
          </p>
        </div>
        <a
          href="https://dash.cloudflare.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-void-border px-3 py-2 text-xs text-void-light hover:border-electric-purple"
        >Cloudflare Analytics <ArrowUpRight className="h-4 w-4" /></a>
      </header>

      <nav aria-label="Traffic date range" className="flex flex-wrap items-center gap-2">
        <CalendarDays className="mr-1 h-4 w-4 text-void-muted" aria-hidden="true" />
        {periods.map(({ value, label }) => (
          <Link
            key={value}
            href={`/admin/traffic?period=${value}`}
            aria-current={period === value ? "page" : undefined}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
              period === value
                ? "border-electric-purple/70 bg-electric-violet/20 text-white"
                : "border-void-border/70 text-void-muted hover:text-white"
            }`}
          >{label}</Link>
        ))}
        <Link
          href={`/admin/traffic?period=${period}&refresh=1`}
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-void-border/70 px-3 py-2 text-xs text-void-light hover:border-electric-purple"
        ><RefreshCw className="h-4 w-4" /> Refresh</Link>
      </nav>

      {failed ? (
        <div role="alert" className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-6">
          <h2 className="text-lg font-bold text-white">Traffic data temporarily unavailable</h2>
          <p className="mt-2 text-sm text-void-light">
            Your website is still running. Check Cloudflare's Account Analytics Read token, query permissions, or service availability.
            No traffic counts have been replaced with fake zeroes.
          </p>
        </div>
      ) : report ? <TrafficContent report={report} /> : null}
      <p className="text-xs text-void-muted">
        <Smartphone className="mr-1 inline h-3.5 w-3.5" /><Laptop className="mr-2 inline h-3.5 w-3.5" />
        Aggregated browser measurements only. No fingerprinting or precise visitor location.
      </p>
    </div>
  );
}
