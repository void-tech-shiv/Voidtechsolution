import type { Metadata } from "next";
import Link from "next/link";
import {
  Code2,
  Terminal,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  Compass,
  CheckCircle2,
  Sparkles,
  GitBranch,
  Search,
  Layout,
  Hammer,
  Bug,
  Rocket,
  Database,
  Smartphone,
  Cloud,
  Palette,
  Server,
  Zap,
} from "lucide-react";
import { Container, Section } from "@/components/layout";
import { buttonVariants } from "@/components/ui/button";
import { PublicPageHero } from "@/components/layout/public-page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "About Us | VOIDTECH SOLUTION",
  description:
    "Learn about VOIDTECH SOLUTION — an engineering-first software development agency dedicated to turning ideas into reliable, maintainable digital products through thoughtful engineering.",
  openGraph: {
    title: "About Us | VOIDTECH SOLUTION",
    description:
      "VOIDTECH SOLUTION builds practical digital products through modern engineering, thoughtful design, and technology-driven problem solving.",
    type: "website",
    url: `${siteConfig.url}/about`,
  },
  alternates: {
    canonical: `${siteConfig.url}/about`,
  },
};

/**
 * 6 Core Values
 */
const coreValues = [
  {
    number: "01",
    title: "Engineering Quality",
    description:
      "We write clean, test-driven, maintainable code engineered to scale reliably without unnecessary complexity or architectural bloat.",
    icon: Code2,
  },
  {
    number: "02",
    title: "Transparent Communication",
    description:
      "Direct technical collaboration, grounded timelines, clear architectural tradeoffs, and no hidden fees or agency jargon.",
    icon: Terminal,
  },
  {
    number: "03",
    title: "Practical Innovation",
    description:
      "We adopt modern technologies and AI workflows when they solve concrete business problems, never for vanity or superficial hype.",
    icon: Sparkles,
  },
  {
    number: "04",
    title: "Maintainable Architecture",
    description:
      "We build modular, decoupled systems with strict type safety that your team can confidently own, extend, and operate long-term.",
    icon: Layers,
  },
  {
    number: "05",
    title: "User-Centered Design",
    description:
      "Intuitive, accessible, and responsive user experiences crafted with ergonomic interface design and micro-interaction polish.",
    icon: Compass,
  },
  {
    number: "06",
    title: "Continuous Improvement",
    description:
      "Rigorous peer code reviews, continuous benchmarking, automated regression testing, and disciplined ongoing optimization.",
    icon: ShieldCheck,
  },
];

/**
 * 6 Structured Engineering Phases
 */
const engineeringPhases = [
  {
    step: "01",
    name: "Understand the requirement",
    summary:
      "Deep-dive technical scoping, stakeholder requirements gathering, constraint identification, and defining verifiable success metrics.",
    icon: Search,
  },
  {
    step: "02",
    name: "Define the architecture",
    summary:
      "Database schema modeling, API contract specification, security posture planning, and decoupled component boundary mapping.",
    icon: GitBranch,
  },
  {
    step: "03",
    name: "Design the experience",
    summary:
      "Design system definition, interactive component state design, responsive layouts, and accessible interface prototyping.",
    icon: Layout,
  },
  {
    step: "04",
    name: "Develop the solution",
    summary:
      "Strictly typed full-stack implementation, modular service layers, automated linting, atomic commits, and continuous integration.",
    icon: Hammer,
  },
  {
    step: "05",
    name: "Test thoroughly",
    summary:
      "Unit and integration test suites, boundary condition testing, accessibility audits, and simulated benchmark performance verification.",
    icon: Bug,
  },
  {
    step: "06",
    name: "Deliver and support",
    summary:
      "Production deployment configuration, comprehensive documentation, clean repository handover, and post-launch stability support.",
    icon: Rocket,
  },
];

/**
 * Categorized Technology Stack Matrix
 */
const techStackMatrix = [
  {
    category: "Frontend Engineering",
    icon: Layout,
    items: ["Next.js (App Router)", "React 19", "TypeScript", "Tailwind CSS", "HTML5 & Modern CSS"],
    badge: "Core UI",
  },
  {
    category: "Backend & Systems",
    icon: Server,
    items: ["Node.js", "Go", "Python", "FastAPI", "RESTful & GraphQL APIs"],
    badge: "Services",
  },
  {
    category: "Database & Storage",
    icon: Database,
    items: ["PostgreSQL", "Prisma ORM", "Redis", "Vector Databases (pgvector)"],
    badge: "Persistence",
  },
  {
    category: "AI & Automation",
    icon: Cpu,
    items: ["LangGraph & LangChain", "OpenAI & Gemini APIs", "Workflow Automation", "Autonomous Tool Calling"],
    badge: "Intelligence",
  },
  {
    category: "Mobile Platforms",
    icon: Smartphone,
    items: ["Flutter", "React Native", "Cross-Platform Architecture", "Offline Sync"],
    badge: "Mobile",
  },
  {
    category: "Cloud & DevOps",
    icon: Cloud,
    items: ["Docker", "Kubernetes", "AWS & Cloud Services", "Vercel", "GitHub Actions CI/CD"],
    badge: "Infrastructure",
  },
  {
    category: "Design & User Experience",
    icon: Palette,
    items: ["Figma", "Design Systems", "Accessible UI (WCAG Patterns)", "Responsive Micro-interactions"],
    badge: "Design",
  },
];

export default function AboutPage() {
  return (
    <main className="public-editorial min-h-screen bg-void-black text-void-light selection:bg-electric-purple/30 selection:text-white">
      <PublicPageHero
        headingId="about-headline"
        eyebrow="About VOIDTECH SOLUTION"
        title={<>Engineering Ideas Into <span className="bg-gradient-to-r from-electric-purple via-electric-violet to-electric-neon bg-clip-text text-transparent">Digital Reality.</span></>}
        description="VOIDTECH SOLUTION builds practical digital products through modern engineering, thoughtful design, and technology-driven problem solving."
        actions={<><Link href="/portfolio" className={buttonVariants({ variant: "glow", size: "lg", className: "min-h-12" })}>Explore Our Work<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><Link href="/contact" className={buttonVariants({ variant: "outline", size: "lg", className: "min-h-12" })}>Start Your Project</Link></>}
        imageSrc="/hero/voidtech-about-3d.webp"
        imageAlt="VOIDTECH Global Engineering Network"
        asideLabel="Engineering values"
        aside={<ul className="space-y-2">{["Engineering Quality", "Transparent Communication", "Practical Innovation", "Maintainable Architecture", "User-Centered Design", "Continuous Improvement"].map((value, i) => <li key={value} className="flex items-center gap-3 rounded-lg border border-void-border/55 bg-void-black/35 px-3.5 py-3"><span className="font-mono text-[10px] text-electric-purple">0{i + 1}</span><span className="text-sm font-medium text-white">{value}</span></li>)}</ul>}
      />

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 2: WHO WE ARE                                              */}
      {/* ------------------------------------------------------------------ */}
      <Section id="who-we-are" className="py-20 border-b border-void-border/50 bg-void-dark/50">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-4">
              <Badge variant="outline" className="border-electric-purple/40 text-electric-purple">
                WHO WE ARE
              </Badge>
              <h2 className="font-mono text-3xl sm:text-4xl font-bold text-white tracking-tight">
                An Engineering-First Digital Solutions Studio.
              </h2>
              <p className="font-mono text-xs uppercase tracking-wider text-electric-purple">
                Build. Launch. Grow Online.
              </p>
            </div>

            <div className="lg:col-span-7 space-y-5 text-sm sm:text-base text-void-light leading-relaxed border-l-2 border-void-border pl-6 sm:pl-8">
              <p>
                VOIDTECH SOLUTION was created to bridge the divide between ambitious business concepts and reliable, scalable production software. We are not a volume-driven agency or a generic design shop—we are software engineers and product designers who take craftsmanship seriously.
              </p>
              <p>
                We collaborate directly with founders, growing companies, and enterprises to design, architect, and implement high-performance web applications, native mobile experiences, custom backend APIs, and intelligent automation systems.
              </p>
              <p>
                Every project we undertake is grounded in modular architecture, strict type safety, transparent communication, and clean repository handovers—giving you complete ownership of your digital assets.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 3: MISSION & VISION                                        */}
      {/* ------------------------------------------------------------------ */}
      <Section id="mission-vision" className="py-20 border-b border-void-border/50">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="border-electric-purple/40 text-electric-purple mb-3">
              PURPOSE & DIRECTION
            </Badge>
            <h2 className="font-mono text-3xl sm:text-4xl font-bold text-white">
              Our Mission & Vision
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mission Card */}
            <Card className="border-electric-purple/30 bg-void-charcoal/40 backdrop-blur-sm relative overflow-hidden group hover:border-electric-purple/60 transition-all">
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-electric-purple to-electric-violet" />
              <CardContent className="p-8 sm:p-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-electric-purple/10 border border-electric-purple/30 text-electric-purple">
                    <Rocket className="h-6 w-6" />
                  </div>
                  <span className="font-mono text-xs uppercase tracking-widest text-electric-purple font-semibold">
                    Our Mission
                  </span>
                </div>
                <h3 className="font-mono text-2xl font-bold text-white">
                  Transform ideas into reliable, useful and maintainable digital solutions.
                </h3>
                <p className="text-void-light text-sm sm:text-base leading-relaxed">
                  We exist to eliminate the friction between conceptualization and deployment by applying structured software engineering principles to every digital product we build.
                </p>
              </CardContent>
            </Card>

            {/* Vision Card */}
            <Card className="border-electric-purple/30 bg-void-charcoal/40 backdrop-blur-sm relative overflow-hidden group hover:border-electric-purple/60 transition-all">
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-electric-violet to-electric-neon" />
              <CardContent className="p-8 sm:p-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-electric-neon/10 border border-electric-neon/30 text-electric-neon">
                    <Zap className="h-6 w-6" />
                  </div>
                  <span className="font-mono text-xs uppercase tracking-widest text-electric-neon font-semibold">
                    Our Vision
                  </span>
                </div>
                <h3 className="font-mono text-2xl font-bold text-white">
                  Make modern technology more accessible to businesses and innovators through thoughtful software engineering.
                </h3>
                <p className="text-void-light text-sm sm:text-base leading-relaxed">
                  We envision a digital landscape where robust, resilient, and accessible software empowers builders of all scales to compete globally with enterprise-grade quality.
                </p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 4: CORE VALUES (6 PILLARS)                                 */}
      {/* ------------------------------------------------------------------ */}
      <Section id="core-values" className="py-20 border-b border-void-border/50 bg-void-dark/30">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="border-electric-purple/40 text-electric-purple mb-3">
              GUIDING PRINCIPLES
            </Badge>
            <h2 className="font-mono text-3xl sm:text-4xl font-bold text-white">
              The 6 Pillars We Build On
            </h2>
            <p className="mt-3 text-sm sm:text-base text-void-muted">
              These fundamental values shape our code, our architectural choices, and how we collaborate with clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreValues.map((value) => {
              const Icon = value.icon;
              return (
                <Card
                  key={value.number}
                  className="border-void-border bg-void-surface/40 hover:border-electric-purple/50 transition-all group"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-lg bg-electric-purple/10 border border-electric-purple/20 text-electric-purple group-hover:border-electric-purple/50 transition-colors">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-mono text-xs text-void-muted font-semibold tracking-widest">
                        {value.number}
                      </span>
                    </div>
                    <h3 className="font-mono text-lg font-bold text-white group-hover:text-electric-purple transition-colors">
                      {value.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-void-light leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 5: OUR APPROACH (6 PHASES)                                 */}
      {/* ------------------------------------------------------------------ */}
      <Section id="our-approach" className="py-20 border-b border-void-border/50">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="border-electric-purple/40 text-electric-purple mb-3">
              METHODOLOGY
            </Badge>
            <h2 className="font-mono text-3xl sm:text-4xl font-bold text-white">
              Our Engineering Approach
            </h2>
            <p className="mt-3 text-sm sm:text-base text-void-muted">
              A disciplined, reproducible six-stage lifecycle that ensures transparency, predictability, and high software quality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {engineeringPhases.map((phase) => {
              const Icon = phase.icon;
              return (
                <div
                  key={phase.step}
                  className="flex flex-col p-6 rounded-xl border border-void-border bg-void-charcoal/30 hover:border-electric-purple/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold text-electric-purple px-2 py-1 rounded bg-electric-purple/10 border border-electric-purple/30">
                      Phase {phase.step}
                    </span>
                    <Icon className="h-4 w-4 text-void-muted" />
                  </div>
                  <h3 className="font-mono text-base font-semibold text-white mb-2">
                    {phase.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-void-muted leading-relaxed">
                    {phase.summary}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 6: TECHNOLOGY STACK MATRIX                                */}
      {/* ------------------------------------------------------------------ */}
      <Section id="technology-stack" className="py-20 border-b border-void-border/50 bg-void-dark/40">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="border-electric-purple/40 text-electric-purple mb-3">
              TECHNOLOGY MATRIX
            </Badge>
            <h2 className="font-mono text-3xl sm:text-4xl font-bold text-white">
              Technologies We Master & Build With
            </h2>
            <p className="mt-3 text-sm sm:text-base text-void-muted">
              Modern, battle-tested programming languages, frameworks, and cloud infrastructure engineered for longevity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStackMatrix.map((stack, idx) => {
              const Icon = stack.icon;
              return (
                <Card
                  key={idx}
                  className="border-void-border bg-void-surface/50 hover:border-electric-purple/40 transition-all"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-md bg-electric-purple/10 text-electric-purple border border-electric-purple/20">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h3 className="font-mono text-sm font-bold text-white">
                          {stack.category}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-void-charcoal border border-void-border text-void-muted">
                        {stack.badge}
                      </span>
                    </div>

                    <ul className="space-y-2 pt-2 border-t border-void-border/50">
                      {stack.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-center gap-2 text-xs text-void-light">
                          <CheckCircle2 className="h-3.5 w-3.5 text-electric-purple shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 7: FINAL CALL TO ACTION                                    */}
      {/* ------------------------------------------------------------------ */}
      <Section className="py-24 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-72 w-[500px] rounded-full bg-electric-purple/10 blur-[120px]"
        />

        <Container className="relative z-10 text-center max-w-3xl">
          <Badge variant="outline" className="border-electric-purple/40 text-electric-purple mb-4">
            LET&apos;S COLLABORATE
          </Badge>
          <h2 className="font-mono text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Have an idea worth building?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-void-light leading-relaxed max-w-xl mx-auto">
            Let&apos;s talk through your technical requirements, architectural constraints, and delivery timeline. Direct consultation with our engineering team.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/contact" className={buttonVariants({ variant: "glow", size: "lg", className: "gap-2" })}>
                <span>Start Your Project</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            <Link href="/portfolio" className={buttonVariants({ variant: "outline", size: "lg" })}>
                <span>View Selected Work</span>
              </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
