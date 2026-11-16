"use client";

import * as React from "react";
import type { AuditLog } from "@prisma/client";
import {
  Search,
  Filter,
  Eye,
  X,
} from "lucide-react";

interface AuditLogsClientProps {
  initialLogs: AuditLog[];
  totalLogs: number;
}

export function AuditLogsClient({ initialLogs, totalLogs }: AuditLogsClientProps) {
  const [logs] = React.useState<AuditLog[]>(initialLogs);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedAction, setSelectedAction] = React.useState("ALL");
  const [inspectingLog, setInspectingLog] = React.useState<AuditLog | null>(null);

  // Derive unique action types for filter dropdown
  const actionTypes = React.useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.action));
    return ["ALL", ...Array.from(set)];
  }, [logs]);

  // Filter logs by search and action
  const filteredLogs = React.useMemo(() => {
    return logs.filter((log) => {
      const matchesAction = selectedAction === "ALL" || log.action === selectedAction;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        log.action.toLowerCase().includes(searchLower) ||
        (log.actorEmail && log.actorEmail.toLowerCase().includes(searchLower)) ||
        log.entity.toLowerCase().includes(searchLower) ||
        (log.entityId && log.entityId.toLowerCase().includes(searchLower));
      return matchesAction && matchesSearch;
    });
  }, [logs, selectedAction, searchTerm]);

  return (
    <div className="space-y-6" data-testid="admin-audit-logs-page">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Audit Trail & Security Logs
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Immutable, append-only record of administrative, authentication, and platform events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-violet-500/20 bg-violet-950/30 px-3 py-1.5 font-mono text-xs text-violet-300">
            {totalLogs} Events Recorded
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-neutral-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by actor email, entity, or ID..."
            className="w-full rounded-xl border border-white/10 bg-neutral-950 py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-500" />
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
          >
            {actionTypes.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-300" data-testid="admin-audit-table">
            <thead className="border-b border-white/10 bg-neutral-950/60 text-xs uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Timestamp</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Actor</th>
                <th className="px-6 py-4 font-semibold">Entity</th>
                <th className="px-6 py-4 font-semibold">IP Address</th>
                <th className="px-6 py-4 text-right font-semibold">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center font-sans text-neutral-500">
                    No audit records match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-6 py-4 text-neutral-400">
                      {new Date(log.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 font-sans text-[11px] font-semibold ${
                          log.action.includes("FAILED") || log.action.includes("DELETED")
                            ? "bg-red-950/50 text-red-300 border border-red-500/20"
                            : log.action.includes("BOOTSTRAP") || log.action.includes("SUCCESS")
                            ? "bg-emerald-950/50 text-emerald-300 border border-emerald-500/20"
                            : "bg-violet-950/50 text-violet-300 border border-violet-500/20"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-neutral-300">
                      {log.actorEmail || log.actorId || "System"}
                    </td>

                    <td className="px-6 py-4 text-neutral-400">
                      {log.entity} {log.entityId && `(${log.entityId.slice(0, 8)}...)`}
                    </td>

                    <td className="px-6 py-4 text-neutral-500">
                      {log.ipAddress || "127.0.0.1"}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {log.details ? (
                        <button
                          onClick={() => setInspectingLog(log)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/5 bg-neutral-800/80 px-2.5 py-1 font-sans text-xs text-neutral-300 hover:border-violet-500/30 hover:bg-neutral-800 hover:text-white"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </button>
                      ) : (
                        <span className="text-neutral-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Inspector Modal */}
      {inspectingLog && (
        <div
          data-testid="audit-details-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Audit Event Details</h2>
                <div className="mt-1 font-mono text-xs text-violet-400">
                  {inspectingLog.action}
                </div>
              </div>
              <button
                onClick={() => setInspectingLog(null)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-neutral-950 p-3 text-neutral-400">
                <div>
                  <span className="text-neutral-600">Event ID:</span> {inspectingLog.id}
                </div>
                <div>
                  <span className="text-neutral-600">Timestamp:</span>{" "}
                  {new Date(inspectingLog.createdAt).toISOString()}
                </div>
                <div>
                  <span className="text-neutral-600">Actor:</span>{" "}
                  {inspectingLog.actorEmail || "SYSTEM"}
                </div>
                <div>
                  <span className="text-neutral-600">Entity:</span> {inspectingLog.entity}
                </div>
              </div>

              <div>
                <div className="mb-1.5 font-sans font-medium text-neutral-300">
                  Metadata & Sanitized Context:
                </div>
                <pre className="max-h-60 overflow-y-auto rounded-xl border border-white/5 bg-neutral-950 p-4 text-emerald-400">
                  {JSON.stringify(inspectingLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setInspectingLog(null)}
                className="rounded-xl border border-white/10 bg-neutral-800 px-4 py-2 text-xs font-medium text-white hover:bg-neutral-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
