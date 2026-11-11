"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Building,
  Mail,
  User,
  Phone,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { submitEnquiryAction } from "@/server/actions/enquiry.actions";
import { approvedPricingPackages } from "@/config/pricing";

const CATEGORIES = [
  { id: "WEB_DEVELOPMENT", label: "Web Development", desc: "Corporate sites, web apps, portals" },
  { id: "ECOMMERCE", label: "E-Commerce", desc: "Storefronts, multi-vendor marketplaces" },
  { id: "MOBILE_DEVELOPMENT", label: "Mobile Apps", desc: "Native & cross-platform iOS/Android" },
  { id: "SAAS", label: "SaaS Platform", desc: "Multi-tenant cloud applications" },
  { id: "AI_AUTOMATION", label: "AI Automation", desc: "Autonomous agents, vector RAG pipelines" },
  { id: "API_BACKEND", label: "API & Backend", desc: "High-speed microservices, databases" },
  { id: "ENTERPRISE_SYSTEMS", label: "ERP & CRM", desc: "Internal tools, workflow automation" },
  { id: "OTHER", label: "Custom Software", desc: "Bespoke engineering & custom algorithms" },
] as const;

const BUDGET_RANGES = [
  { id: "UNDER_2K", label: "Under ₹2,000", desc: "Quick landing page / prototype" },
  { id: "2K_TO_5K", label: "₹2,000 – ₹5,000", desc: "Standard business website" },
  { id: "5K_TO_15K", label: "₹5,000 – ₹15,000", desc: "Professional web platform" },
  { id: "15K_TO_50K", label: "₹15,000 – ₹50,000", desc: "Custom web app / E-commerce / SaaS" },
  { id: "50K_PLUS", label: "₹50,000+", desc: "Enterprise systems / AI automation" },
  { id: "NOT_SURE", label: "Flexible / To Be Scoped", desc: "Discuss scope during technical review" },
] as const;

const TIMELINE_OPTIONS = [
  { id: "URGENT_UNDER_1_MONTH", label: "Priority Sprint (< 1 Month)", desc: "Optional +25% estimate (subject to availability)" },
  { id: "1_TO_3_MONTHS", label: "Standard Delivery (1 – 3 Months)", desc: "Structured delivery schedule" },
  { id: "3_TO_6_MONTHS", label: "Phased Roadmap (3 – 6 Months)", desc: "Complex enterprise development" },
  { id: "FLEXIBLE", label: "Flexible Roadmap", desc: "Timeline guided by technical complexity" },
] as const;

export function ContactEnquiryForm() {
  const searchParams = useSearchParams();

  // Read URL query parameters from calculator / package clicks
  const initialCategoryParam = searchParams.get("category");
  const initialPackageParam = searchParams.get("package");
  const initialAddonsParam = searchParams.get("addons");
  const initialTimelineParam = searchParams.get("timeline");

  // Determine initial category
  const resolvedCategory = React.useMemo(() => {
    if (!initialCategoryParam) return "WEB_DEVELOPMENT";
    const found = CATEGORIES.find((c) => c.id === initialCategoryParam.toUpperCase());
    return found ? found.id : "WEB_DEVELOPMENT";
  }, [initialCategoryParam]);

  // Determine initial timeline
  const resolvedTimeline = React.useMemo(() => {
    if (initialTimelineParam === "priority") return "URGENT_UNDER_1_MONTH";
    return "1_TO_3_MONTHS";
  }, [initialTimelineParam]);

  // Step state (1: Scope, 2: Specifications, 3: Contact)
  const [currentStep, setCurrentStep] = React.useState<1 | 2 | 3>(1);

  // Form input states
  const [serviceCategory, setServiceCategory] = React.useState<string>(resolvedCategory);
  const [selectedPackage, setSelectedPackage] = React.useState<string>(initialPackageParam || "professional");
  const [budgetRange, setBudgetRange] = React.useState<string>("5K_TO_15K");
  const [timeline, setTimeline] = React.useState<string>(resolvedTimeline);
  const [message, setMessage] = React.useState<string>("");
  const [referenceUrl, setReferenceUrl] = React.useState<string>("");

  const [name, setName] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [phone, setPhone] = React.useState<string>("");
  const [companyName, setCompanyName] = React.useState<string>("");
  const [websiteUrlHoneypot, setWebsiteUrlHoneypot] = React.useState<string>("");
  const [consentGiven, setConsentGiven] = React.useState<boolean>(false);

  // Submission / validation state
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submittedEnquiryId, setSubmittedEnquiryId] = React.useState<string | null>(null);

  // Pre-fill message if calculator addons were passed
  React.useEffect(() => {
    if (initialAddonsParam && !message) {
      const addonsList = initialAddonsParam.split(",").map((a) => a.trim()).filter(Boolean);
      if (addonsList.length > 0) {
        setMessage(
          `Project scope configured via Pricing Calculator.\nIncluded architectural add-ons: ${addonsList.join(", ")}.\n\nKey requirements:\n`
        );
      }
    }
  }, [initialAddonsParam, message]);

  // Update category and package if URL params change
  React.useEffect(() => {
    if (initialCategoryParam) {
      const matched = CATEGORIES.find((c) => c.id === initialCategoryParam.toUpperCase());
      if (matched) setServiceCategory(matched.id);
    }
    if (initialPackageParam) {
      setSelectedPackage(initialPackageParam);
    }
  }, [initialCategoryParam, initialPackageParam]);

  // Step 1 Validation
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!serviceCategory) {
      newErrors.serviceCategory = "Please select a service category";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!budgetRange) {
      newErrors.budgetRange = "Please select an estimated budget range";
    }
    if (!timeline) {
      newErrors.timeline = "Please select your preferred project timeline";
    }
    if (!message || message.trim().length < 10) {
      newErrors.message = "Please provide at least 10 characters describing your project requirements";
    }
    if (referenceUrl && referenceUrl.trim() !== "") {
      try {
        const parsed = new URL(referenceUrl.trim());
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          newErrors.referenceUrl = "URL must begin with http:// or https://";
        }
      } catch {
        newErrors.referenceUrl = "Please provide a valid reference URL (e.g., https://example.com)";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!name || name.trim().length < 2) {
      newErrors.name = "Full name must be at least 2 characters long";
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please provide a valid work email address";
    }
    if (phone && phone.trim().length > 0 && phone.trim().length < 7) {
      newErrors.phone = "Phone number is too short";
    }
    if (!consentGiven) {
      newErrors.consentGiven = "You must agree to consultation communications to proceed";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    setSubmitError(null);
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setSubmitError(null);
    setErrors({});
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate current step and all previous steps
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }
    if (!validateStep3()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Map service category to enum value
      const mappedCategory = (serviceCategory === "ECOMMERCE" || serviceCategory === "SAAS")
        ? (serviceCategory === "SAAS" ? "ENTERPRISE_SYSTEMS" : "WEB_DEVELOPMENT")
        : serviceCategory;

      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        companyName: companyName.trim() || undefined,
        serviceCategory: mappedCategory,
        selectedPackage: selectedPackage || undefined,
        budgetRange: budgetRange,
        timeline: timeline,
        message: message.trim(),
        referenceUrl: referenceUrl.trim() || undefined,
        consentGiven: consentGiven,
        website_url: websiteUrlHoneypot, // Honeypot field
        additionalConfig: initialAddonsParam
          ? {
              addons: initialAddonsParam.split(",").map((s) => s.trim()),
              source: "pricing_calculator",
            }
          : undefined,
      };

      const result = await submitEnquiryAction(payload);

      if (result.success && result.enquiryId) {
        setSubmittedEnquiryId(result.enquiryId);
      } else {
        setSubmitError(
          result.error || "Unable to submit your project enquiry at this time. Your data is preserved below. Please click retry or email us directly."
        );
        if (result.errors) {
          setErrors(result.errors);
        }
      }
    } catch (err) {
      console.error("[contact-enquiry-form] Submission error:", err);
      setSubmitError(
        "A network or service interruption occurred. All entered project data is preserved. Please click 'Retry Submission' or contact us at voidtechsolutionsupport@gmail.com."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedEnquiryId(null);
    setCurrentStep(1);
    setServiceCategory("WEB_DEVELOPMENT");
    setSelectedPackage("professional");
    setBudgetRange("5K_TO_15K");
    setTimeline("1_TO_3_MONTHS");
    setMessage("");
    setReferenceUrl("");
    setName("");
    setEmail("");
    setPhone("");
    setCompanyName("");
    setWebsiteUrlHoneypot("");
    setConsentGiven(false);
    setErrors({});
    setSubmitError(null);
  };

  // SUCCESS STATE SCREEN
  if (submittedEnquiryId) {
    return (
      <Card className="border-electric-purple/60 bg-void-card-gradient shadow-glow-lg overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-electric-purple via-electric-violet to-electric-neon" />
        <CardContent className="p-8 sm:p-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-electric-purple/20 border border-electric-purple/50 text-electric-purple shadow-glow-md">
            <CheckCircle2 className="h-9 w-9 text-electric-neon" />
          </div>

          <Badge variant="outline" className="mb-4 border-electric-purple/40 text-electric-purple font-mono">
            ENQUIRY RECORDED &bull; UNDER REVIEW
          </Badge>

          <h2 className="font-mono text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Enquiry Successfully Received!
          </h2>

          <p className="text-void-light max-w-xl mx-auto text-sm sm:text-base leading-relaxed mb-6">
            Thank you for reaching out to VOIDTECH SOLUTION. Your project inquiry has been queued for technical review by our senior engineering team.
          </p>

          <div className="inline-flex items-center gap-2 rounded-xl border border-void-border/80 bg-void-surface/80 px-4 py-2 font-mono text-xs text-void-light mb-8">
            <span className="text-void-muted">Reference ID:</span>
            <span className="font-bold text-electric-neon">{submittedEnquiryId}</span>
          </div>

          {/* Structured Next Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto mb-8">
            <div className="rounded-xl border border-void-border/80 bg-void-surface/50 p-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-electric-purple/20 font-mono text-xs font-bold text-electric-purple mb-2">
                1
              </div>
              <h3 className="font-mono text-xs font-semibold text-white mb-1">Confirmation Email</h3>
              <p className="text-[11px] text-void-muted leading-relaxed">
                An automated confirmation with your reference details has been dispatched to your inbox.
              </p>
            </div>

            <div className="rounded-xl border border-void-border/80 bg-void-surface/50 p-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-electric-purple/20 font-mono text-xs font-bold text-electric-purple mb-2">
                2
              </div>
              <h3 className="font-mono text-xs font-semibold text-white mb-1">Engineering Scoping</h3>
              <p className="text-[11px] text-void-muted leading-relaxed">
                Our architects evaluate your architecture, tech stack, and deliverable timeline and will respond as soon as possible.
              </p>
            </div>

            <div className="rounded-xl border border-void-border/80 bg-void-surface/50 p-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-electric-purple/20 font-mono text-xs font-bold text-electric-purple mb-2">
                3
              </div>
              <h3 className="font-mono text-xs font-semibold text-white mb-1">Proposal & Kickoff</h3>
              <p className="text-[11px] text-void-muted leading-relaxed">
                You receive a transparent project quotation with 50/50 payment terms, deliverable breakdown, and onboarding schedule.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetForm}
              className="gap-2 border-void-border hover:border-electric-purple/50"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Submit Another Project Inquiry</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-void-border/80 bg-void-card-gradient backdrop-blur-xl shadow-glow-sm overflow-hidden">
      {/* Top Accent Gradient Line */}
      <div className="h-1 w-full bg-gradient-to-r from-electric-purple via-electric-violet to-electric-neon" />

      {/* Progressive Step Navigation Header */}
      <div className="border-b border-void-border/60 bg-void-surface/40 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-electric-purple/40 text-electric-purple font-mono text-[11px]">
              STEP {currentStep} OF 3
            </Badge>
            <span className="font-mono text-xs font-semibold text-void-light">
              {currentStep === 1 && "Project Scope & Category"}
              {currentStep === 2 && "Technical Specifications & Timeline"}
              {currentStep === 3 && "Contact & Organization Details"}
            </span>
          </div>
          <span className="text-xs font-mono text-void-muted">
            {currentStep === 1 && "33% Complete"}
            {currentStep === 2 && "66% Complete"}
            {currentStep === 3 && "99% Complete"}
          </span>
        </div>

        {/* Step Progress Indicator Bar */}
        <div className="grid grid-cols-3 gap-2">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentStep >= 1 ? "bg-electric-purple shadow-glow-xs" : "bg-void-border/40"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentStep >= 2 ? "bg-electric-purple shadow-glow-xs" : "bg-void-border/40"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentStep >= 3 ? "bg-electric-purple shadow-glow-xs" : "bg-void-border/40"
            }`}
          />
        </div>
      </div>

      <CardContent className="p-6 sm:p-8">
        {/* Error Alert Banner (Preserves Data) */}
        {submitError && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-xs text-red-200 backdrop-blur-md flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold font-mono text-red-300 mb-1">Submission Interrupted</h3>
              <p className="leading-relaxed">{submitError}</p>
              <div className="mt-3 flex items-center gap-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="border-red-500/40 hover:bg-red-900/30 text-white text-xs h-8"
                >
                  {isSubmitting ? "Retrying..." : "Retry Submission"}
                </Button>
                <a
                  href={`mailto:voidtechsolutionsupport@gmail.com?subject=Project Inquiry - ${encodeURIComponent(name || "Client")}&body=${encodeURIComponent(
                    `Service: ${serviceCategory}\nPackage: ${selectedPackage}\nBrief: ${message}`
                  )}`}
                  className="text-xs text-red-300 underline hover:text-white"
                >
                  Email directly to voidtechsolutionsupport@gmail.com
                </a>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Honeypot Anti-Spam Field (Must remain empty; hidden from legitimate users) */}
          <div style={{ display: "none" }} aria-hidden="true">
            <label htmlFor="website_url">Leave this field blank</label>
            <input
              type="text"
              id="website_url"
              name="website_url"
              value={websiteUrlHoneypot}
              onChange={(e) => setWebsiteUrlHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* ===================================================================== */}
          {/* STEP 1: SERVICE CATEGORY & BASELINE PACKAGE                           */}
          {/* ===================================================================== */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block font-mono text-sm font-semibold text-white mb-1">
                  1. Select Primary Service Discipline <span className="text-electric-neon">*</span>
                </label>
                <p className="text-xs text-void-muted mb-4">
                  Select the core engineering domain that best describes your project scope.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {CATEGORIES.map((cat) => {
                    const isSelected = serviceCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setServiceCategory(cat.id);
                          if (errors.serviceCategory) setErrors({ ...errors, serviceCategory: "" });
                        }}
                        className={`text-left p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? "border-electric-purple bg-electric-purple/15 shadow-glow-xs"
                            : "border-void-border/70 bg-void-surface/40 hover:border-electric-purple/40 hover:bg-void-surface/70"
                        }`}
                      >
                        <div className="font-mono text-xs font-semibold text-white mb-1 flex items-center justify-between">
                          <span>{cat.label}</span>
                          {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-electric-neon" />}
                        </div>
                        <p className="text-[11px] text-void-muted leading-tight">{cat.desc}</p>
                      </button>
                    );
                  })}
                </div>
                {errors.serviceCategory && (
                  <p className="mt-2 text-xs text-red-400 font-mono">{errors.serviceCategory}</p>
                )}
              </div>

              <div>
                <label htmlFor="selectedPackage" className="block font-mono text-sm font-semibold text-white mb-1">
                  2. Baseline Pricing Package (Optional Alignment)
                </label>
                <p className="text-xs text-void-muted mb-2">
                  Select an approved package as a reference tier, or choose custom quotation.
                </p>

                <select
                  id="selectedPackage"
                  value={selectedPackage}
                  onChange={(e) => setSelectedPackage(e.target.value)}
                  className="w-full rounded-xl border border-void-border/80 bg-void-surface/80 px-4 py-3 text-sm text-void-light focus:border-electric-purple focus:outline-none focus:ring-1 focus:ring-electric-purple font-mono"
                >
                  <option value="">Custom Scope / Unsure (Architectural Consultation)</option>
                  {approvedPricingPackages.map((pkg) => (
                    <option key={pkg.slug} value={pkg.slug}>
                      {pkg.name} — ₹{pkg.priceInr.toLocaleString("en-IN")}{pkg.isStartingPrice ? "+" : ""} ({pkg.billingPeriod || "project"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="button"
                  variant="glow"
                  onClick={handleNext}
                  className="gap-2 px-6"
                >
                  <span>Continue: Technical Specs</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* STEP 2: TECHNICAL SPECIFICATIONS & TIMELINE                           */}
          {/* ===================================================================== */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block font-mono text-sm font-semibold text-white mb-1">
                  1. Estimated Investment Range <span className="text-electric-neon">*</span>
                </label>
                <p className="text-xs text-void-muted mb-3">
                  All investments are quoted in Indian Rupees (INR) with 50% advance and 50% before final handover.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {BUDGET_RANGES.map((b) => {
                    const isSelected = budgetRange === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setBudgetRange(b.id);
                          if (errors.budgetRange) setErrors({ ...errors, budgetRange: "" });
                        }}
                        className={`text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? "border-electric-purple bg-electric-purple/15 shadow-glow-xs"
                            : "border-void-border/70 bg-void-surface/40 hover:border-electric-purple/40"
                        }`}
                      >
                        <div className="font-mono text-xs font-semibold text-white mb-0.5 flex items-center justify-between">
                          <span>{b.label}</span>
                          {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-electric-neon" />}
                        </div>
                        <p className="text-[10px] text-void-muted">{b.desc}</p>
                      </button>
                    );
                  })}
                </div>
                {errors.budgetRange && (
                  <p className="mt-2 text-xs text-red-400 font-mono">{errors.budgetRange}</p>
                )}
              </div>

              <div>
                <label className="block font-mono text-sm font-semibold text-white mb-1">
                  2. Delivery Urgency & Timeline <span className="text-electric-neon">*</span>
                </label>
                <p className="text-xs text-void-muted mb-3">
                  Target project timeframe from kickoff to final handover.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TIMELINE_OPTIONS.map((t) => {
                    const isSelected = timeline === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTimeline(t.id);
                          if (errors.timeline) setErrors({ ...errors, timeline: "" });
                        }}
                        className={`text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? "border-electric-purple bg-electric-purple/15 shadow-glow-xs"
                            : "border-void-border/70 bg-void-surface/40 hover:border-electric-purple/40"
                        }`}
                      >
                        <div className="font-mono text-xs font-semibold text-white mb-0.5 flex items-center justify-between">
                          <span>{t.label}</span>
                          {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-electric-neon" />}
                        </div>
                        <p className="text-[10px] text-void-muted">{t.desc}</p>
                      </button>
                    );
                  })}
                </div>
                {errors.timeline && (
                  <p className="mt-2 text-xs text-red-400 font-mono">{errors.timeline}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="projectBrief" className="block font-mono text-sm font-semibold text-white">
                    3. Project Brief & Functional Requirements <span className="text-electric-neon">*</span>
                  </label>
                  <span className={`text-[11px] font-mono ${message.length > 2800 ? "text-amber-400" : "text-void-muted"}`}>
                    {message.length} / 3000 chars
                  </span>
                </div>
                <p className="text-xs text-void-muted mb-2">
                  Describe key functionality, intended user flows, target platforms, or required integrations.
                </p>
                <textarea
                  id="projectBrief"
                  rows={5}
                  value={message}
                  maxLength={3000}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (errors.message) setErrors({ ...errors, message: "" });
                  }}
                  placeholder="E.g., We need a Next.js multi-tenant SaaS with Stripe billing, PostgreSQL database, role-based access control, and an internal admin dashboard..."
                  className="w-full rounded-xl border border-void-border/80 bg-void-surface/80 p-3.5 text-sm text-void-light placeholder:text-void-muted/60 focus:border-electric-purple focus:outline-none focus:ring-1 focus:ring-electric-purple"
                />
                {errors.message && (
                  <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="referenceUrl" className="block font-mono text-sm font-semibold text-white mb-1">
                  4. Reference Website or Architecture Document (Optional)
                </label>
                <p className="text-xs text-void-muted mb-2">
                  Existing website, Figma design link, GitHub repo, or competitor benchmark.
                </p>
                <div className="relative">
                  <LinkIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-void-muted" />
                  <input
                    type="url"
                    id="referenceUrl"
                    value={referenceUrl}
                    onChange={(e) => {
                      setReferenceUrl(e.target.value);
                      if (errors.referenceUrl) setErrors({ ...errors, referenceUrl: "" });
                    }}
                    placeholder="https://example.com/spec-or-design"
                    className="w-full rounded-xl border border-void-border/80 bg-void-surface/80 pl-10 pr-4 py-3 text-sm text-void-light placeholder:text-void-muted/60 focus:border-electric-purple focus:outline-none focus:ring-1 focus:ring-electric-purple"
                  />
                </div>
                {errors.referenceUrl && (
                  <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.referenceUrl}</p>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="gap-2 border-void-border hover:border-electric-purple/40"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back: Scope</span>
                </Button>

                <Button
                  type="button"
                  variant="glow"
                  onClick={handleNext}
                  className="gap-2 px-6"
                >
                  <span>Continue: Contact Info</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* STEP 3: CONTACT & ORGANIZATION DETAILS                                */}
          {/* ===================================================================== */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block font-mono text-xs font-semibold text-white mb-1">
                    Full Name <span className="text-electric-neon">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-void-muted" />
                    <input
                      type="text"
                      id="fullName"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors({ ...errors, name: "" });
                      }}
                      placeholder="Alex Mercer"
                      className="w-full rounded-xl border border-void-border/80 bg-void-surface/80 pl-10 pr-4 py-3 text-sm text-void-light focus:border-electric-purple focus:outline-none focus:ring-1 focus:ring-electric-purple"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="workEmail" className="block font-mono text-xs font-semibold text-white mb-1">
                    Work Email <span className="text-electric-neon">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-void-muted" />
                    <input
                      type="email"
                      id="workEmail"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: "" });
                      }}
                      placeholder="alex@company.com"
                      className="w-full rounded-xl border border-void-border/80 bg-void-surface/80 pl-10 pr-4 py-3 text-sm text-void-light focus:border-electric-purple focus:outline-none focus:ring-1 focus:ring-electric-purple"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block font-mono text-xs font-semibold text-white mb-1">
                    Phone / WhatsApp Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-void-muted" />
                    <input
                      type="tel"
                      id="phoneNumber"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) setErrors({ ...errors, phone: "" });
                      }}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-void-border/80 bg-void-surface/80 pl-10 pr-4 py-3 text-sm text-void-light focus:border-electric-purple focus:outline-none focus:ring-1 focus:ring-electric-purple"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="companyName" className="block font-mono text-xs font-semibold text-white mb-1">
                    Company / Organization (Optional)
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-3.5 h-4 w-4 text-void-muted" />
                    <input
                      type="text"
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Acme Innovations Ltd."
                      className="w-full rounded-xl border border-void-border/80 bg-void-surface/80 pl-10 pr-4 py-3 text-sm text-void-light focus:border-electric-purple focus:outline-none focus:ring-1 focus:ring-electric-purple"
                    />
                  </div>
                </div>
              </div>

              {/* Consultation Policy & Consent */}
              <div className="rounded-xl border border-void-border/80 bg-void-surface/50 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => {
                      setConsentGiven(e.target.checked);
                      if (errors.consentGiven) setErrors({ ...errors, consentGiven: "" });
                    }}
                    className="mt-1 h-4 w-4 rounded border-void-border bg-void-surface text-electric-purple focus:ring-electric-purple focus:ring-offset-void-black"
                  />
                  <div className="text-xs text-void-light leading-relaxed">
                    <span className="font-semibold text-white">Client Consultation & Privacy Agreement:</span>{" "}
                    I consent to VOIDTECH SOLUTION storing this project brief and contacting me regarding technical scoping, architecture proposals, and delivery timelines. We respect your privacy and never sell or share client data.
                  </div>
                </label>
                {errors.consentGiven && (
                  <p className="mt-2 text-xs text-red-400 font-mono">{errors.consentGiven}</p>
                )}
              </div>

              {/* Summary Review Card */}
              <div className="rounded-xl border border-electric-purple/30 bg-electric-purple/5 p-4 text-xs font-mono">
                <div className="flex items-center gap-2 text-electric-neon mb-2 font-bold">
                  <Sparkles className="h-4 w-4" />
                  <span>Submission Summary</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-void-muted">
                  <div>
                    <span className="text-white block">Category:</span>
                    <span>{CATEGORIES.find((c) => c.id === serviceCategory)?.label || serviceCategory}</span>
                  </div>
                  <div>
                    <span className="text-white block">Package:</span>
                    <span>{selectedPackage || "Custom Scope"}</span>
                  </div>
                  <div>
                    <span className="text-white block">Budget:</span>
                    <span>{BUDGET_RANGES.find((b) => b.id === budgetRange)?.label || budgetRange}</span>
                  </div>
                  <div>
                    <span className="text-white block">Timeline:</span>
                    <span>{TIMELINE_OPTIONS.find((t) => t.id === timeline)?.label || timeline}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="gap-2 border-void-border hover:border-electric-purple/40"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back: Specs</span>
                </Button>

                <Button
                  type="submit"
                  variant="glow"
                  disabled={isSubmitting}
                  className="gap-2 px-8 shadow-glow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Transmitting Brief...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Project Enquiry</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
