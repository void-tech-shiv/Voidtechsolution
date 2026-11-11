import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Code2,
  ShieldCheck,
  Zap,
  Terminal,
  ExternalLink,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { ServicesRepo, PortfolioRepo, PricingRepo, FaqRepo } from "@/server/repositories";
import { ServicesFilter } from "@/components/sections/services-filter";
import { FaqAccordion } from "@/components/sections/faq-accordion";
import { QuickInquiry } from "@/components/sections/quick-inquiry";
import { Button } from "@/components/ui/button";
import { GlassCard, PricingCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "VOIDTECH SOLUTION — Build. Launch. Grow Online.",
  description:
    "We design, develop, and deliver modern digital solutions — from websites and applications to custom software, APIs, and AI-powered automation.",
  openGraph: {
    title: "VOIDTECH SOLUTION — Build. Launch. Grow Online.",
    description:
      "We design, develop, and deliver modern digital solutions — from websites and applications to custom software, APIs, and AI-powered automation.",
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VOIDTECH SOLUTION — Build. Launch. Grow Online.",
    description:
      "We design, develop, and deliver modern digital solutions — from websites and applications to custom software, APIs, and AI-powered automation.",
  },
  alternates: {
    canonical: siteConfig.url,
  },
};

export default async function HomePage() {
  // Concurrently load data via repositories with safe fallbacks
  const [services, projects, pricingPackages, faqs] = await Promise.all([
    ServicesRepo.getAllServices(),
    PortfolioRepo.getFeaturedProjects(),
    PricingRepo.getActivePricingPackages(),
    FaqRepo.getActiveFaqs(),
  ]);

  return (
    <div className="relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute inset-0 bg-void-glow-radial opacity-50"
        aria-hidden="true"
      />

      {/* ========================================================================= */}
      {/* SECTION 1: HERO                                                           */}
      {/* ========================================================================= */}
      <section
        id="hero"
        className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-24 lg:px-8"
        aria-labelledby="hero-headline"
      >
        <div className="mx-auto max-w-4xl text-center">
          {/* Tagline / Positioning Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-electric-purple/40 bg-electric-purple/10 px-4 py-1.5 text-xs font-mono text-electric-purple mb-8 shadow-glow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-electric-neon opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-electric-purple" />
            </span>
            <span>VOIDTECH SOLUTION &bull; {siteConfig.tagline}</span>
          </div>

          {/* Approved Hero Headline */}
          <h1
            id="hero-headline"
            className="font-mono text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-tight sm:leading-none"
          >
            Turning Ideas Into{" "}
            <span className="bg-gradient-to-r from-electric-purple via-electric-violet to-electric-neon bg-clip-text text-transparent">
              Powerful Digital Products.
            </span>
          </h1>

          {/* Approved Supporting Copy */}
          <p className="mt-6 text-base leading-relaxed text-void-light sm:text-lg lg:text-xl max-w-2xl mx-auto">
            We design, develop, and deliver modern digital solutions — from websites and applications to custom software, APIs, and AI-powered automation.
          </p>

          {/* Primary & Secondary Action CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/#contact" tabIndex={-1}>
              <Button size="lg" variant="glow" className="gap-2">
                <span>Start Your Project</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/#services" tabIndex={-1}>
              <Button size="lg" variant="outline">
                Explore Our Services
              </Button>
            </Link>
          </div>

          {/* Authentic Technical Highlights (Zero Fake Numbers) */}
          <div className="mt-16 grid grid-cols-2 gap-4 border-t border-void-border/60 pt-8 sm:grid-cols-4">
            <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-void-border/40 bg-void-surface/30">
              <span className="font-mono text-lg font-bold text-white">18 Tracks</span>
              <span className="text-[11px] text-void-muted">Web, Mobile, AI & APIs</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-void-border/40 bg-void-surface/30">
              <span className="font-mono text-lg font-bold text-electric-purple">Custom Build</span>
              <span className="text-[11px] text-void-muted">Tailored Architecture</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-void-border/40 bg-void-surface/30">
              <span className="font-mono text-lg font-bold text-white">Code Delivery</span>
              <span className="text-[11px] text-void-muted">Full Repository Handover</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-void-border/40 bg-void-surface/30">
              <span className="font-mono text-lg font-bold text-electric-neon">From ₹999</span>
              <span className="text-[11px] text-void-muted">Transparent INR Pricing</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: BRAND INTRODUCTION                                             */}
      {/* ========================================================================= */}
      <section
        id="about"
        className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 border-t border-void-border/60"
        aria-labelledby="brand-intro-headline"
      >
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-4">
            ENGINEERING PHILOSOPHY
          </Badge>
          <h2
            id="brand-intro-headline"
            className="font-mono text-2xl font-bold tracking-tight text-white sm:text-3xl"
          >
            Engineering Built for Real-World Impact
          </h2>
          <blockquote className="mt-6 rounded-xl border border-void-border/80 bg-void-surface/50 p-6 sm:p-8 backdrop-blur-md shadow-glass-inner">
            <p className="text-base sm:text-lg font-normal leading-relaxed text-void-light italic">
              &ldquo;Technology should move your business forward. We help transform ideas into practical digital products through thoughtful design, reliable engineering, and modern technology.&rdquo;
            </p>
            <footer className="mt-4 text-xs font-mono font-medium text-electric-purple">
              — VOIDTECH SOLUTION Principles
            </footer>
          </blockquote>
        </div>

        {/* 3 Core Commitments */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-void-border/70 bg-void-card-gradient p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-void-surface border border-electric-purple/30 text-electric-purple mb-4">
              <Zap className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-mono text-base font-semibold text-white mb-2">Purpose-Driven Design</h3>
            <p className="text-xs text-void-muted leading-relaxed">
              We design software architecture directly around your operational workflows and business objectives, not generic pre-packaged assumptions.
            </p>
          </div>

          <div className="rounded-xl border border-void-border/70 bg-void-card-gradient p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-void-surface border border-electric-purple/30 text-electric-purple mb-4">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-mono text-base font-semibold text-white mb-2">Direct Code Handover</h3>
            <p className="text-xs text-void-muted leading-relaxed">
              Clean, standards-compliant source code, documentation, and deployment assets delivered directly to your organization with full code ownership.
            </p>
          </div>

          <div className="rounded-xl border border-void-border/70 bg-void-card-gradient p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-void-surface border border-electric-purple/30 text-electric-purple mb-4">
              <Code2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-mono text-base font-semibold text-white mb-2">High-Assurance Code</h3>
            <p className="text-xs text-void-muted leading-relaxed">
              Strict TypeScript types, isolated database layers, unit tests, and automated quality gates ensure your software is stable, maintainable, and secure.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: SERVICES SHOWCASE                                              */}
      {/* ========================================================================= */}
      <section
        id="services"
        className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 border-t border-void-border/60"
        aria-labelledby="services-headline"
      >
        <div className="mb-10 text-center">
          <Badge variant="outline" className="mb-4">
            CAPABILITY CATALOG
          </Badge>
          <h2
            id="services-headline"
            className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Full-Spectrum Digital Services
          </h2>
          <p className="mt-3 text-sm text-void-muted max-w-2xl mx-auto">
            From modern responsive websites and cross-platform mobile apps to autonomous AI agents and enterprise SaaS backends.
          </p>
        </div>

        {/* Interactive Services Filter & Grid */}
        <ServicesFilter initialServices={services} />
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: WHY CHOOSE VOIDTECH                                            */}
      {/* ========================================================================= */}
      <section
        id="why-us"
        className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 border-t border-void-border/60"
        aria-labelledby="why-us-headline"
      >
        <div className="mb-12 text-center">
          <Badge variant="outline" className="mb-4">
            PRACTICAL DIFFERENTIATORS
          </Badge>
          <h2
            id="why-us-headline"
            className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Why Partner With VoidTech
          </h2>
          <p className="mt-3 text-sm text-void-muted max-w-2xl mx-auto">
            Pragmatic engineering focused on maintainability, performance, and measurable delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-void-border/80 bg-void-surface/40 p-6 transition-all hover:border-electric-purple/40">
            <span className="font-mono text-xs font-bold text-electric-purple">01</span>
            <h3 className="mt-2 text-base font-semibold text-white">Built Around Your Requirements</h3>
            <p className="mt-2 text-xs text-void-muted leading-relaxed">
              Every system is engineered directly for your operational workflow. We do not force your business into rigid off-the-shelf templates.
            </p>
          </div>

          <div className="rounded-xl border border-void-border/80 bg-void-surface/40 p-6 transition-all hover:border-electric-purple/40">
            <span className="font-mono text-xs font-bold text-electric-purple">02</span>
            <h3 className="mt-2 text-base font-semibold text-white">Modern Technology Stack</h3>
            <p className="mt-2 text-xs text-void-muted leading-relaxed">
              Engineered with Next.js 15, React 19, strict TypeScript, PostgreSQL, and cloud-native microservices for longevity and performance.
            </p>
          </div>

          <div className="rounded-xl border border-void-border/80 bg-void-surface/40 p-6 transition-all hover:border-electric-purple/40">
            <span className="font-mono text-xs font-bold text-electric-purple">03</span>
            <h3 className="mt-2 text-base font-semibold text-white">Responsive & Accessible</h3>
            <p className="mt-2 text-xs text-void-muted leading-relaxed">
              Mobile-first responsive layouts with clean semantic markup, fast loading, and accessible UI patterns across all viewports.
            </p>
          </div>

          <div className="rounded-xl border border-void-border/80 bg-void-surface/40 p-6 transition-all hover:border-electric-purple/40">
            <span className="font-mono text-xs font-bold text-electric-purple">04</span>
            <h3 className="mt-2 text-base font-semibold text-white">Thoughtful Development Process</h3>
            <p className="mt-2 text-xs text-void-muted leading-relaxed">
              Agile development broken into atomic milestone phases with verifiable test gates, working prototypes, and clear acceptance criteria.
            </p>
          </div>

          <div className="rounded-xl border border-void-border/80 bg-void-surface/40 p-6 transition-all hover:border-electric-purple/40">
            <span className="font-mono text-xs font-bold text-electric-purple">05</span>
            <h3 className="mt-2 text-base font-semibold text-white">Direct & Clear Communication</h3>
            <p className="mt-2 text-xs text-void-muted leading-relaxed">
              Direct access to technical leads who write your code. Transparent progress tracking, documented specifications, and zero sales jargon.
            </p>
          </div>

          <div className="rounded-xl border border-void-border/80 bg-void-surface/40 p-6 transition-all hover:border-electric-purple/40">
            <span className="font-mono text-xs font-bold text-electric-purple">06</span>
            <h3 className="mt-2 text-base font-semibold text-white">Maintainable Software Architecture</h3>
            <p className="mt-2 text-xs text-void-muted leading-relaxed">
              Clean separation of concerns, robust database schemas, automated testing, and comprehensive technical documentation for your team.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: DEVELOPMENT PROCESS                                            */}
      {/* ========================================================================= */}
      <section
        id="process"
        className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 border-t border-void-border/60"
        aria-labelledby="process-headline"
      >
        <div className="mb-12 text-center">
          <Badge variant="outline" className="mb-4">
            DELIVERY LIFECYCLE
          </Badge>
          <h2
            id="process-headline"
            className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            The 7-Stage Development Journey
          </h2>
          <p className="mt-3 text-sm text-void-muted max-w-2xl mx-auto">
            A structured, repeatable methodology from initial discovery to long-term operational support.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line on desktop */}
          <div
            className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-electric-purple/20 via-electric-violet/40 to-electric-purple/20 -translate-y-1/2"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-7 relative">
            {[
              { step: "01", name: "Discovery", desc: "Requirements scoping, technical constraints, and roadmap definition." },
              { step: "02", name: "Planning", desc: "Architecture blueprints, database schema modeling, and API contracts." },
              { step: "03", name: "UI/UX Design", desc: "Design systems, interactive wireframes, and accessibility validation." },
              { step: "04", name: "Development", desc: "Clean modular code, frontend interfaces, and resilient backend services." },
              { step: "05", name: "Testing", desc: "Unit testing, integration suites, security audits, and performance tuning." },
              { step: "06", name: "Deployment", desc: "Automated CI/CD pipelines, containerization, SSL, and DNS configuration." },
              { step: "07", name: "Support", desc: "Post-launch maintenance, security updates, SLA support, and scaling." },
            ].map((stage) => (
              <div
                key={stage.step}
                className="relative flex flex-col rounded-xl border border-void-border/80 bg-void-card-gradient p-5 backdrop-blur-md transition-all hover:border-electric-purple/50 group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-void-surface border border-electric-purple/30 text-electric-purple font-mono font-bold text-xs mb-3 group-hover:bg-electric-purple group-hover:text-white transition-colors">
                  {stage.step}
                </div>
                <h3 className="font-mono text-sm font-semibold text-white">{stage.name}</h3>
                <p className="mt-1.5 text-[11px] leading-relaxed text-void-muted">{stage.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: FEATURED PROJECTS (CONCEPT LAB PROTOTYPES)                     */}
      {/* ========================================================================= */}
      <section
        id="portfolio"
        className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 border-t border-void-border/60"
        aria-labelledby="portfolio-headline"
      >
        <div className="mb-12 text-center">
          <Badge variant="outline" className="mb-4">
            ARCHITECTURE SHOWCASE
          </Badge>
          <h2
            id="portfolio-headline"
            className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Internal Engineering Prototypes
          </h2>
          <p className="mt-3 text-sm text-void-muted max-w-2xl mx-auto">
            Reference architectures and simulated benchmark prototypes engineered in the VoidTech Concept Lab.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-xl border border-void-border/60 bg-void-surface/30 p-12 text-center">
            <p className="text-sm text-void-muted">
              Portfolio projects are currently being synchronized. Reference architectures available upon request.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {projects.map((proj) => (
              <GlassCard
                key={proj.id || proj.slug}
                className="group flex flex-col justify-between border-void-border/90 hover:border-electric-purple/50 transition-all p-7"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-electric-purple/40 bg-electric-purple/10 px-3 py-1 font-mono text-[10px] font-bold text-electric-purple tracking-wider uppercase">
                      <Terminal className="h-3 w-3" aria-hidden="true" />
                      <span>{proj.projectType || "CONCEPT"}</span>
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-void-muted">
                      {proj.industry}
                    </span>
                  </div>

                  <h3 className="font-mono text-xl font-bold text-white group-hover:text-electric-purple transition-colors mb-2">
                    {proj.title}
                  </h3>

                  <p className="text-xs text-void-muted leading-relaxed mb-6">
                    {proj.summary}
                  </p>

                  {/* Benchmark Metrics (Explicitly identified as simulated/benchmark) */}
                  {proj.metrics && Array.isArray(proj.metrics) && (
                    <div className="mb-6 grid grid-cols-2 gap-3 border-y border-void-border/50 py-4">
                      {(proj.metrics as Array<{ label: string; value: string }>).map((m, idx) => (
                        <div key={idx} className="flex flex-col">
                          <span className="font-mono text-base font-bold text-electric-neon">
                            {m.value}
                          </span>
                          <span className="text-[10px] text-void-muted">{m.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  {/* Tech Stack Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {proj.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md border border-void-border bg-void-surface/60 px-2.5 py-0.5 text-[10px] font-mono text-void-light"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <Link
                    href="/#contact"
                    className="inline-flex w-full items-center justify-between rounded-lg border border-void-border/70 bg-void-surface/50 px-4 py-2.5 text-xs font-medium text-void-light transition-all hover:border-electric-purple hover:bg-electric-purple/10 hover:text-white"
                  >
                    <span>Request Architecture Brief</span>
                    <ExternalLink className="h-3.5 w-3.5 text-electric-purple" aria-hidden="true" />
                  </Link>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7: PRICING PREVIEW                                                */}
      {/* ========================================================================= */}
      <section
        id="pricing"
        className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 border-t border-void-border/60"
        aria-labelledby="pricing-headline"
      >
        <div className="mb-12 text-center">
          <Badge variant="outline" className="mb-4">
            TRANSPARENT INR PRICING
          </Badge>
          <h2
            id="pricing-headline"
            className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Predictable Investment Tiers
          </h2>
          <p className="mt-3 text-sm text-void-muted max-w-2xl mx-auto">
            Honest, transparent pricing strictly in Indian Rupees (INR). Starting prices clearly noted with zero hidden fees.
          </p>
        </div>

        {/* 10 Approved Pricing Tiers Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pricingPackages.map((pkg) => {
            const formattedPrice = `₹${pkg.priceInr.toLocaleString("en-IN")}${pkg.priceInr >= 10000 ? "+" : ""}`;
            return (
              <PricingCard
                key={pkg.id || pkg.slug}
                tierName={pkg.name}
                tagline={pkg.isStartingPrice ? "Kickoff Tier & Custom Scope" : "Production Turnkey Deliverable"}
                price={formattedPrice}
                billingPeriod={pkg.billingPeriod || "project"}
                isPopular={pkg.popular}
                features={pkg.features}
                ctaText="Select Package"
                href="/#contact"
                className="h-full"
              />
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8: FAQ PREVIEW                                                    */}
      {/* ========================================================================= */}
      <section
        id="faq"
        className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 border-t border-void-border/60"
        aria-labelledby="faq-headline"
      >
        <div className="mb-12 text-center">
          <Badge variant="outline" className="mb-4">
            CLARIFICATIONS & POLICIES
          </Badge>
          <h2
            id="faq-headline"
            className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-sm text-void-muted">
            Direct answers regarding our engineering standards, payment integrations, and SLAs.
          </p>
        </div>

        <FaqAccordion faqs={faqs} />
      </section>

      {/* ========================================================================= */}
      {/* SECTION 9: FINAL CLOSING CTA BANNER                                       */}
      {/* ========================================================================= */}
      <section
        id="contact"
        className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 border-t border-void-border/60"
        aria-label="Direct Project Inquiry"
      >
        <QuickInquiry />
      </section>
    </div>
  );
}
