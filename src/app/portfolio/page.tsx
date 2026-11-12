import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAllProjects } from "@/server/repositories/portfolio.repo";
import { Container, Section } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PortfolioFilter } from "@/components/sections/portfolio-filter";

export const metadata: Metadata = {
  title: "Portfolio & Engineering Concepts | VOIDTECH SOLUTION",
  description:
    "Explore software concepts, architecture experiments, and digital solutions developed around practical engineering challenges by VOIDTECH SOLUTION.",
  openGraph: {
    title: "Portfolio & Engineering Concepts | VOIDTECH SOLUTION",
    description:
      "Selected work, architecture prototypes, and engineering experiments developed by VOIDTECH SOLUTION.",
    type: "website",
    url: "https://voidtechsolution.com/portfolio",
  },
};

export default async function PortfolioPage() {
  const projects = await getAllProjects();

  return (
    <main className="min-h-screen bg-void-black text-void-light selection:bg-electric-purple/30 selection:text-white">
      {/* ------------------------------------------------------------------ */}
      {/* HERO SECTION                                                       */}
      {/* ------------------------------------------------------------------ */}
      <Section className="relative overflow-hidden pt-28 pb-16 border-b border-void-border/50">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-[550px] rounded-full bg-electric-purple/10 blur-[130px]"
        />

        <Container className="relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-electric-purple/30 bg-electric-purple/10 px-3.5 py-1 text-xs font-mono font-medium text-electric-purple mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-electric-neon animate-pulse" />
            ENGINEERING SHOWCASE
          </div>

          <h1
            id="portfolio-headline"
            className="font-mono text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight"
          >
            Selected Work &{" "}
            <span className="bg-gradient-to-r from-electric-purple via-electric-violet to-electric-neon bg-clip-text text-transparent">
              Engineering Concepts.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg lg:text-xl text-void-light leading-relaxed max-w-2xl mx-auto">
            Explore software concepts, architecture experiments and digital solutions developed around practical engineering challenges.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3 text-xs font-mono text-void-muted">
            <Badge variant="outline" className="border-electric-purple/40 text-electric-purple text-[10px]">
              AUTHENTIC LAB PROTOTYPES
            </Badge>
            <span>•</span>
            <span>Zero Fabricated Case Studies</span>
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* INTERACTIVE PROJECTS DISCOVERY GRID                                */}
      {/* ------------------------------------------------------------------ */}
      <Section className="py-16">
        <Container className="max-w-7xl">
          <PortfolioFilter initialProjects={projects} />
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* CONVERSION BANNER                                                  */}
      {/* ------------------------------------------------------------------ */}
      <Section className="py-20 border-t border-void-border/50 bg-void-dark/40">
        <Container className="text-center max-w-3xl">
          <Badge variant="outline" className="border-electric-purple/40 text-electric-purple mb-4">
            BESPOKE ENGINEERING
          </Badge>
          <h2 className="font-mono text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Have a custom software challenge?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-void-light leading-relaxed max-w-xl mx-auto">
            From high-concurrency backend services to modern web applications and AI agent workflows, we engineer solutions designed specifically for your constraints.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/contact" tabIndex={-1}>
              <Button size="lg" variant="glow" className="gap-2">
                <span>Start Your Project</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/about" tabIndex={-1}>
              <Button size="lg" variant="outline">
                <span>Our Engineering Approach</span>
              </Button>
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
