"use client";

import * as React from "react";
import type { PortfolioProject } from "@prisma/client";
import {
  Search,
  Filter,
  Eye,
  X,
} from "lucide-react";

interface AdminPortfolioClientProps {
  initialProjects: PortfolioProject[];
}

export function AdminPortfolioClient({ initialProjects }: AdminPortfolioClientProps) {
  const [projects] = React.useState<PortfolioProject[]>(initialProjects);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedIndustry, setSelectedIndustry] = React.useState("ALL");
  const [inspectingProject, setInspectingProject] = React.useState<PortfolioProject | null>(null);

  const industries = React.useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => set.add(p.industry));
    return ["ALL", ...Array.from(set)];
  }, [projects]);

  const filteredProjects = React.useMemo(() => {
    return projects.filter((item) => {
      const matchesIndustry = selectedIndustry === "ALL" || item.industry === selectedIndustry;
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        item.title.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q);
      return matchesIndustry && matchesSearch;
    });
  }, [projects, selectedIndustry, searchTerm]);

  return (
    <div className="space-y-6" data-testid="admin-portfolio-page">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Portfolio & Architecture Prototypes
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Case study showcase featuring internal concept designs and architectural proof-of-concepts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-violet-500/20 bg-violet-950/30 px-3 py-1.5 font-mono text-xs text-violet-300">
            {projects.length} Case Studies
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
            placeholder="Search project title, slug, or summary..."
            className="w-full rounded-xl border border-white/10 bg-neutral-950 py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-500" />
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
          >
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind === "ALL" ? "All Industries" : ind}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-300" data-testid="admin-portfolio-table">
            <thead className="border-b border-white/10 bg-neutral-950/60 text-xs uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Case Study Title</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Industry</th>
                <th className="px-6 py-4 font-semibold">Tech Stack</th>
                <th className="px-6 py-4 font-semibold">Featured</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredProjects.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="font-mono text-[11px] text-neutral-500">/{item.slug}</div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300">
                      {item.projectType}
                    </span>
                  </td>

                  <td className="px-6 py-4 font-mono text-[11px] text-neutral-400">
                    {item.industry}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {item.techStack.slice(0, 3).map((t, i) => (
                        <span key={i} className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300">
                          {t}
                        </span>
                      ))}
                      {item.techStack.length > 3 && (
                        <span className="text-[10px] text-neutral-500">+{item.techStack.length - 3}</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {item.isFeatured ? (
                      <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-300 border border-violet-500/20">
                        Featured
                      </span>
                    ) : (
                      <span className="text-neutral-600">—</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setInspectingProject(item)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/5 bg-neutral-800/80 px-2.5 py-1 text-xs text-neutral-300 hover:border-violet-500/30 hover:bg-neutral-800 hover:text-white"
                    >
                      <Eye className="h-3 w-3" />
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Study Inspector Modal */}
      {inspectingProject && (
        <div
          data-testid="portfolio-detail-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{inspectingProject.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/20">
                    {inspectingProject.projectType}
                  </span>
                  <span className="font-mono text-xs text-neutral-400">
                    {inspectingProject.clientName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectingProject(null)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <span className="font-semibold text-neutral-300">Executive Summary:</span>
                <p className="mt-1 text-neutral-400 leading-relaxed">{inspectingProject.summary}</p>
              </div>

              <div>
                <span className="font-semibold text-neutral-300">Technical Challenge:</span>
                <p className="mt-1 text-neutral-400 leading-relaxed">{inspectingProject.challenge}</p>
              </div>

              <div>
                <span className="font-semibold text-neutral-300">Architectural Solution:</span>
                <p className="mt-1 text-neutral-400 leading-relaxed">{inspectingProject.solution}</p>
              </div>

              <div>
                <span className="font-semibold text-neutral-300">Simulated Benchmark Results:</span>
                <p className="mt-1 text-emerald-400 font-mono leading-relaxed">{inspectingProject.results}</p>
              </div>

              <div>
                <span className="font-semibold text-neutral-300">Complete Technology Stack:</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {inspectingProject.techStack.map((tech, i) => (
                    <span
                      key={i}
                      className="rounded-lg border border-white/10 bg-neutral-950 px-2.5 py-1 text-[11px] text-neutral-200"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setInspectingProject(null)}
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
