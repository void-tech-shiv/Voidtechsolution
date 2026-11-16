"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calculator,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";

export interface ProjectCategoryOption {
  id: string;
  label: string;
  description: string;
  defaultPackageId: string;
}

export interface PackageOption {
  id: string;
  name: string;
  startingPrice: number;
  isStartingPlus: boolean;
  category: string;
}

export interface AddonOption {
  id: string;
  name: string;
  description: string;
  price: number | null; // null indicates Custom Quotation Required
}

export const CATEGORY_OPTIONS: ProjectCategoryOption[] = [
  {
    id: "WEB_DEVELOPMENT",
    label: "Website",
    description: "Marketing websites, corporate portals & landing pages",
    defaultPackageId: "basic-static",
  },
  {
    id: "ECOMMERCE",
    label: "E-commerce",
    description: "Online storefronts, cart engines & multi-vendor shops",
    defaultPackageId: "e-commerce",
  },
  {
    id: "MOBILE_DEVELOPMENT",
    label: "Mobile App",
    description: "Cross-platform iOS and Android applications",
    defaultPackageId: "premium-custom",
  },
  {
    id: "SAAS",
    label: "SaaS Platform",
    description: "Multi-tenant cloud applications with subscription billing",
    defaultPackageId: "saas",
  },
  {
    id: "AI_AUTOMATION",
    label: "AI Automation",
    description: "Autonomous agents, vector RAG & intelligent workflow pipelines",
    defaultPackageId: "ai-powered",
  },
  {
    id: "API_BACKEND",
    label: "API & Backend",
    description: "High-throughput microservices, REST/GraphQL & databases",
    defaultPackageId: "premium-custom",
  },
  {
    id: "ENTERPRISE_SYSTEMS",
    label: "ERP & CRM",
    description: "Custom internal operational tools & relationship systems",
    defaultPackageId: "erp-crm",
  },
  {
    id: "OTHER",
    label: "Custom Software",
    description: "Bespoke algorithms, desktop utilities & specialized systems",
    defaultPackageId: "premium-custom",
  },
];

export const PACKAGE_OPTIONS: PackageOption[] = [
  { id: "basic-static", name: "Basic Static Website", startingPrice: 999, isStartingPlus: false, category: "WEB_DEVELOPMENT" },
  { id: "standard-business", name: "Standard Business Website", startingPrice: 2999, isStartingPlus: false, category: "WEB_DEVELOPMENT" },
  { id: "professional", name: "Professional Corporate", startingPrice: 5999, isStartingPlus: false, category: "WEB_DEVELOPMENT" },
  { id: "premium-custom", name: "Premium Custom Platform", startingPrice: 12999, isStartingPlus: true, category: "WEB_DEVELOPMENT" },
  { id: "e-commerce", name: "E-commerce Solution", startingPrice: 19999, isStartingPlus: true, category: "ECOMMERCE" },
  { id: "saas", name: "SaaS Development", startingPrice: 24999, isStartingPlus: true, category: "SAAS" },
  { id: "lms", name: "LMS Platform", startingPrice: 29999, isStartingPlus: true, category: "ENTERPRISE_SYSTEMS" },
  { id: "marketplace", name: "Marketplace Platform", startingPrice: 34999, isStartingPlus: true, category: "ENTERPRISE_SYSTEMS" },
  { id: "erp-crm", name: "ERP & CRM System", startingPrice: 49999, isStartingPlus: true, category: "ENTERPRISE_SYSTEMS" },
  { id: "ai-powered", name: "AI-Powered Application", startingPrice: 59999, isStartingPlus: true, category: "AI_AUTOMATION" },
];

export const ADDON_OPTIONS: AddonOption[] = [
  {
    id: "auth-rbac",
    name: "User Authentication & RBAC",
    description: "Secure session tokens, role permissions & user profiles",
    price: 5000,
  },
  {
    id: "payment-gateway",
    name: "Payment Gateway Integration",
    description: "UPI, Razorpay, or Stripe checkout with automated webhooks",
    price: 7500,
  },
  {
    id: "api-webhooks",
    name: "Custom API & Webhook Engine",
    description: "External system endpoints, event triggers & OpenAPI docs",
    price: 10000,
  },
  {
    id: "ai-rag",
    name: "AI / Vector RAG Assistant",
    description: "Semantic knowledge retrieval & autonomous tool execution",
    price: 15000,
  },
  {
    id: "websockets",
    name: "Real-Time WebSockets Engine",
    description: "Low-latency live updates, chat streams & telemetry dashboards",
    price: 8000,
  },
  {
    id: "localization",
    name: "Multi-Language & Global CDN",
    description: "i18n localization routing & regional asset acceleration",
    price: 6000,
  },
  {
    id: "legacy-migration",
    name: "Legacy Database Migration",
    description: "Complex ETL mapping, schema transformation & zero-downtime sync",
    price: null, // Custom Quote
  },
  {
    id: "custom-webgl",
    name: "Interactive 3D / WebGL Graphics",
    description: "Bespoke Three.js shaders & GPU-accelerated motion experiences",
    price: null, // Custom Quote
  },
];

export function PricingCalculator() {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("WEB_DEVELOPMENT");
  const [selectedPackageId, setSelectedPackageId] = React.useState<string>("basic-static");
  const [selectedAddons, setSelectedAddons] = React.useState<string[]>([]);
  const [designComplexity, setDesignComplexity] = React.useState<"STANDARD" | "HIGH_MOTION">("STANDARD");
  const [timelineUrgency, setTimelineUrgency] = React.useState<"STANDARD" | "PRIORITY">("STANDARD");

  // Sync default package when category changes
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const categoryObj = CATEGORY_OPTIONS.find((c) => c.id === categoryId);
    if (categoryObj) {
      setSelectedPackageId(categoryObj.defaultPackageId);
    }
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const handleReset = () => {
    setSelectedCategory("WEB_DEVELOPMENT");
    setSelectedPackageId("basic-static");
    setSelectedAddons([]);
    setDesignComplexity("STANDARD");
    setTimelineUrgency("STANDARD");
  };

  // Pricing calculations
  const selectedPackage = PACKAGE_OPTIONS.find((p) => p.id === selectedPackageId) || PACKAGE_OPTIONS[0];

  const calculatedResult = React.useMemo(() => {
    const basePrice = selectedPackage?.startingPrice || 999;
    let addonsTotal = 0;
    let requiresCustomQuote = false;

    for (const addonId of selectedAddons) {
      const addon = ADDON_OPTIONS.find((a) => a.id === addonId);
      if (addon) {
        if (addon.price === null) {
          requiresCustomQuote = true;
        } else {
          addonsTotal += addon.price;
        }
      }
    }

    if (designComplexity === "HIGH_MOTION") {
      requiresCustomQuote = true;
    }

    let subtotal = basePrice + addonsTotal;
    if (timelineUrgency === "PRIORITY") {
      subtotal = Math.round(subtotal * 1.25);
    }

    return {
      basePrice,
      addonsTotal,
      subtotal,
      requiresCustomQuote,
      isPlus: selectedPackage?.isStartingPlus || selectedAddons.length > 0 || timelineUrgency === "PRIORITY",
    };
  }, [selectedPackage, selectedAddons, designComplexity, timelineUrgency]);

  // Construct target URL for consultation transition
  const contactUrl = React.useMemo(() => {
    const params = new URLSearchParams();
    params.set("category", selectedCategory);
    params.set("package", selectedPackageId);
    if (selectedAddons.length > 0) {
      params.set("addons", selectedAddons.join(","));
    }
    params.set("timeline", timelineUrgency === "PRIORITY" ? "URGENT_UNDER_1_MONTH" : "1_TO_3_MONTHS");
    return `/contact?${params.toString()}`;
  }, [selectedCategory, selectedPackageId, selectedAddons, timelineUrgency]);

  return (
    <div id="calculator" className="space-y-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-void-border/70 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-5 w-5 text-electric-purple" />
            <h2 className="font-mono text-2xl sm:text-3xl font-bold text-white">
              Interactive Project Estimator
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-void-muted">
            Configure your project parameters to estimate a transparent baseline starting investment in INR (₹).
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleReset}
          className="gap-2 self-start sm:self-auto shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Calculator</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: CONTROLS (8 COLS) */}
        <div className="lg:col-span-7 space-y-8">
          {/* STEP 1: PROJECT CATEGORY */}
          <div className="space-y-3">
            <label className="font-mono text-xs uppercase tracking-wider text-void-light font-semibold block">
              1. Select Project Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" role="radiogroup" aria-label="Select Project Category">
              {CATEGORY_OPTIONS.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-electric-purple bg-electric-purple/15 text-white shadow-glow-xs"
                        : "border-void-border bg-void-charcoal/40 text-void-muted hover:border-void-border/80 hover:text-white"
                    }`}
                  >
                    <span className="font-mono text-xs font-bold block">{cat.label}</span>
                    <span className="text-[10px] text-void-muted line-clamp-1 mt-0.5">{cat.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: STARTING PACKAGE TIER */}
          <div className="space-y-3">
            <label className="font-mono text-xs uppercase tracking-wider text-void-light font-semibold block">
              2. Select Starting Package Baseline
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PACKAGE_OPTIONS.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`p-3 rounded-lg border flex items-center justify-between text-left transition-all ${
                      isSelected
                        ? "border-electric-purple bg-electric-purple/15 text-white shadow-glow-xs"
                        : "border-void-border bg-void-charcoal/40 text-void-light hover:border-void-border/80"
                    }`}
                  >
                    <div>
                      <span className="font-mono text-xs font-semibold block">{pkg.name}</span>
                      <span className="text-[10px] text-void-muted">Starting Tier Baseline</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-electric-purple shrink-0 ml-2">
                      ₹{pkg.startingPrice.toLocaleString("en-IN")}{pkg.isStartingPlus ? "+" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: OPTIONAL ARCHITECTURAL ADD-ONS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs uppercase tracking-wider text-void-light font-semibold block">
                3. Architectural Features & Integrations
              </label>
              <span className="text-[10px] font-mono text-void-muted">Multi-Select</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ADDON_OPTIONS.map((addon) => {
                const isSelected = selectedAddons.includes(addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddon(addon.id)}
                    className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-electric-neon/80 bg-electric-neon/10 text-white"
                        : "border-void-border bg-void-charcoal/30 text-void-muted hover:border-void-border/80 hover:text-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-mono text-xs font-medium text-white">{addon.name}</span>
                      {isSelected ? (
                        <CheckCircle2 className="h-4 w-4 text-electric-neon shrink-0 mt-0.5" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-void-border shrink-0 mt-0.5" />
                      )}
                    </div>
                    <span className="text-[10px] text-void-muted line-clamp-1 mb-2">{addon.description}</span>
                    <span className="font-mono text-[11px] font-bold text-electric-purple">
                      {addon.price !== null ? `+₹${addon.price.toLocaleString("en-IN")}` : "Custom Quote"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 4: DESIGN COMPLEXITY & TIMELINE PREFERENCE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="font-mono text-xs uppercase tracking-wider text-void-light font-semibold block">
                4. Interface Design Complexity
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDesignComplexity("STANDARD")}
                  className={`p-2.5 rounded-lg border text-left text-xs font-mono ${
                    designComplexity === "STANDARD"
                      ? "border-electric-purple bg-electric-purple/15 text-white"
                      : "border-void-border bg-void-charcoal/30 text-void-muted"
                  }`}
                >
                  <span className="font-bold block">Standard Dark</span>
                  <span className="text-[10px] text-void-muted">Included</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDesignComplexity("HIGH_MOTION")}
                  className={`p-2.5 rounded-lg border text-left text-xs font-mono ${
                    designComplexity === "HIGH_MOTION"
                      ? "border-electric-purple bg-electric-purple/15 text-white"
                      : "border-void-border bg-void-charcoal/30 text-void-muted"
                  }`}
                >
                  <span className="font-bold block">WebGL / 3D</span>
                  <span className="text-[10px] text-electric-purple">Custom Quote</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs uppercase tracking-wider text-void-light font-semibold block">
                5. Delivery Timeline Priority
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTimelineUrgency("STANDARD")}
                  className={`p-2.5 rounded-lg border text-left text-xs font-mono ${
                    timelineUrgency === "STANDARD"
                      ? "border-electric-purple bg-electric-purple/15 text-white"
                      : "border-void-border bg-void-charcoal/30 text-void-muted"
                  }`}
                >
                  <span className="font-bold block">Standard Sprint</span>
                  <span className="text-[10px] text-void-muted">Standard schedule</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineUrgency("PRIORITY")}
                  className={`p-2.5 rounded-lg border text-left text-xs font-mono ${
                    timelineUrgency === "PRIORITY"
                      ? "border-electric-purple bg-electric-purple/15 text-white"
                      : "border-void-border bg-void-charcoal/30 text-void-muted"
                  }`}
                >
                  <span className="font-bold block">Priority Sprint</span>
                  <span className="text-[10px] text-electric-purple">+25% (Optional Estimate)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ESTIMATE SUMMARY CARD (5 COLS) */}
        <div className="lg:col-span-5 sticky top-24">
          <Card className="border-electric-purple/50 bg-void-charcoal/50 backdrop-blur-md shadow-glow-sm overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-electric-purple via-electric-violet to-electric-neon" />
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-electric-purple font-semibold block mb-1">
                  Estimated Investment Scope
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl sm:text-4xl font-black text-white">
                    ₹{calculatedResult.subtotal.toLocaleString("en-IN")}
                    {calculatedResult.isPlus ? "+" : ""}
                  </span>
                  <span className="text-xs font-mono text-void-muted">INR</span>
                </div>
                {calculatedResult.requiresCustomQuote && (
                  <Badge variant="outline" className="mt-2 border-electric-neon/40 text-electric-neon text-[10px] font-mono">
                    + Custom Scope Additions
                  </Badge>
                )}
              </div>

              {/* Selected Configuration Breakdown */}
              <div className="space-y-3 pt-4 border-t border-void-border/60 text-xs">
                <div className="flex justify-between items-center text-void-muted">
                  <span>Selected Package:</span>
                  <strong className="text-white font-mono">{selectedPackage?.name}</strong>
                </div>
                <div className="flex justify-between items-center text-void-muted">
                  <span>Base Package Investment:</span>
                  <span className="text-void-light font-mono">
                    ₹{calculatedResult.basePrice.toLocaleString("en-IN")}{selectedPackage?.isStartingPlus ? "+" : ""}
                  </span>
                </div>
                <div className="flex justify-between items-center text-void-muted">
                  <span>Selected Add-ons ({selectedAddons.length}):</span>
                  <span className="text-void-light font-mono">
                    +₹{calculatedResult.addonsTotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-void-muted">
                  <span>Delivery Priority:</span>
                  <span className="text-void-light font-mono">
                    {timelineUrgency === "PRIORITY" ? "Priority Sprint (+25%)" : "Standard Schedule"}
                  </span>
                </div>
                {designComplexity === "HIGH_MOTION" && (
                  <div className="flex justify-between items-center text-void-muted">
                    <span>Design Complexity:</span>
                    <span className="text-electric-purple font-mono">Custom 3D / WebGL</span>
                  </div>
                )}
              </div>

              {/* Non-Binding Disclaimer Notice */}
              <div className="rounded-lg bg-void-surface/60 border border-void-border/70 p-3.5 flex items-start gap-2.5 text-[11px] text-void-muted leading-relaxed">
                <AlertCircle className="h-4 w-4 text-electric-purple shrink-0 mt-0.5" />
                <span>
                  <strong>Non-binding estimation:</strong> This calculation provides a transparent baseline starting scope. Priority Sprint (+25%) is an optional acceleration estimate subject to availability and technical scope assessment; expedited delivery is not guaranteed until schedule confirmation. Final commercial terms are formally determined upon detailed technical scoping.
                </span>
              </div>

              {/* Transfer Scope Action */}
              <div className="pt-2">
                <Link href={contactUrl} className={buttonVariants({ variant: "glow", size: "lg", className: "w-full gap-2" })}>
                  <span>Continue to Enquiry Form</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <p className="text-[10px] text-center text-void-muted mt-2 font-mono">
                  Your selected parameters will be transferred automatically
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
