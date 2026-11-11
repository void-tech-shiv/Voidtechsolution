"use client";

import * as React from "react";
import Link from "next/link";
import {
  Check,
  Sparkles,
  ArrowRight,
  Calculator,
} from "lucide-react";
import { approvedPricingPackages } from "@/config/pricing";

export type FilterCategory = "ALL" | "WEBSITES" | "PLATFORMS" | "ENTERPRISE_AI";

export function PricingTable() {
  const [activeFilter, setActiveFilter] = React.useState<FilterCategory>("ALL");

  const filteredPackages = React.useMemo(() => {
    switch (activeFilter) {
      case "WEBSITES":
        return approvedPricingPackages.filter((p) =>
          ["basic-static", "standard-business", "professional"].includes(p.slug)
        );
      case "PLATFORMS":
        return approvedPricingPackages.filter((p) =>
          ["premium-custom", "e-commerce", "saas", "marketplace"].includes(p.slug)
        );
      case "ENTERPRISE_AI":
        return approvedPricingPackages.filter((p) =>
          ["lms", "erp-crm", "ai-powered"].includes(p.slug)
        );
      case "ALL":
      default:
        return approvedPricingPackages;
    }
  }, [activeFilter]);

  return (
    <div className="space-y-8">
      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setActiveFilter("ALL")}
          className={`rounded-full px-4 py-2 font-mono text-xs font-semibold transition-all ${
            activeFilter === "ALL"
              ? "bg-electric-purple text-white shadow-glow-sm"
              : "border border-void-border/80 bg-void-surface/50 text-void-muted hover:border-electric-purple/40 hover:text-white"
          }`}
        >
          All Approved Tiers (10)
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("WEBSITES")}
          className={`rounded-full px-4 py-2 font-mono text-xs font-semibold transition-all ${
            activeFilter === "WEBSITES"
              ? "bg-electric-purple text-white shadow-glow-sm"
              : "border border-void-border/80 bg-void-surface/50 text-void-muted hover:border-electric-purple/40 hover:text-white"
          }`}
        >
          Websites & Portals (3)
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("PLATFORMS")}
          className={`rounded-full px-4 py-2 font-mono text-xs font-semibold transition-all ${
            activeFilter === "PLATFORMS"
              ? "bg-electric-purple text-white shadow-glow-sm"
              : "border border-void-border/80 bg-void-surface/50 text-void-muted hover:border-electric-purple/40 hover:text-white"
          }`}
        >
          Platforms & E-Commerce (4)
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("ENTERPRISE_AI")}
          className={`rounded-full px-4 py-2 font-mono text-xs font-semibold transition-all ${
            activeFilter === "ENTERPRISE_AI"
              ? "bg-electric-purple text-white shadow-glow-sm"
              : "border border-void-border/80 bg-void-surface/50 text-void-muted hover:border-electric-purple/40 hover:text-white"
          }`}
        >
          Enterprise & AI (3)
        </button>
      </div>

      {/* Package Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredPackages.map((pkg) => {
          const isPlus = pkg.priceInr >= 10000;
          const formattedPrice = `₹${pkg.priceInr.toLocaleString("en-IN")}${isPlus ? "+" : ""}`;

          return (
            <div
              key={pkg.slug}
              className={`relative flex flex-col justify-between rounded-2xl border p-6 sm:p-7 transition-all duration-300 ${
                pkg.popular
                  ? "border-electric-purple/80 bg-void-surface-elevated/95 shadow-glow-md ring-1 ring-electric-purple/50"
                  : "border-void-border/80 bg-void-card-gradient backdrop-blur-md hover:border-electric-purple/50 hover:shadow-glow-xs"
              }`}
            >
              {/* Popular Badge */}
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-electric-purple to-electric-violet px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white shadow-glow-sm">
                    <Sparkles className="h-3 w-3" />
                    Most Popular Tier
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-void-muted">
                    {pkg.category.replace(/_/g, " ")}
                  </span>
                  <span className="rounded-md border border-void-border/60 bg-void-surface/80 px-2 py-0.5 font-mono text-[10px] text-electric-purple">
                    {pkg.billingPeriod || "project"}
                  </span>
                </div>

                <h3 className="font-mono text-xl font-bold text-white mb-2">{pkg.name}</h3>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-3xl font-extrabold text-white tracking-tight">
                      {formattedPrice}
                    </span>
                    <span className="text-xs font-mono text-void-muted">
                      {pkg.isStartingPrice ? "starting" : "flat"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-void-muted">
                    {pkg.isStartingPrice
                      ? "Base tier. Custom scoping applied based on specifications."
                      : "Turnkey deliverable with complete documentation."}
                  </p>
                </div>

                {/* Features List */}
                <div className="mb-6 border-t border-void-border/60 pt-4">
                  <p className="font-mono text-[11px] font-semibold text-void-light uppercase tracking-wider mb-3">
                    Deliverables Included:
                  </p>
                  <ul className="space-y-2.5">
                    {pkg.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-void-light">
                        <Check className="h-3.5 w-3.5 text-electric-neon shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-void-border/50">
                <Link
                  href={`/contact?package=${pkg.slug}`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-electric-purple/20 border border-electric-purple/50 px-4 py-2.5 text-xs font-mono font-semibold text-white transition-all hover:bg-electric-purple hover:shadow-glow-sm"
                >
                  <span>Select Package</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <a
                  href="#calculator"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-mono text-void-muted transition-colors hover:text-electric-neon"
                >
                  <Calculator className="h-3 w-3" />
                  <span>Customize in Calculator</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
