import type { Metadata } from "next";
import Link from "next/link";
import {
  Code2,
  Terminal,
  ShieldCheck,
  ArrowRight,
  Clock,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { ServicesRepo } from "@/server/repositories";
import { ServicesFilter } from "@/components/sections/services-filter";
import { QuickInquiry } from "@/components/sections/quick-inquiry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Software Development Services & Engineering Disciplines — VOIDTECH SOLUTION",
  description:
    "Explore 18 core software engineering services across Web, Mobile, AI Agents, APIs, Cloud DevOps, and FinTech. Transparent INR pricing, test-driven code, and full repository handover.",
  openGraph: {
    title: "Software Development Services & Engineering Disciplines — VOIDTECH SOLUTION",
    description:
      "Explore 18 core software engineering services across Web, Mobile, AI Agents, APIs, Cloud DevOps, and FinTech. Transparent INR pricing, test-driven code, and full repository handover.",
    url: `${siteConfig.url}/services`,
    siteName: siteConfig.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Software Development Services & Engineering Disciplines — VOIDTECH SOLUTION",
    description:
      "Explore 18 core software engineering services across Web, Mobile, AI Agents, APIs, Cloud DevOps, and FinTech. Transparent INR pricing, test-driven code, and full repository handover.",
  },
  alternates: {
    canonical: `${siteConfig.url}/services`,
  },
};

export default async function ServicesPage() {
  const services = await ServicesRepo.getAllServices();

  return (
    <div className="relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute inset-0 bg-void-glow-radial opacity-40"
        aria-hidden="true"
      />

      {/* ========================================================================= */}
      {/* SECTION 1: SERVICES HERO                                                  */}
      {/* ========================================================================= */}
      <section
        className="relative mx-auto max-w-7xl px-4 pt-16 pb-14 sm:px-6 sm:pt-24 sm:pb-20 lg:px-8 text-center"
        aria-labelledby="services-hero-headline"
      >
        <div className="mx-auto max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-electric-purple/40 bg-electric-purple/10 px-3.5 py-1 text-xs font-mono text-electric-purple mb-6 shadow-glow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-electric-neon opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-electric-purple" />
            </span>
            <span>CAPABILITY CATALOG &bull; 18 SPECIALIZED DISCIPLINES</span>
          </div>

          {/* Headline */}
          <h1
            id="services-hero-headline"
            className="font-mono text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.15]"
          >
            Engineering Scalable Software Across{" "}
            <span className="bg-gradient-to-r from-electric-purple via-electric-violet to-electric-neon bg-clip-text text-transparent">
              18 Core Tracks.
            </span>
          </h1>

          {/* Supporting Copy */}
          <p className="mt-6 text-sm sm:text-lg text-void-light leading-relaxed max-w-3xl mx-auto">
            From modern responsive web applications and cross-platform mobile apps to autonomous AI agents, high-throughput backend APIs, and enterprise cloud infrastructure. Engineered with strict TypeScript, tested architectures, and full code ownership.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact" className="w-full sm:w-auto">
              <Button size="lg" variant="glow" className="w-full sm:w-auto gap-2">
                <span>Start Project Scoping</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Review Pricing Packages
              </Button>
            </Link>
          </div>

          {/* Differentiators Grid */}
          <div className="mt-14 grid grid-cols-2 gap-3 sm:gap-6 border-t border-void-border/60 pt-8 sm:grid-cols-4">
            <div className="rounded-xl border border-void-border/50 bg-void-surface/30 p-4 text-center">
              <span className="font-mono text-xl sm:text-2xl font-bold text-white">18</span>
              <p className="mt-1 text-xs text-void-muted">Core Disciplines</p>
            </div>
            <div className="rounded-xl border border-void-border/50 bg-void-surface/30 p-4 text-center">
              <span className="font-mono text-xl sm:text-2xl font-bold text-electric-purple">100%</span>
              <p className="mt-1 text-xs text-void-muted">Repo Handover</p>
            </div>
            <div className="rounded-xl border border-void-border/50 bg-void-surface/30 p-4 text-center">
              <span className="font-mono text-xl sm:text-2xl font-bold text-electric-neon">From ₹999</span>
              <p className="mt-1 text-xs text-void-muted">Transparent INR</p>
            </div>
            <div className="rounded-xl border border-void-border/50 bg-void-surface/30 p-4 text-center">
              <span className="font-mono text-xl sm:text-2xl font-bold text-white">30-Day</span>
              <p className="mt-1 text-xs text-void-muted">Bug-Fix Warranty</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: INTERACTIVE SERVICES CATALOG                                   */}
      {/* ========================================================================= */}
      <section
        id="catalog"
        className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 border-t border-void-border/60"
        aria-labelledby="catalog-headline"
      >
        <div className="mb-10 text-center">
          <Badge variant="outline" className="mb-3">
            TECHNICAL DIRECTORY
          </Badge>
          <h2
            id="catalog-headline"
            className="font-mono text-2xl sm:text-4xl font-bold tracking-tight text-white"
          >
            Explore All Capabilities & Deliverables
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-void-muted max-w-2xl mx-auto">
            Filter by technical domain or search by keyword to explore detailed deliverables, technology stacks, and starting investment ranges.
          </p>
        </div>

        {/* Services Filter Component */}
        <ServicesFilter initialServices={services} />
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: ENGINEERING STANDARDS & COMMITMENTS                             */}
      {/* ========================================================================= */}
      <section
        className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 border-t border-void-border/60"
        aria-labelledby="standards-headline"
      >
        <div className="mb-12 text-center">
          <Badge variant="outline" className="mb-3">
            DELIVERY COMMITMENTS
          </Badge>
          <h2
            id="standards-headline"
            className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-white"
          >
            How We Deliver Technical Quality
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-void-muted max-w-2xl mx-auto">
            Every engagement adheres to non-negotiable architectural principles designed to guarantee reliability and protect your investment.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-void-border/70 bg-void-card-gradient p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-void-surface border border-electric-purple/30 text-electric-purple mb-4">
              <Code2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-mono text-base font-semibold text-white mb-2">Test-Driven Code</h3>
            <p className="text-xs text-void-muted leading-relaxed">
              Strict TypeScript types, automated Vitest and Playwright test suites, and schema validation with Zod ensure stability and regression resistance.
            </p>
          </div>

          <div className="rounded-xl border border-void-border/70 bg-void-card-gradient p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-void-surface border border-electric-purple/30 text-electric-purple mb-4">
              <Terminal className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-mono text-base font-semibold text-white mb-2">Full IP Handover</h3>
            <p className="text-xs text-void-muted leading-relaxed">
              Complete ownership of source repositories, build pipelines, Docker files, schema migrations, and technical documentation with zero lock-in.
            </p>
          </div>

          <div className="rounded-xl border border-void-border/70 bg-void-card-gradient p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-void-surface border border-electric-purple/30 text-electric-purple mb-4">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-mono text-base font-semibold text-white mb-2">Milestone 50/50 Terms</h3>
            <p className="text-xs text-void-muted leading-relaxed">
              50% mobilization deposit, 50% upon successful milestone acceptance testing. Predictable schedules with no unexpected cost overruns.
            </p>
          </div>

          <div className="rounded-xl border border-void-border/70 bg-void-card-gradient p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-void-surface border border-electric-purple/30 text-electric-purple mb-4">
              <Clock className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-mono text-base font-semibold text-white mb-2">30-Day Warranty</h3>
            <p className="text-xs text-void-muted leading-relaxed">
              Every production delivery includes 30 days of complimentary bug-fix warranty and handover assistance to ensure smooth operational launch.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: DIRECT SERVICE CLARIFICATIONS                                   */}
      {/* ========================================================================= */}
      <section
        className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 border-t border-void-border/60"
        aria-labelledby="faq-services-headline"
      >
        <div className="mb-10 text-center">
          <Badge variant="outline" className="mb-3">
            TECHNICAL FAQ
          </Badge>
          <h2
            id="faq-services-headline"
            className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-white"
          >
            Service & Delivery Questions
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-void-muted">
            Clear, transparent answers about our engagement model and technical workflows.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-void-border/70 bg-void-surface/50 p-6">
            <h3 className="font-mono text-sm font-semibold text-white mb-2">
              How do we determine the best technical architecture for our project?
            </h3>
            <p className="text-xs text-void-muted leading-relaxed">
              During the initial discovery phase, our technical leads evaluate your operational requirements, performance targets, expected concurrent traffic, and security constraints to recommend a tailored architecture — whether that is Next.js with PostgreSQL, microservices with Go/Node, or autonomous agent workflows.
            </p>
          </div>

          <div className="rounded-xl border border-void-border/70 bg-void-surface/50 p-6">
            <h3 className="font-mono text-sm font-semibold text-white mb-2">
              What does the full repository handover include?
            </h3>
            <p className="text-xs text-void-muted leading-relaxed">
              You receive full administrative access and ownership of the GitHub/GitLab repository containing clean source code, Prisma database migration scripts, environment templates, Docker container definitions, CI/CD workflow scripts, and complete README deployment guides.
            </p>
          </div>

          <div className="rounded-xl border border-void-border/70 bg-void-surface/50 p-6">
            <h3 className="font-mono text-sm font-semibold text-white mb-2">
              Can VOIDTECH integrate with our existing APIs, payment gateways, or databases?
            </h3>
            <p className="text-xs text-void-muted leading-relaxed">
              Yes. We have deep experience integrating with third-party REST/GraphQL APIs, payment processors (Razorpay, Cashfree, Stripe, UPI protocols), enterprise ERP/CRM databases, and LLM providers via secure, rate-limited gateway architectures.
            </p>
          </div>

          <div className="rounded-xl border border-void-border/70 bg-void-surface/50 p-6">
            <h3 className="font-mono text-sm font-semibold text-white mb-2">
              What revision and maintenance policies apply?
            </h3>
            <p className="text-xs text-void-muted leading-relaxed">
              All project scopes include up to 2 minor revision rounds during the review window and a 30-day post-handover bug-fix warranty. Ongoing maintenance, SLA uptime monitoring, and retainer feature enhancements can be structured under separate maintenance agreements.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: CLOSING CTA                                                     */}
      {/* ========================================================================= */}
      <section
        className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 border-t border-void-border/60"
        aria-label="Direct Project Inquiry"
      >
        <QuickInquiry />
      </section>
    </div>
  );
}
