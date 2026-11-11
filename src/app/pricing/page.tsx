import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Code2,
  FileCheck,
  HeartHandshake,
  Calculator,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { FaqRepo } from "@/server/repositories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/sections/faq-accordion";
import { PricingTable } from "@/components/sections/pricing-table";
import { PricingCalculator } from "@/components/sections/pricing-calculator";

export const metadata: Metadata = {
  title: "Transparent Pricing & Investment Tiers — VOIDTECH SOLUTION",
  description:
    "Explore 10 transparent INR pricing packages from static landing pages to custom SaaS, ERP systems, and AI automation. Zero hidden fees, structured 50/50 payment terms, and full IP handover.",
  openGraph: {
    title: "Transparent Pricing & Investment Tiers — VOIDTECH SOLUTION",
    description:
      "Explore 10 transparent INR pricing packages from static landing pages to custom SaaS, ERP systems, and AI automation. Zero hidden fees, structured 50/50 payment terms, and full IP handover.",
    url: `${siteConfig.url}/pricing`,
    siteName: siteConfig.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Transparent Pricing & Investment Tiers — VOIDTECH SOLUTION",
    description:
      "Explore 10 transparent INR pricing packages from static landing pages to custom SaaS, ERP systems, and AI automation. Zero hidden fees, structured 50/50 payment terms, and full IP handover.",
  },
  alternates: {
    canonical: `${siteConfig.url}/pricing`,
  },
};

export default async function PricingPage() {
  // Concurrently load FAQs from repository with fallback
  const faqs = await FaqRepo.getActiveFaqs();

  return (
    <div className="relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute inset-0 bg-void-glow-radial opacity-40"
        aria-hidden="true"
      />

      {/* ========================================================================= */}
      {/* SECTION 1: HERO                                                           */}
      {/* ========================================================================= */}
      <section
        className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-20 lg:px-8 text-center"
        aria-labelledby="pricing-hero-headline"
      >
        <div className="mx-auto max-w-4xl">
          <Badge
            variant="outline"
            className="mb-6 border-electric-purple/40 bg-electric-purple/10 text-electric-purple font-mono text-xs px-4 py-1.5 shadow-glow-xs"
          >
            TRANSPARENT INR PRICING &bull; PREDICTABLE ENGINEERING
          </Badge>

          <h1
            id="pricing-hero-headline"
            className="font-mono text-4xl font-extrabold tracking-tight text-white sm:text-6xl leading-tight"
          >
            Predictable Investment.{" "}
            <span className="bg-gradient-to-r from-electric-purple via-electric-violet to-electric-neon bg-clip-text text-transparent">
              Zero Hidden Costs.
            </span>
          </h1>

          <p className="mt-6 text-base leading-relaxed text-void-light sm:text-lg max-w-2xl mx-auto">
            Honest, transparent pricing strictly in Indian Rupees (INR). From ultra-fast static landing pages starting at ₹999 to custom enterprise systems, our clear 50/50 payment terms ensure alignment at kickoff and final handover.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a href="#packages">
              <Button size="lg" variant="glow" className="gap-2">
                <span>View Approved Tiers</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <a href="#calculator">
              <Button size="lg" variant="outline" className="gap-2 border-void-border hover:border-electric-purple/50">
                <Calculator className="h-4 w-4 text-electric-purple" />
                <span>Open Project Calculator</span>
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: APPROVED PACKAGES TABLE                                        */}
      {/* ========================================================================= */}
      <section
        id="packages"
        className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 border-t border-void-border/60"
        aria-labelledby="packages-headline"
      >
        <div className="mb-12 text-center">
          <Badge variant="outline" className="mb-4">
            STANDARD & ENTERPRISE TIERS
          </Badge>
          <h2
            id="packages-headline"
            className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            All 10 Approved Pricing Tiers
          </h2>
          <p className="mt-3 text-sm text-void-muted max-w-2xl mx-auto">
            Starting prices with the <span className="font-mono font-bold text-electric-purple">+</span> symbol denote baseline kickoff pricing where full scope is customized during technical discovery.
          </p>
        </div>

        <PricingTable />
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: INTERACTIVE PRICING CALCULATOR                                 */}
      {/* ========================================================================= */}
      <section
        id="calculator"
        className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 border-t border-void-border/60"
        aria-labelledby="calculator-headline"
      >
        <div className="mb-12 text-center">
          <Badge variant="outline" className="mb-4 border-electric-purple/40 text-electric-purple">
            CUSTOM ARCHITECTURE ESTIMATOR
          </Badge>
          <h2
            id="calculator-headline"
            className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Interactive Project Cost Calculator
          </h2>
          <p className="mt-3 text-sm text-void-muted max-w-2xl mx-auto">
            Configure your technical discipline, baseline package, architectural add-ons, and delivery priority for an instant transparent estimate.
          </p>
        </div>

        <PricingCalculator />
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: COMMERCIAL GUARANTEES & POLICIES                               */}
      {/* ========================================================================= */}
      <section
        className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 border-t border-void-border/60"
        aria-labelledby="guarantees-headline"
      >
        <div className="mb-12 text-center">
          <Badge variant="outline" className="mb-4">
            CONFIDENCE & TRUST
          </Badge>
          <h2
            id="guarantees-headline"
            className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Our Engineering & Billing Guarantees
          </h2>
          <p className="mt-3 text-sm text-void-muted max-w-2xl mx-auto">
            Contractual protections and architectural standards applied to every engagement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-void-border/80 bg-void-card-gradient p-6 backdrop-blur-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric-purple/20 border border-electric-purple/40 text-electric-purple mb-4">
              <Code2 className="h-5 w-5" />
            </div>
            <h3 className="font-mono text-sm font-bold text-white mb-2">
              Full IP & Source Handover
            </h3>
            <p className="text-xs text-void-muted leading-relaxed">
              Upon final milestone settlement, 100% of the Git repository, deployment configs, database schemas, and intellectual property belong to you. Zero vendor lock-in.
            </p>
          </div>

          <div className="rounded-2xl border border-void-border/80 bg-void-card-gradient p-6 backdrop-blur-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric-purple/20 border border-electric-purple/40 text-electric-purple mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-mono text-sm font-bold text-white mb-2">
              50/50 Payment Terms
            </h3>
            <p className="text-xs text-void-muted leading-relaxed">
              Clear two-stage structure: 50% advance payment to initiate engineering, and the remaining 50% prior to final handover and repository release.
            </p>
          </div>

          <div className="rounded-2xl border border-void-border/80 bg-void-card-gradient p-6 backdrop-blur-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric-purple/20 border border-electric-purple/40 text-electric-purple mb-4">
              <FileCheck className="h-5 w-5" />
            </div>
            <h3 className="font-mono text-sm font-bold text-white mb-2">
              Locked Scope & Change Orders
            </h3>
            <p className="text-xs text-void-muted leading-relaxed">
              Every deliverable is documented in a detailed Statement of Work with two revision rounds included. Any future scope additions are quoted independently with zero surprise charges.
            </p>
          </div>

          <div className="rounded-2xl border border-void-border/80 bg-void-card-gradient p-6 backdrop-blur-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric-purple/20 border border-electric-purple/40 text-electric-purple mb-4">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <h3 className="font-mono text-sm font-bold text-white mb-2">
              30-Day Bug-Fix Warranty
            </h3>
            <p className="text-xs text-void-muted leading-relaxed">
              Limited 30-day bug-fix warranty after final handover covering defects in functionality explicitly within agreed scope. Excludes new features, scope additions, client modifications, third-party outages, or external infrastructure issues.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: PRICING FAQS                                                   */}
      {/* ========================================================================= */}
      <section
        id="faq"
        className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 border-t border-void-border/60"
        aria-labelledby="pricing-faq-headline"
      >
        <div className="mb-12 text-center">
          <Badge variant="outline" className="mb-4">
            FREQUENT QUESTIONS
          </Badge>
          <h2
            id="pricing-faq-headline"
            className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Pricing & Commercial Inquiries
          </h2>
          <p className="mt-3 text-sm text-void-muted">
            Direct answers on payment terms, currency formats, scoping reviews, and custom architectures.
          </p>
        </div>

        <FaqAccordion faqs={faqs} />
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: CLOSING CTA                                                    */}
      {/* ========================================================================= */}
      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 border-t border-void-border/60 text-center">
        <div className="mx-auto max-w-3xl rounded-3xl border border-electric-purple/40 bg-void-card-gradient p-8 sm:p-12 shadow-glow-md">
          <Badge variant="outline" className="mb-4 border-electric-purple/40 text-electric-purple font-mono">
            GET STARTED
          </Badge>
          <h2 className="font-mono text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to Build Your Next Product?
          </h2>
          <p className="text-void-light text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-8">
            Tell us about your technical specifications and goals. We review every enquiry and respond as soon as possible with an architectural breakdown.
          </p>
          <Link href="/contact">
            <Button size="lg" variant="glow" className="gap-2 px-8">
              <span>Start Your Project Inquiry</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
