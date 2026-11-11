"use client";

import * as React from "react";
import Link from "next/link";
import { Search, ArrowUpRight, CheckCircle2 } from "lucide-react";
import type { Service, ServiceCategory } from "@prisma/client";
import { ServiceIcon } from "./service-icon";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORIES: { label: string; value: ServiceCategory | "ALL" }[] = [
  { label: "All Services (18)", value: "ALL" },
  { label: "Web", value: "WEB_DEVELOPMENT" },
  { label: "Mobile", value: "MOBILE_DEVELOPMENT" },
  { label: "API & Systems", value: "API_BACKEND" },
  { label: "AI & Agents", value: "AI_AUTOMATION" },
  { label: "Bots & Automation", value: "BOTS_AUTOMATION" },
  { label: "Enterprise & SaaS", value: "ENTERPRISE_SYSTEMS" },
  { label: "FinTech & UPI", value: "FINTECH_PAYMENTS" },
  { label: "Design", value: "DESIGN_CREATIVE" },
  { label: "Cloud & DevOps", value: "CLOUD_HOSTING" },
];

interface ServicesFilterProps {
  initialServices: Service[];
}

export function ServicesFilter({ initialServices }: ServicesFilterProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<ServiceCategory | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredServices = React.useMemo(() => {
    return initialServices.filter((service) => {
      const matchesCategory =
        selectedCategory === "ALL" || service.category === selectedCategory;
      const matchesQuery =
        searchQuery.trim() === "" ||
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.technologies.some((tech) =>
          tech.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesCategory && matchesQuery;
    });
  }, [initialServices, selectedCategory, searchQuery]);

  return (
    <div className="w-full space-y-8">
      {/* Search and Category Filter Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Category Pills */}
        <div
          className="flex flex-wrap items-center gap-2"
          role="tablist"
          aria-label="Filter services by category"
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCategory(cat.value)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-mono transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-purple",
                  isActive
                    ? "bg-electric-purple text-white shadow-glow-xs font-bold"
                    : "border border-void-border/80 bg-void-surface/60 text-void-muted hover:border-electric-purple/40 hover:text-void-white"
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Keyword Search Input */}
        <div className="relative w-full md:w-72">
          <label htmlFor="service-search" className="sr-only">
            Search services
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-void-muted"
            aria-hidden="true"
          />
          <input
            id="service-search"
            type="search"
            placeholder="Search capabilities or tech..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-void-border/80 bg-void-surface/80 py-2 pl-9 pr-3 text-xs text-void-white placeholder:text-void-muted focus:border-electric-purple focus:outline-none focus:ring-1 focus:ring-electric-purple"
          />
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="rounded-xl border border-void-border/60 bg-void-surface/30 p-12 text-center">
          <p className="text-sm font-medium text-void-white">No services match your search.</p>
          <p className="mt-1 text-xs text-void-muted">
            Try adjusting your keyword or reset the category filter.
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedCategory("ALL");
              setSearchQuery("");
            }}
            className="mt-4 text-xs text-electric-purple"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service, index) => (
            <GlassCard
              key={service.id || service.slug}
              className="group flex flex-col justify-between transition-all duration-300 hover:border-electric-purple/50 hover:shadow-glow-sm"
            >
              <div>
                {/* Header: Icon, Category & Order Number */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-void-surface border border-electric-purple/30 text-electric-purple group-hover:scale-105 group-hover:border-electric-purple group-hover:shadow-glow-xs transition-all">
                      <ServiceIcon name={service.icon} />
                    </div>
                    <span className="font-mono text-xs font-semibold text-void-muted">
                      #{String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="rounded-full border border-void-border bg-void-surface/90 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-void-muted">
                    {service.category.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Service Title */}
                <h3 className="text-lg font-semibold tracking-tight text-void-white group-hover:text-electric-purple transition-colors mb-2">
                  {service.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-void-muted leading-relaxed line-clamp-3 mb-4">
                  {service.shortDesc}
                </p>

                {/* Starting Price Tag if applicable */}
                {service.startingPriceInr ? (
                  <div className="mb-4 inline-flex items-center gap-1.5 rounded-md border border-electric-purple/30 bg-electric-purple/10 px-2.5 py-1 text-xs font-mono font-medium text-electric-purple">
                    <span>Starting from</span>
                    <span className="font-bold text-white">
                      ₹{service.startingPriceInr.toLocaleString("en-IN")}
                      {service.startingPriceInr >= 10000 ? "+" : ""}
                    </span>
                  </div>
                ) : null}

                {/* Deliverables Checklist */}
                {service.deliverables && service.deliverables.length > 0 && (
                  <ul className="mb-4 space-y-1.5 text-xs text-void-light/90" aria-label={`Deliverables for ${service.title}`}>
                    {service.deliverables.slice(0, 3).map((d) => (
                      <li key={d} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-electric-purple mt-0.5" aria-hidden="true" />
                        <span className="text-[11px] leading-tight text-void-muted">{d}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Bottom: Tech Stack & CTA */}
              <div className="pt-4 border-t border-void-border/50">
                {service.technologies && service.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {service.technologies.slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md border border-void-border bg-void-surface/60 px-2 py-0.5 text-[10px] font-mono text-void-light"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                <Link
                  href="/#contact"
                  className="inline-flex w-full items-center justify-between rounded-lg border border-void-border/70 bg-void-surface/50 px-3.5 py-2 text-xs font-medium text-void-light transition-all hover:border-electric-purple hover:bg-electric-purple/10 hover:text-white group/btn"
                >
                  <span>Inquire for {service.title}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-electric-purple transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" aria-hidden="true" />
                </Link>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
