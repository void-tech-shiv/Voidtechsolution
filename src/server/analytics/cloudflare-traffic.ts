import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Server-side Cloudflare Web Analytics integration.
 * The bearer token is read from the Worker Secret binding. It is never
 * serialized into React props, sent to the browser, or written to logs.
 */
export type TrafficPeriod = "24h" | "7d" | "30d";
export type TrafficDimension = { label: string; views: number };
export type TrafficDay = { date: string; pageViews: number; visits: number };

export interface TrafficReport {
  period: TrafficPeriod;
  from: string;
  to: string;
  visits: number;
  pageViews: number;
  daily: TrafficDay[];
  countries: TrafficDimension[];
  devices: TrafficDimension[];
  browsers: TrafficDimension[];
  operatingSystems: TrafficDimension[];
  sources: TrafficDimension[];
  pages: TrafficDimension[];
}

interface Group {
  count?: number;
  sum?: { visits?: number };
  dimensions?: Record<string, string | number | null>;
}

interface GroupData {
  totals?: Group[];
  daily?: Group[];
  countries?: Group[];
  devices?: Group[];
  browsers?: Group[];
  operatingSystems?: Group[];
  sources?: Group[];
  pages?: Group[];
}

// The site tag and account ID are public configuration identifiers, NOT secrets.
const DEFAULT_HOST = "voidtechsolution.codedev.co.in";
const GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";

/**
 * Verified against Cloudflare's live RUM GraphQL schema.
 * Account + siteTag + requestHost avoid mixing the founder's portfolio
 * (codedev.co.in) with this agency site. Excludes known bots and /admin.
 * Counts are page views; sum.visits measures visits, not unique people.
 */
const TRAFFIC_QUERY = `
query TrafficReport($account: string!, $site: string!, $hostname: string!, $start: Time!, $end: Time!) {
  viewer {
    accounts(filter: { accountTag: $account }) {
      totals: rumPageloadEventsAdaptiveGroups(
        limit: 1
        filter: {siteTag: $site, requestHost: $hostname, bot: 0, requestPath_notlike: "/admin%", datetime_geq: $start, datetime_leq: $end}
      ) { count sum { visits } }
      daily: rumPageloadEventsAdaptiveGroups(
        limit: 40, orderBy: [date_ASC]
        filter: {siteTag: $site, requestHost: $hostname, bot: 0, requestPath_notlike: "/admin%", datetime_geq: $start, datetime_leq: $end}
      ) { count sum { visits } dimensions { date } }
      countries: rumPageloadEventsAdaptiveGroups(
        limit: 20, orderBy: [count_DESC]
        filter: {siteTag: $site, requestHost: $hostname, bot: 0, requestPath_notlike: "/admin%", datetime_geq: $start, datetime_leq: $end}
      ) { count dimensions { countryName } }
      devices: rumPageloadEventsAdaptiveGroups(
        limit: 12, orderBy: [count_DESC]
        filter: {siteTag: $site, requestHost: $hostname, bot: 0, requestPath_notlike: "/admin%", datetime_geq: $start, datetime_leq: $end}
      ) { count dimensions { deviceType } }
      browsers: rumPageloadEventsAdaptiveGroups(
        limit: 15, orderBy: [count_DESC]
        filter: {siteTag: $site, requestHost: $hostname, bot: 0, requestPath_notlike: "/admin%", datetime_geq: $start, datetime_leq: $end}
      ) { count dimensions { userAgentBrowser } }
      operatingSystems: rumPageloadEventsAdaptiveGroups(
        limit: 15, orderBy: [count_DESC]
        filter: {siteTag: $site, requestHost: $hostname, bot: 0, requestPath_notlike: "/admin%", datetime_geq: $start, datetime_leq: $end}
      ) { count dimensions { userAgentOS } }
      sources: rumPageloadEventsAdaptiveGroups(
        limit: 20, orderBy: [count_DESC]
        filter: {siteTag: $site, requestHost: $hostname, bot: 0, requestPath_notlike: "/admin%", datetime_geq: $start, datetime_leq: $end}
      ) { count dimensions { refererHost } }
      pages: rumPageloadEventsAdaptiveGroups(
        limit: 25, orderBy: [count_DESC]
        filter: {siteTag: $site, requestHost: $hostname, bot: 0, requestPath_notlike: "/admin%", datetime_geq: $start, datetime_leq: $end}
      ) { count dimensions { requestPath } }
    }
  }
}
`;

function getConfig(): { token: string; account: string; site: string; hostname: string } {
  // Do not fall back to process-global variables in the deployed Worker:
  // the token must come from the current request's Cloudflare env binding.
  const worker = process.env.IS_CLOUDFLARE_WORKER === "true";
  const env = worker
    ? (getCloudflareContext().env as unknown as Record<string, string | undefined>)
    : process.env;
  const token = env.CLOUDFLARE_ANALYTICS_API_TOKEN;
  const account = env.CLOUDFLARE_ACCOUNT_ID;
  const site = env.CLOUDFLARE_ANALYTICS_SITE_TAG;
  const hostname = env.CLOUDFLARE_ANALYTICS_HOST || DEFAULT_HOST;
  if (!token || !account || !site) {
    throw new Error("Traffic analytics is not configured.");
  }
  return { token, account, site, hostname };
}

const safeCount = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;

function groupedRows(rows: Group[] | undefined, dimension: string, fallback = "Unknown"): TrafficDimension[] {
  return (rows ?? []).map((row) => {
    const raw = row.dimensions?.[dimension];
    return { label: typeof raw === "string" && raw.trim() ? raw.trim() : fallback, views: safeCount(row.count) };
  }).filter((row) => row.views > 0);
}

export function buildTrafficReport(
  rows: GroupData,
  period: TrafficPeriod,
  from: string,
  to: string,
  hostname: string = DEFAULT_HOST
): TrafficReport {
  const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
  const countries = groupedRows(rows.countries, "countryName").map((row) => {
    try {
      return { ...row, label: /^[A-Z]{2}$/.test(row.label) ? (countryNames.of(row.label) ?? row.label) : row.label };
    } catch {
      return row;
    }
  });

  const sources = groupedRows(rows.sources, "refererHost", "Direct / unknown")
    .map((row) => ({
      ...row,
      label: row.label.toLowerCase() === hostname ? "Internal navigation" : row.label,
    }));

  return {
    period,
    from,
    to,
    visits: safeCount(rows.totals?.[0]?.sum?.visits),
    pageViews: safeCount(rows.totals?.[0]?.count),
    daily: (rows.daily ?? [])
      .map((row) => ({
        date: String(row.dimensions?.date ?? ""),
        pageViews: safeCount(row.count),
        visits: safeCount(row.sum?.visits),
      }))
      .filter((row) => /^\\d{4}-\\d{2}-\\d{2}$/.test(row.date))
      .sort((a, b) => a.date.localeCompare(b.date)),
    countries,
    devices: groupedRows(rows.devices, "deviceType"),
    browsers: groupedRows(rows.browsers, "userAgentBrowser"),
    operatingSystems: groupedRows(rows.operatingSystems, "userAgentOS"),
    sources,
    pages: groupedRows(rows.pages, "requestPath")
      .filter((row) => !row.label.startsWith("/admin")),
  };
}

export function normalizeTrafficPeriod(value: string | undefined): TrafficPeriod {
  return value === "24h" || value === "30d" ? value : "7d";
}

export async function getTrafficReport(period: TrafficPeriod): Promise<TrafficReport> {
  const { token, account, site, hostname } = getConfig();
  const to = new Date();
  const from = new Date(to.getTime() - (period === "24h" ? 24 : period === "7d" ? 168 : 720) * 3600_000);

  let response: Response;
  try {
    response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: TRAFFIC_QUERY,
        variables: { account, site, hostname, start: from.toISOString(), end: to.toISOString() },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error("Cloudflare Analytics could not be reached.");
  }

  if (!response.ok) {
    // Do not log response bodies or authorization headers (could contain secrets).
    throw new Error(`Cloudflare Analytics returned HTTP ${response.status}.`);
  }

  let payload: {
    errors?: Array<{ message?: string }>;
    data?: { viewer?: { accounts?: GroupData[] } };
  };
  try {
    payload = await response.json() as typeof payload;
  } catch {
    throw new Error("Cloudflare Analytics returned invalid JSON.");
  }
  if (payload.errors?.length) {
    throw new Error("Cloudflare rejected the traffic analytics query. Check read permissions and query limits.");
  }
  const data = payload.data?.viewer?.accounts?.[0];
  if (!data || !Array.isArray(data.totals)) {
    throw new Error("Cloudflare Analytics returned an incomplete result.");
  }
  return buildTrafficReport(data, period, from.toISOString(), to.toISOString(), hostname);
}
