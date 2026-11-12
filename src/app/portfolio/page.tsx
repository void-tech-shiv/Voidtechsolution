import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAllProjects } from "@/server/repositories/portfolio.repo";
import { Container, Section } from "@/components/layout";
import { buttonVariants } from "@/components/ui/button";
import { PublicPageHero } from "@/components/layout/public-page-hero";
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
    <main className="public-editorial min-h-screen bg-void-black text-void-light selection:bg-electric-purple/30 selection:text-white">
      <PublicPageHero
        headingId="portfolio-headline"
        eyebrow="Engineering showcase"
        title={<>Selected Work & <span className="bg-gradient-to-r from-electric-purple via-electric-violet to-electric-neon bg-clip-text text-transparent">Engineering Concepts.</span></>}
        description="Explore software concepts, architecture experiments and digital solutions developed around practical engineering challenges."
        imageSrc="/hero/voidtech-portfolio-3d.webp"
        imageAlt="VOIDTECH Concept Lab Showroom & Architecture Displays"
        asideLabel="Concept lab"
        aside={<div className="space-y-4"><span className="inline-flex rounded-full border border-electric-purple/40 bg-electric-purple/10 px-3 py-1 font-mono text-[10px] font-semibold tracking-wider text-electric-purple">AUTHENTIC LAB PROTOTYPES</span><div className="flex aspect-[16/10] flex-col justify-between overflow-hidden rounded-xl border border-void-border/70 bg-[radial-gradient(ellipse_at_72%_28%,rgba(139,92,246,0.22),transparent_55%),linear-gradient(145deg,#15151f,#09090d)] p-4"><div className="flex justify-between"><span className="font-mono text-[10px] uppercase tracking-wider text-electric-purple">LAB / CONCEPTS</span><span className="h-2 w-2 rounded-full bg-electric-neon" aria-hidden="true" /></div><div className="grid grid-cols-3 gap-2" aria-hidden="true"><span className="h-12 rounded-lg border border-electric-purple/25 bg-electric-purple/10"/><span className="h-12 rounded-lg border border-void-border bg-void-black/35"/><span className="h-12 rounded-lg border border-electric-purple/20 bg-electric-purple/5"/></div><div><p className="text-sm font-semibold text-white">Prototype & architecture experiments</p><p className="mt-1 text-xs text-void-muted">Concept work is labeled clearly throughout this showcase.</p></div></div><p className="rounded-lg border border-electric-purple/20 bg-electric-purple/5 p-3.5 text-xs leading-relaxed text-void-light">Authentic lab prototypes. Zero fabricated case studies or client results.</p></div>}
      />

      {/* ------------------------------------------------------------------ */}
      {/* INTERACTIVE PROJECTS DISCOVERY GRID                                */}
      {/* ------------------------------------------------------------------ */}
      <Section className="py-16">
        <Container>
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
            <Link href="/contact" className={buttonVariants({ variant: "glow", size: "lg", className: "gap-2" })}>
                <span>Start Your Project</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            <Link href="/about" className={buttonVariants({ variant: "outline", size: "lg" })}>
                <span>Our Engineering Approach</span>
              </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
