"use client";

import * as React from "react";
import type { Service } from "@prisma/client";
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
import { toggleServiceActiveAction } from "@/server/actions/admin-content.actions";

interface AdminServicesClientProps {
  initialServices: Service[];
}

export function AdminServicesClient({ initialServices }: AdminServicesClientProps) {
  const [services, setServices] = React.useState<Service[]>(initialServices);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");
  const [inspectingService, setInspectingService] = React.useState<Service | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => set.add(s.category));
    return ["ALL", ...Array.from(set)];
  }, [services]);

  const filteredServices = React.useMemo(() => {
    return services.filter((item) => {
      const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        item.title.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.shortDesc.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [services, selectedCategory, searchTerm]);

  const handleToggleActive = async (service: Service) => {
    setIsPending(true);
    setFeedback(null);
    const nextStatus = !service.isActive;

    try {
      const res = await toggleServiceActiveAction(service.id, nextStatus);
      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to update service status." });
        return;
      }

      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, isActive: nextStatus } : s))
      );
      setFeedback({
        type: "success",
        message: `Service '${service.title}' is now ${nextStatus ? "Active" : "Hidden"}.`,
      });
    } catch {
      setFeedback({ type: "error", message: "Network error occurred." });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-services-page">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Registered Agency Offerings
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Catalog of all 18 registered engineering and design services with baseline INR pricing.
          </p>
        </div>
        <div className="rounded-xl border border-violet-500/20 bg-violet-950/30 px-3 py-1.5 font-mono text-xs text-violet-300">
          {services.length} Registered Offerings
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-neutral-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search service title, slug, or description..."
            className="w-full rounded-xl border border-white/10 bg-neutral-950 py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-500" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "All Categories" : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          data-testid="admin-services-feedback"
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

      {/* Services Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-300" data-testid="admin-services-table">
            <thead className="border-b border-white/10 bg-neutral-950/60 text-xs uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Service</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Starting Price</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredServices.map((service) => (
                <tr key={service.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">{service.title}</div>
                    <div className="text-[11px] text-neutral-400 line-clamp-1">{service.shortDesc}</div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded bg-neutral-800 px-2 py-0.5 text-[11px] font-mono text-neutral-300">
                      {service.category}
                    </span>
                  </td>

                  <td className="px-6 py-4 font-semibold text-violet-300">
                    {service.startingPriceInr ? `₹${service.startingPriceInr.toLocaleString("en-IN")}+` : "Custom"}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        service.isActive
                          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : "border border-neutral-700 bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          service.isActive ? "bg-emerald-400" : "bg-neutral-500"
                        }`}
                      />
                      {service.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setInspectingService(service)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/5 bg-neutral-800/80 px-2.5 py-1 text-xs text-neutral-300 hover:border-violet-500/30 hover:bg-neutral-800 hover:text-white"
                      >
                        <Eye className="h-3 w-3" />
                        Details
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => handleToggleActive(service)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                          service.isActive
                            ? "border-amber-500/20 bg-amber-950/20 text-amber-300 hover:bg-amber-900/30"
                            : "border-emerald-500/20 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/30"
                        }`}
                      >
                        {service.isActive ? "Hide" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service Details Modal */}
      {inspectingService && (
        <div
          data-testid="service-detail-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{inspectingService.title}</h2>
                <div className="font-mono text-xs text-violet-400">/{inspectingService.slug}</div>
              </div>
              <button
                onClick={() => setInspectingService(null)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <span className="text-neutral-500">Overview:</span>
                <p className="mt-1 text-neutral-300 leading-relaxed">{inspectingService.fullDesc}</p>
              </div>

              <div>
                <span className="text-neutral-500">Key Deliverables:</span>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-neutral-300">
                  {inspectingService.deliverables.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-neutral-500">Technologies:</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {inspectingService.technologies.map((t, i) => (
                    <span
                      key={i}
                      className="rounded-lg border border-white/10 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setInspectingService(null)}
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
