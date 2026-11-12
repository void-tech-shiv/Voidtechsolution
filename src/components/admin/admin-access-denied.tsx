import * as React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import type { UserRole } from "@prisma/client";
import type { PermissionKey } from "@/server/security/rbac";

interface AdminAccessDeniedProps {
  requiredPermission?: PermissionKey;
  role?: UserRole;
  title?: string;
  description?: string;
}

export function AdminAccessDenied({
  requiredPermission,
  role,
  title = "Access Restricted",
  description = "You do not have the required permissions to access this administrative console section.",
}: AdminAccessDeniedProps) {
  return (
    <div
      data-testid="admin-access-denied"
      className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center"
    >
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 shadow-lg shadow-red-500/5">
        <ShieldAlert className="h-10 w-10 text-red-400" />
      </div>

      <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-950/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-400">
        HTTP 403 Forbidden
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
        {title}
      </h1>

      <p className="mt-2 max-w-md text-sm text-neutral-400 sm:text-base">
        {description}
      </p>

      {(requiredPermission || role) && (
        <div className="mt-6 rounded-xl border border-white/10 bg-neutral-900/60 p-4 text-left font-mono text-xs text-neutral-300">
          {role && (
            <div className="flex items-center justify-between gap-4 py-1">
              <span className="text-neutral-500">Active Role:</span>
              <span className="rounded bg-neutral-800 px-2 py-0.5 font-semibold text-violet-400">
                {role}
              </span>
            </div>
          )}
          {requiredPermission && (
            <div className="flex items-center justify-between gap-4 py-1">
              <span className="text-neutral-500">Required Permission:</span>
              <span className="rounded bg-neutral-800 px-2 py-0.5 font-semibold text-red-300">
                {requiredPermission}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-violet-500/50 hover:bg-neutral-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Overview
        </Link>
      </div>
    </div>
  );
}

