"use client";

import Link from "next/link";
import { AlertTriangle, LogOut } from "lucide-react";

/**
 * VOIDTECH SOLUTION — Draft Mode Preview HUD Banner
 * 
 * Persistent amber banner displayed whenever Next.js Draft Mode is active.
 * Warns administrators that unpublished editorial revisions are being rendered
 * and guarantees that search engine indexing is blocked.
 */
export function DraftModeHudBanner() {
  return (
    <aside
      aria-label="Draft mode preview active"
      className="sticky top-0 z-[100] w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-black px-4 py-2 shadow-lg shadow-amber-500/20"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-black text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </span>
          <span>
            <strong>DRAFT MODE PREVIEW ACTIVE:</strong> Rendering unpublished CMS revisions. Search indexing blocked.
          </span>
        </div>

        <Link
          href="/api/draft-mode/disable"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-black text-amber-300 hover:bg-black/80 hover:text-white transition-colors text-xs font-mono"
        >
          <LogOut className="w-3.5 h-3.5" />
          Exit Preview
        </Link>
      </div>
    </aside>
  );
}

