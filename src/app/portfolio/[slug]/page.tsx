import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Cpu,
  Layers,
  ShieldCheck,
  Terminal,
  Activity,
  FileCode,
  Sparkles,
} from "lucide-react";
import {
  getAllProjects,
  getProjectBySlug,
} from "@/server/repositories/portfolio.repo";
import { Container, Section } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CaseStudyPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Static generation parameter generator for known project slugs.
 */
export async function generateStaticParams() {
  const projects = await getAllProjects();
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

/**
 * Dynamic metadata generator for project case study pages.
 */
export async function generateMetadata({
  params,
}: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project Not Found | VOIDTECH SOLUTION",
      description: "The requested project case study could not be located.",
    };
  }

  return {
    title: `${project.title} | Case Study | VOIDTECH SOLUTION`,
    description: project.summary,
    openGraph: {
      title: `${project.title} — Engineering Case Study`,
      description: project.summary,
      type: "article",
      url: `https://voidtechsolution.com/portfolio/${project.slug}`,
    },
  };
}

export default async function ProjectCaseStudyPage({
  params,
}: CaseStudyPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const allProjects = await getAllProjects();
  const relatedProjects = allProjects
    .filter((p) => p.slug !== project.slug)
    .slice(0, 3);

  // Parse simulated metrics safely
  const metricsArray = Array.isArray(project.metrics)
    ? (project.metrics as Array<{ label: string; value: string }>)
    : [];

  return (
    <main className="min-h-screen bg-void-black text-void-light selection:bg-electric-purple/30 selection:text-white">
      {/* ------------------------------------------------------------------ */}
      {/* 1. BREADCRUMB NAVIGATION & HERO HEADER                             */}
      {/* ------------------------------------------------------------------ */}
      <Section className="relative overflow-hidden pt-28 pb-16 border-b border-void-border/50">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-[600px] rounded-full bg-electric-purple/10 blur-[130px]"
        />

        <Container className="relative z-10 max-w-5xl">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs font-mono text-void-muted mb-8"
          >
            <Link
              href="/"
              className="hover:text-electric-purple transition-colors"
            >
              Home
            </Link>
            <span>/</span>
            <Link
              href="/portfolio"
              className="hover:text-electric-purple transition-colors"
            >
              Portfolio
            </Link>
            <span>/</span>
            <span className="text-white truncate max-w-[200px] sm:max-w-none">
              {project.title}
            </span>
          </nav>

          {/* Classification & Industry Metadata */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <Badge
              variant="outline"
              className="border-electric-purple/50 bg-electric-purple/10 text-electric-purple text-xs font-mono uppercase tracking-wider"
            >
              {project.projectType || "CONCEPT"}
            </Badge>
            <span className="text-void-muted font-mono text-xs">•</span>
            <span className="font-mono text-xs uppercase tracking-wider text-void-muted">
              {project.industry.replace(/_/g, " ")}
            </span>
            <span className="text-void-muted font-mono text-xs">•</span>
            <span className="text-xs text-void-muted font-mono">
              {project.clientName}
            </span>
          </div>

          {/* Title & Headline */}
          <h1
            id="case-study-title"
            className="font-mono text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight"
          >
            {project.title}
          </h1>

          <p className="mt-5 text-base sm:text-lg text-void-light leading-relaxed max-w-3xl">
            {project.summary}
          </p>

          {/* Key Quick Metadata Banner */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-xl border border-void-border/70 bg-void-charcoal/40 backdrop-blur-sm">
            <div>
              <span className="block text-[11px] font-mono text-void-muted uppercase tracking-wider">
                Classification
              </span>
              <span className="font-mono text-sm font-bold text-white">
                {project.projectType || "Concept Lab"}
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-mono text-void-muted uppercase tracking-wider">
                Industry Domain
              </span>
              <span className="font-mono text-sm font-bold text-electric-purple">
                {project.industry.replace(/_/g, " ")}
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-mono text-void-muted uppercase tracking-wider">
                Stack Count
              </span>
              <span className="font-mono text-sm font-bold text-white">
                {project.techStack.length} Technologies
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-mono text-void-muted uppercase tracking-wider">
                Status
              </span>
              <span className="font-mono text-sm font-bold text-electric-neon">
                Verified In Lab
              </span>
            </div>
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. CHALLENGE & ARCHITECTURAL SOLUTION GRID                         */}
      {/* ------------------------------------------------------------------ */}
      <Section className="py-16 border-b border-void-border/50">
        <Container className="max-w-5xl space-y-12">
          {/* Concept Prototype Transparency Notice */}
          <div className="rounded-xl border border-electric-purple/30 bg-electric-purple/5 p-4 sm:p-5 flex items-start gap-4">
            <Sparkles className="h-5 w-5 text-electric-purple shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-void-light">
              <strong className="text-white block font-mono">
                Authentic Concept Architecture Prototype
              </strong>
              <p>
                This project was engineered internally within the VOIDTECH Concept Lab to explore architecture trade-offs, stress-test high-throughput patterns, and establish reproducible production baselines.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* The Challenge Card */}
            <Card className="border-void-border bg-void-charcoal/30">
              <CardContent className="p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2 text-void-muted font-mono text-xs uppercase tracking-wider">
                  <Terminal className="h-4 w-4 text-electric-purple" />
                  <span>The Architectural Challenge</span>
                </div>
                <h2 className="font-mono text-xl sm:text-2xl font-bold text-white">
                  Problem & Constraints
                </h2>
                <p className="text-sm text-void-light leading-relaxed">
                  {project.challenge}
                </p>
              </CardContent>
            </Card>

            {/* The Solution Card */}
            <Card className="border-electric-purple/40 bg-void-surface/40">
              <CardContent className="p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2 text-electric-purple font-mono text-xs uppercase tracking-wider font-semibold">
                  <Layers className="h-4 w-4 text-electric-purple" />
                  <span>The Engineered Solution</span>
                </div>
                <h2 className="font-mono text-xl sm:text-2xl font-bold text-white">
                  Design & Architecture
                </h2>
                <p className="text-sm text-void-light leading-relaxed">
                  {project.solution}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Architectural Blueprint Diagram (Stylized SVG / Visual Flow) */}
          <div className="rounded-xl border border-void-border bg-void-charcoal/40 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-void-border/60 pb-4">
              <div>
                <h3 className="font-mono text-lg font-bold text-white">
                  System Architecture Blueprint
                </h3>
                <p className="text-xs text-void-muted">
                  End-to-end data flow and execution topology
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-void-border self-start sm:self-auto">
                SCHEMATIC OVERVIEW
              </Badge>
            </div>

            {/* Stylized Visual Diagram */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-void-surface border border-void-border text-center space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-void-muted block">
                  Layer 1: Ingress & Validation
                </span>
                <p className="font-mono text-xs font-bold text-white">
                  Client Requests / Ingest Buffer
                </p>
                <p className="text-[11px] text-void-muted">
                  Strict schema verification, JWT/HMAC token checks & rate limiting.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-void-surface border border-electric-purple/40 text-center space-y-2 relative shadow-glow-xs">
                <span className="text-[10px] font-mono uppercase tracking-wider text-electric-purple block font-semibold">
                  Layer 2: Core Processing
                </span>
                <p className="font-mono text-xs font-bold text-white">
                  Asynchronous Worker Pipeline
                </p>
                <p className="text-[11px] text-void-muted">
                  Decoupled queue consumers, state transition engine & telemetry.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-void-surface border border-void-border text-center space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-void-muted block">
                  Layer 3: Storage & Delivery
                </span>
                <p className="font-mono text-xs font-bold text-white">
                  Persistent Storage & Read Model
                </p>
                <p className="text-[11px] text-void-muted">
                  ACID database records, cached views & real-time client sync.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. SIMULATED BENCHMARK METRICS & RESULTS                           */}
      {/* ------------------------------------------------------------------ */}
      <Section className="py-16 border-b border-void-border/50 bg-void-dark/30">
        <Container className="max-w-5xl space-y-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-electric-purple" />
              <Badge variant="outline" className="border-electric-purple/40 text-electric-purple text-[10px] font-mono">
                SIMULATED BENCHMARK
              </Badge>
            </div>
            <h2 className="font-mono text-2xl sm:text-3xl font-bold text-white">
              Evaluation & Benchmark Results
            </h2>
            <p className="text-xs sm:text-sm text-void-muted max-w-2xl">
              Performance measurements and stability metrics derived from isolated synthetic load testing harnesses.
            </p>
          </div>

          {/* Benchmark Metrics Grid */}
          {metricsArray.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {metricsArray.map((metric, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-xl border border-void-border bg-void-surface/50 hover:border-electric-purple/40 transition-all space-y-2"
                >
                  <span className="text-xs font-mono text-void-muted uppercase tracking-wider">
                    {metric.label}
                  </span>
                  <p className="font-mono text-2xl sm:text-3xl font-black text-white">
                    {metric.value}
                  </p>
                  <span className="text-[10px] font-mono text-electric-purple flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    <span>Synthetic Benchmark Verification</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Quantitative Summary */}
          <div className="rounded-xl border border-void-border bg-void-charcoal/30 p-6 space-y-3">
            <h3 className="font-mono text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-electric-purple" />
              <span>Observed Outcomes</span>
            </h3>
            <p className="text-xs sm:text-sm text-void-light leading-relaxed">
              {project.results}
            </p>
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. TECH STACK & IMPLEMENTATION DETAILS                             */}
      {/* ------------------------------------------------------------------ */}
      <Section className="py-16 border-b border-void-border/50">
        <Container className="max-w-5xl space-y-10">
          <div className="space-y-2">
            <Badge variant="outline" className="border-electric-purple/40 text-electric-purple text-[10px] font-mono">
              ENGINEERING TOOLKIT
            </Badge>
            <h2 className="font-mono text-2xl sm:text-3xl font-bold text-white">
              Technologies & Infrastructure
            </h2>
            <p className="text-xs sm:text-sm text-void-muted">
              Core technologies utilized in this architecture prototype.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {project.techStack.map((tech) => (
              <div
                key={tech}
                className="flex items-center gap-3 p-4 rounded-lg border border-void-border bg-void-surface/40 hover:border-electric-purple/50 transition-all"
              >
                <FileCode className="h-4 w-4 text-electric-purple shrink-0" />
                <span className="font-mono text-xs sm:text-sm text-white font-medium">
                  {tech}
                </span>
              </div>
            ))}
          </div>

          {/* Repository & Access Notice */}
          <div className="rounded-xl border border-void-border/80 bg-void-surface/30 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-mono text-xs font-bold text-white block">
                Source Code & Technical Scoping
              </span>
              <p className="text-xs text-void-muted">
                Sanitized codebase architecture and test harness configurations can be reviewed upon request during technical onboarding.
              </p>
            </div>
            <Link href="/contact" tabIndex={-1} className="shrink-0">
              <Button size="sm" variant="outline">
                Request Architecture Brief
              </Button>
            </Link>
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. RELATED ENGINEERING CONCEPTS                                    */}
      {/* ------------------------------------------------------------------ */}
      {relatedProjects.length > 0 && (
        <Section className="py-16 border-b border-void-border/50 bg-void-dark/20">
          <Container className="max-w-5xl space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-2xl font-bold text-white">
                Other Engineering Concepts
              </h2>
              <Link
                href="/portfolio"
                className="text-xs font-mono text-electric-purple hover:underline flex items-center gap-1"
              >
                <span>View all concepts</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProjects.map((rp) => (
                <Card
                  key={rp.id}
                  className="border-void-border bg-void-charcoal/30 hover:border-electric-purple/50 transition-all flex flex-col justify-between"
                >
                  <CardContent className="p-5 space-y-3 flex flex-col h-full justify-between">
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-electric-purple uppercase tracking-wider block">
                        {rp.industry.replace(/_/g, " ")}
                      </span>
                      <h3 className="font-mono text-base font-bold text-white leading-snug">
                        <Link
                          href={`/portfolio/${rp.slug}`}
                          className="hover:text-electric-purple transition-colors"
                        >
                          {rp.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-void-light line-clamp-2">
                        {rp.summary}
                      </p>
                    </div>

                    <Link
                      href={`/portfolio/${rp.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-mono text-electric-purple hover:text-white pt-2 transition-colors"
                    >
                      <span>Explore Case Study</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 6. CONVERSION CTA                                                  */}
      {/* ------------------------------------------------------------------ */}
      <Section className="py-20 text-center relative overflow-hidden">
        <Container className="max-w-3xl space-y-6">
          <Badge variant="outline" className="border-electric-purple/40 text-electric-purple mb-2">
            START YOUR BUILD
          </Badge>
          <h2 className="font-mono text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Facing a similar engineering challenge?
          </h2>
          <p className="text-sm sm:text-base text-void-light max-w-xl mx-auto leading-relaxed">
            Let&apos;s evaluate your architectural requirements, data volumes, and delivery targets.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/contact" tabIndex={-1}>
              <Button size="lg" variant="glow" className="gap-2">
                <span>Start Your Project</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/portfolio" tabIndex={-1}>
              <Button size="lg" variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Portfolio</span>
              </Button>
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
