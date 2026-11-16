"use client";

import * as React from "react";
import Link from "next/link";
import { Search, ArrowRight, Filter, X, Cpu } from "lucide-react";
import type { PortfolioProject } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PortfolioFilterProps {
  initialProjects: PortfolioProject[];
}

export function PortfolioFilter({ initialProjects }: PortfolioFilterProps) {
  const [selectedIndustry, setSelectedIndustry] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Extract unique industries dynamically
  const industries = React.useMemo(() => {
    const set = new Set<string>();
    initialProjects.forEach((p) => {
      if (p.industry) set.add(p.industry);
    });
    return ["ALL", ...Array.from(set)];
  }, [initialProjects]);

  // Filter projects by category and query
  const filteredProjects = React.useMemo(() => {
    return initialProjects.filter((project) => {
      const matchesIndustry =
        selectedIndustry === "ALL" ||
        project.industry.toLowerCase() === selectedIndustry.toLowerCase();

      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesIndustry;

      const matchesTitle = project.title.toLowerCase().includes(query);
      const matchesSummary = project.summary.toLowerCase().includes(query);
      const matchesTech = project.techStack.some((tech) =>
        tech.toLowerCase().includes(query)
      );

      return matchesIndustry && (matchesTitle || matchesSummary || matchesTech);
    });
  }, [initialProjects, selectedIndustry, searchQuery]);

  const handleReset = () => {
    setSelectedIndustry("ALL");
    setSearchQuery("");
  };

  return (
    <div className="space-y-10">
      {/* Search & Category Filter Controls */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-void-border/60 pb-8">
        {/* Category Pills */}
        <div
          className="flex flex-wrap items-center gap-2"
          role="radiogroup"
          aria-label="Filter projects by industry"
        >
          {industries.map((ind) => {
            const isSelected = selectedIndustry === ind;
            const label = ind === "ALL" ? "All Projects" : ind.replace(/_/g, " ");
            return (
              <button
                key={ind}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedIndustry(ind)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-mono font-medium transition-all ${
                  isSelected
                    ? "bg-electric-purple text-white shadow-glow-sm border border-electric-neon"
                    : "bg-void-surface/60 text-void-light border border-void-border hover:border-electric-purple/40 hover:text-white"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Live Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-void-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects or tech..."
            className="w-full rounded-lg border border-void-border bg-void-surface/60 py-2 pl-9 pr-8 text-xs text-void-light placeholder:text-void-muted focus:border-electric-purple focus:outline-none focus:ring-1 focus:ring-electric-purple transition-all"
            aria-label="Search projects by keyword or technology"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-void-muted hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Projects Count Summary */}
      <div className="flex items-center justify-between text-xs text-void-muted font-mono">
        <span>
          Showing <strong className="text-white">{filteredProjects.length}</strong> of{" "}
          <strong className="text-white">{initialProjects.length}</strong> engineering concepts
        </span>
        {(selectedIndustry !== "ALL" || searchQuery) && (
          <button
            type="button"
            onClick={handleReset}
            className="text-electric-purple hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            // Metrics parsing
            const metricsArray = Array.isArray(project.metrics)
              ? (project.metrics as Array<{ label: string; value: string }>)
              : [];

            return (
              <Card
                key={project.id}
                className="flex flex-col justify-between border-void-border bg-void-charcoal/40 backdrop-blur-sm hover:border-electric-purple/60 hover:shadow-glow-xs transition-all group overflow-hidden"
              >
                <CardContent className="p-6 flex flex-col h-full justify-between space-y-5">
                  <div className="space-y-4">
                    {/* Header: Industry & Classification Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-electric-purple font-semibold">
                        {project.industry.replace(/_/g, " ")}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-electric-purple/40 bg-electric-purple/10 text-electric-purple text-[10px] font-mono uppercase tracking-wider"
                      >
                        {project.projectType || "CONCEPT"}
                      </Badge>
                    </div>

                    {/* Title */}
                    <h3 className="font-mono text-xl font-bold text-white group-hover:text-electric-purple transition-colors leading-snug">
                      <Link href={`/portfolio/${project.slug}`}>
                        {project.title}
                      </Link>
                    </h3>

                    {/* Summary */}
                    <p className="text-xs sm:text-sm text-void-light leading-relaxed line-clamp-3">
                      {project.summary}
                    </p>

                    {/* Simulated Benchmarks */}
                    {metricsArray.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-void-border/50">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-void-muted uppercase tracking-wider">
                          <Cpu className="h-3 w-3 text-electric-purple" />
                          <span>SIMULATED BENCHMARK</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {metricsArray.slice(0, 2).map((m, mIdx) => (
                            <div
                              key={mIdx}
                              className="rounded bg-void-surface/60 border border-void-border/60 p-2"
                            >
                              <span className="block text-[10px] text-void-muted truncate">
                                {m.label}
                              </span>
                              <span className="font-mono text-xs font-bold text-white">
                                {m.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer: Tech Stack Tags & Action CTA */}
                  <div className="space-y-4 pt-3 border-t border-void-border/50">
                    <div className="flex flex-wrap gap-1.5">
                      {project.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="rounded bg-void-surface border border-void-border/80 px-2 py-0.5 text-[10px] font-mono text-void-light"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    <Link
                      href={`/portfolio/${project.slug}`}
                      className="inline-flex w-full items-center justify-between text-xs font-mono font-medium text-electric-purple hover:text-white pt-1 transition-colors group/link"
                    >
                      <span>View Case Study</span>
                      <ArrowRight className="h-3.5 w-3.5 transform transition-transform group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-void-border bg-void-surface/30">
          <div className="p-3.5 rounded-full bg-electric-purple/10 border border-electric-purple/20 text-electric-purple mb-4">
            <Filter className="h-6 w-6" />
          </div>
          <h3 className="font-mono text-lg font-bold text-white mb-2">
            No matching projects found
          </h3>
          <p className="text-xs sm:text-sm text-void-muted max-w-md mb-6">
            We couldn&apos;t find any engineering concepts matching your current filters. Try selecting a different industry or clearing your search term.
          </p>
          <Button size="sm" variant="outline" onClick={handleReset}>
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
