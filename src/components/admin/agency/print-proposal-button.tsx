"use client";

import { Printer } from "lucide-react";

export function PrintProposalButton() {
  return <button
    type="button"
    onClick={() => window.print()}
    className="inline-flex items-center gap-2 rounded-lg border border-void-border px-4 py-2 text-sm font-semibold text-white hover:border-electric-purple print:hidden"
  ><Printer className="h-4 w-4" /> Print / Save as PDF</button>;
}
