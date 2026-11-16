"use client";

import * as React from "react";
import type { PricingPackage } from "@prisma/client";
import {
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  Star,
} from "lucide-react";
import { togglePricingPackageActiveAction } from "@/server/actions/admin-content.actions";

interface AdminPricingClientProps {
  initialPackages: PricingPackage[];
}

export function AdminPricingClient({ initialPackages }: AdminPricingClientProps) {
  const [packages, setPackages] = React.useState<PricingPackage[]>(initialPackages);
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");
  const [inspectingPackage, setInspectingPackage] = React.useState<PricingPackage | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    packages.forEach((p) => set.add(p.category));
    return ["ALL", ...Array.from(set)];
  }, [packages]);

  const filteredPackages = React.useMemo(() => {
    return packages.filter((pkg) => {
      return selectedCategory === "ALL" || pkg.category === selectedCategory;
    });
  }, [packages, selectedCategory]);

  const handleToggleActive = async (pkg: PricingPackage) => {
    setIsPending(true);
    setFeedback(null);
    const nextStatus = !pkg.isActive;

    try {
      const res = await togglePricingPackageActiveAction(pkg.id, nextStatus);
      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to update package status." });
        return;
      }

      setPackages((prev) =>
        prev.map((p) => (p.id === pkg.id ? { ...p, isActive: nextStatus } : p))
      );
      setFeedback({
        type: "success",
        message: `Package '${pkg.name}' is now ${nextStatus ? "Active" : "Hidden"}.`,
      });
    } catch {
      setFeedback({ type: "error", message: "Network error occurred." });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-pricing-page">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Approved Pricing Packages
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Catalog of all 10 approved investment tiers with transparent INR pricing baselines.
          </p>
        </div>
        <div className="rounded-xl border border-violet-500/20 bg-violet-950/30 px-3 py-1.5 font-mono text-xs text-violet-300">
          {packages.length} Approved Packages
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-neutral-900/50 p-4">
        <Filter className="h-4 w-4 text-neutral-500" />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "ALL" ? "All Package Categories" : c}
            </option>
          ))}
        </select>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          data-testid="admin-pricing-feedback"
          className={`flex items-center justify-between rounded-xl border p-4 text-sm ${
            feedback.type === "success"
              ? "border-emerald-500/20 bg-emerald-950/30 text-emerald-300"
              : "border-red-500/20 bg-red-950/30 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Pricing Packages Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-300" data-testid="admin-pricing-table">
            <thead className="border-b border-white/10 bg-neutral-950/60 text-xs uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Tier / Package</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Investment (INR)</th>
                <th className="px-6 py-4 font-semibold">Popular</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredPackages.map((pkg) => (
                <tr key={pkg.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">{pkg.name}</div>
                    <div className="font-mono text-[11px] text-neutral-500">/{pkg.slug}</div>
                  </td>

                  <td className="px-6 py-4 font-mono text-[11px] text-neutral-400">
                    {pkg.category}
                  </td>

                  <td className="px-6 py-4 font-bold text-violet-300">
                    ₹{pkg.priceInr.toLocaleString("en-IN")}
                    {pkg.isStartingPrice ? "+" : ""}
                  </td>

                  <td className="px-6 py-4">
                    {pkg.popular ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                        <Star className="h-3 w-3 fill-amber-300" /> Popular
                      </span>
                    ) : (
                      <span className="text-neutral-600">—</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        pkg.isActive
                          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : "border border-neutral-700 bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          pkg.isActive ? "bg-emerald-400" : "bg-neutral-500"
                        }`}
                      />
                      {pkg.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setInspectingPackage(pkg)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/5 bg-neutral-800/80 px-2.5 py-1 text-xs text-neutral-300 hover:border-violet-500/30 hover:bg-neutral-800 hover:text-white"
                      >
                        <Eye className="h-3 w-3" />
                        Features
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => handleToggleActive(pkg)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                          pkg.isActive
                            ? "border-amber-500/20 bg-amber-950/20 text-amber-300 hover:bg-amber-900/30"
                            : "border-emerald-500/20 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/30"
                        }`}
                      >
                        {pkg.isActive ? "Hide" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Package Features Modal */}
      {inspectingPackage && (
        <div
          data-testid="pricing-detail-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{inspectingPackage.name}</h2>
                <div className="font-bold text-violet-400">
                  ₹{inspectingPackage.priceInr.toLocaleString("en-IN")}+
                </div>
              </div>
              <button
                onClick={() => setInspectingPackage(null)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <span className="font-semibold text-neutral-300">Included Scope & Deliverables:</span>
              <ul className="list-disc space-y-1.5 pl-4 text-neutral-300">
                {inspectingPackage.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setInspectingPackage(null)}
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
