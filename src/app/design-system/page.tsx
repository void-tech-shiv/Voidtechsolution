"use client";

import * as React from "react";
import {
  Code,
  Layers,
  Sparkles,
  Bot,
  Terminal,
  Zap,
} from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/layout";
import {
  Button,
  PrimaryButton,
  SecondaryButton,
  OutlineButton,
  GhostButton,
  GlowButton,
} from "@/components/ui/button";
import {
  BaseCard,
  GlassCard,
  ServiceCard,
  PricingCard,
  ProjectCard,
} from "@/components/ui/card";
import { Input, Textarea, Select, Checkbox } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { LoadingState, EmptyState, ErrorState } from "@/components/feedback";

export default function DesignSystemPreviewPage() {
  const [buttonLoading, setButtonLoading] = React.useState(false);
  const [formValues, setFormValues] = React.useState({
    inputVal: "Custom API Microservice",
    textareaVal: "We require an autonomous AI agent with tool calling and vector memory.",
    selectVal: "ai-agents",
    checkboxVal: true,
  });

  return (
    <div className="relative min-h-screen py-12">
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute inset-0 bg-void-glow-radial opacity-60"
        aria-hidden="true"
      />

      <Container>
        {/* Header Eyebrow */}
        <div className="mb-12 flex flex-col items-center text-center">
          <Badge variant="purple" size="md" dot className="mb-4">
            INTERNAL DESIGN SYSTEM PREVIEW
          </Badge>
          <h1 className="font-mono text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            VOIDTECH <span className="text-electric-purple">DESIGN TOKENS</span> & COMPONENTS
          </h1>
          <p className="mt-4 max-w-2xl text-sm sm:text-base text-void-muted leading-relaxed">
            Living architectural showcase for Phase 2: Design System, Brand Identity & Reusable UI Components.
            Demonstrating semantic tokens, typography scales, atomic primitives, and responsive behavior.
          </p>
        </div>

        {/* -------------------------------------------------------------------
         * 1. COLOR TOKENS
         * ----------------------------------------------------------------- */}
        <Section spacing="sm">
          <SectionHeading
            badge="PALETTE & TOKENS"
            title="Semantic"
            highlightedText="Color Hierarchy"
            description="Dark charcoal backgrounds with controlled luminescence and electric purple accents."
            align="left"
          />

          <div className="space-y-6">
            <div>
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-void-muted mb-3">
                Void Backgrounds & Surfaces
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {[
                  { name: "void-black", hex: "#050507", desc: "Primary BG" },
                  { name: "void-dark", hex: "#0a0a0f", desc: "Secondary BG" },
                  { name: "void-charcoal", hex: "#121218", desc: "Surface" },
                  { name: "void-surface", hex: "#181824", desc: "Elevated" },
                  { name: "void-border", hex: "#262636", desc: "Dividers" },
                  { name: "void-white", hex: "#f8f8fc", desc: "Text White" },
                ].map((color) => (
                  <div
                    key={color.name}
                    className="flex flex-col rounded-lg border border-void-border/70 bg-void-charcoal p-3"
                  >
                    <div
                      className="h-12 w-full rounded border border-white/10 mb-2 shadow-inner"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="font-mono text-xs font-bold text-void-white">{color.name}</span>
                    <span className="font-mono text-[10px] text-void-muted">{color.hex}</span>
                    <span className="text-[10px] text-electric-purple mt-0.5">{color.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-void-muted mb-3">
                Electric Violet & Purple Accents
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { name: "electric-purple", hex: "#8b5cf6", desc: "Primary Accent" },
                  { name: "electric-violet", hex: "#7c3aed", desc: "Deep Accent" },
                  { name: "electric-neon", hex: "#a855f7", desc: "Glow & Ping" },
                  { name: "electric-cyan", hex: "#06b6d4", desc: "Tech Indicator" },
                ].map((color) => (
                  <div
                    key={color.name}
                    className="flex flex-col rounded-lg border border-void-border/70 bg-void-charcoal p-3"
                  >
                    <div
                      className="h-12 w-full rounded mb-2 shadow-glow-xs"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="font-mono text-xs font-bold text-void-white">{color.name}</span>
                    <span className="font-mono text-[10px] text-void-muted">{color.hex}</span>
                    <span className="text-[10px] text-electric-purple mt-0.5">{color.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-void-muted mb-3">
                Semantic Status Colors
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { name: "status-success", hex: "#10b981", desc: "Completed / Verified" },
                  { name: "status-warning", hex: "#f59e0b", desc: "Pending Review" },
                  { name: "status-error", hex: "#ef4444", desc: "Validation Error" },
                  { name: "status-info", hex: "#06b6d4", desc: "System Notice" },
                ].map((color) => (
                  <div
                    key={color.name}
                    className="flex flex-col rounded-lg border border-void-border/70 bg-void-charcoal p-3"
                  >
                    <div
                      className="h-12 w-full rounded mb-2"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="font-mono text-xs font-bold text-void-white">{color.name}</span>
                    <span className="font-mono text-[10px] text-void-muted">{color.hex}</span>
                    <span className="text-[10px] text-void-light mt-0.5">{color.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* -------------------------------------------------------------------
         * 2. TYPOGRAPHY SCALE
         * ----------------------------------------------------------------- */}
        <Section spacing="sm">
          <SectionHeading
            badge="TYPOGRAPHY"
            title="Typographic"
            highlightedText="Scale & Hierarchy"
            description="Inter Sans paired with JetBrains Mono for a high-tech engineering aesthetic."
            align="left"
          />

          <BaseCard className="space-y-6">
            <div className="border-b border-void-border/60 pb-4">
              <span className="font-mono text-[11px] text-electric-purple uppercase">Display H1 (text-5xl font-extrabold)</span>
              <h1 className="font-mono text-4xl sm:text-5xl font-extrabold text-void-white tracking-tight mt-1">
                Engineering Venture-Scale Software
              </h1>
            </div>

            <div className="border-b border-void-border/60 pb-4">
              <span className="font-mono text-[11px] text-electric-purple uppercase">Page Heading H2 (text-3xl font-bold)</span>
              <h2 className="font-mono text-3xl font-bold text-void-white tracking-tight mt-1">
                Autonomous AI Multi-Agent Architectures
              </h2>
            </div>

            <div className="border-b border-void-border/60 pb-4">
              <span className="font-mono text-[11px] text-electric-purple uppercase">Section Heading H3 (text-xl font-semibold)</span>
              <h3 className="text-xl font-semibold text-void-white mt-1">
                High-Throughput Microservice APIs & PostgreSQL Data Layers
              </h3>
            </div>

            <div className="border-b border-void-border/60 pb-4">
              <span className="font-mono text-[11px] text-electric-purple uppercase">Subheading / Lead (text-base text-void-light)</span>
              <p className="text-base text-void-light mt-1">
                VOIDTECH SOLUTION builds commercial-grade web applications, autonomous bots, and full-stack solutions.
              </p>
            </div>

            <div className="border-b border-void-border/60 pb-4">
              <span className="font-mono text-[11px] text-electric-purple uppercase">Body Text (text-sm text-void-muted leading-relaxed)</span>
              <p className="text-sm text-void-muted leading-relaxed mt-1">
                Every line of code is written in strict TypeScript, validated against rigorous Zod schemas, and governed by empirical automated verification.
              </p>
            </div>

            <div>
              <span className="font-mono text-[11px] text-electric-purple uppercase">Mono & Code Snippets (font-mono text-xs)</span>
              <p className="font-mono text-xs text-electric-purple bg-void-black/70 p-3 rounded border border-void-border mt-1">
                POST /api/enquiries HTTP/1.1 &rarr; 201 Created &#123; status: &quot;NEW&quot;, priority: &quot;HIGH&quot; &#125;
              </p>
            </div>
          </BaseCard>
        </Section>

        {/* -------------------------------------------------------------------
         * 3. BUTTONS MATRIX
         * ----------------------------------------------------------------- */}
        <Section spacing="sm">
          <SectionHeading
            badge="INTERACTIVE BUTTONS"
            title="Button"
            highlightedText="Variants & States"
            description="All five semantic button variants across sizes, states, loading indicators, and icons."
            align="left"
          />

          <BaseCard className="space-y-6">
            <div>
              <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-void-muted mb-3">
                Variants (Primary, Secondary, Outline, Ghost, Glow)
              </h4>
              <div className="flex flex-wrap items-center gap-4">
                <PrimaryButton leftIcon={<Sparkles className="h-4 w-4" />}>
                  Primary Button
                </PrimaryButton>
                <SecondaryButton leftIcon={<Layers className="h-4 w-4" />}>
                  Secondary Button
                </SecondaryButton>
                <OutlineButton leftIcon={<Code className="h-4 w-4" />}>
                  Outline Button
                </OutlineButton>
                <GhostButton leftIcon={<Terminal className="h-4 w-4" />}>
                  Ghost Button
                </GhostButton>
                <GlowButton leftIcon={<Zap className="h-4 w-4 text-electric-purple" />}>
                  Glow Button
                </GlowButton>
              </div>
            </div>

            <div>
              <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-void-muted mb-3">
                Sizes (sm, md, lg)
              </h4>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" size="sm">
                  Small Button (h-8)
                </Button>
                <Button variant="primary" size="md">
                  Medium Button (h-10)
                </Button>
                <Button variant="primary" size="lg">
                  Large Button (h-12)
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-void-muted mb-3">
                Interactive States (Loading, Disabled)
              </h4>
              <div className="flex flex-wrap items-center gap-4">
                <Button
                  variant="primary"
                  isLoading={buttonLoading}
                  onClick={() => {
                    setButtonLoading(true);
                    setTimeout(() => setButtonLoading(false), 2000);
                  }}
                >
                  {buttonLoading ? "Processing..." : "Click For Loading State"}
                </Button>
                <Button variant="secondary" disabled>
                  Disabled Secondary
                </Button>
                <Button variant="outline" disabled>
                  Disabled Outline
                </Button>
              </div>
            </div>
          </BaseCard>
        </Section>

        {/* -------------------------------------------------------------------
         * 4. CARDS GALLERY
         * ----------------------------------------------------------------- */}
        <Section spacing="sm">
          <SectionHeading
            badge="CONTAINERS & CARDS"
            title="Card"
            highlightedText="Architectural Variants"
            description="Base, Glass, Service, Pricing, and Project cards styled for the dark aesthetic."
            align="left"
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Base Card */}
            <BaseCard className="flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-electric-purple">BaseCard</span>
                <h4 className="text-base font-bold text-void-white mt-1 mb-2">Standard Elevated Surface</h4>
                <p className="text-xs text-void-muted leading-relaxed">
                  Clean elevated charcoal background with subtle border. Ideal for dashboard widgets and configuration panels.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-void-border/50 text-[11px] text-void-muted font-mono">
                bg-void-charcoal border-void-border
              </div>
            </BaseCard>

            {/* Glass Card */}
            <GlassCard glow className="flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-electric-purple">GlassCard</span>
                <h4 className="text-base font-bold text-void-white mt-1 mb-2">Frosted Glass Luminescence</h4>
                <p className="text-xs text-void-muted leading-relaxed">
                  Refined backdrop blur with radial electric glow on hover. Represents the core agency aesthetic.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-void-border/50 text-[11px] text-electric-purple font-mono">
                backdrop-blur-xl hover:shadow-glow-md
              </div>
            </GlassCard>

            {/* Service Card Sample */}
            <ServiceCard
              orderNumber={1}
              category="AI_AUTOMATION"
              title="AI Agents & Workflows"
              description="Autonomous multi-agent systems equipped with cognitive reasoning, long-term vector memory, and tool-calling capabilities."
              technologies={["LangGraph", "Python", "VectorDB", "OpenAI"]}
              icon={<Bot className="h-5 w-5" />}
              onClickCTA={() => alert("ServiceCard action triggered.")}
            />

            {/* Project Card Sample */}
            <ProjectCard
              client="Aether Capital"
              industry="FINTECH"
              title="Algorithmic Liquidity Engine"
              summary="High-frequency order routing platform with sub-millisecond execution and real-time risk dashboards."
              techStack={["Next.js 15", "Go", "PostgreSQL", "Kafka"]}
              metrics={[
                { label: "Throughput", value: "250k req/s" },
                { label: "Uptime", value: "99.99%" },
              ]}
              liveUrl="https://example.com"
            />

            {/* Pricing Card Sample 1 */}
            <PricingCard
              tierName="Growth Sprint"
              tagline="Ideal for MVPs, landing engines, and rapid market entry."
              price="$3,500"
              billingPeriod="2-week sprint"
              features={[
                "Full Next.js App Router Architecture",
                "Custom UI/UX & Tailwind Design",
                "PostgreSQL & Prisma Integration",
                "Complete Documentation Suite",
              ]}
              ctaText="Select Sprint Tier"
              onSelectTier={() => alert("Sprint tier selected.")}
            />

            {/* Pricing Card Sample 2 (Popular) */}
            <PricingCard
              isPopular
              tierName="Dedicated Pod"
              tagline="Full-stack engineering squad for scalable venture products."
              price="$7,500"
              billingPeriod="per month"
              features={[
                "Full-Stack Senior Engineer & Architect",
                "Custom APIs & Autonomous AI Agents",
                "Automated CI/CD & Cloud Infrastructure",
                "Direct Slack & Weekly Roadmap Reviews",
                "SLA-Backed Performance Guarantee",
              ]}
              ctaText="Engage Dedicated Pod"
              onSelectTier={() => alert("Dedicated pod tier selected.")}
            />
          </div>
        </Section>

        {/* -------------------------------------------------------------------
         * 5. FORM CONTROLS
         * ----------------------------------------------------------------- */}
        <Section spacing="sm">
          <SectionHeading
            badge="FORM PRIMITIVES"
            title="Form"
            highlightedText="Controls & Validations"
            description="Input fields, textareas, selects, and checkboxes with error states and accessible focus rings."
            align="left"
          />

          <BaseCard>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                label="Client Project Title"
                required
                value={formValues.inputVal}
                onChange={(e) => setFormValues({ ...formValues, inputVal: e.target.value })}
                helperText="Provide a short descriptive project title."
              />

              <Input
                label="Validation Error State Example"
                required
                defaultValue="invalid-email-format"
                error="Please enter a valid corporate email address."
              />

              <Select
                label="Service Domain"
                required
                value={formValues.selectVal}
                onChange={(e) => setFormValues({ ...formValues, selectVal: e.target.value })}
                options={[
                  { label: "Autonomous AI Agents", value: "ai-agents" },
                  { label: "Full-Stack Web Development", value: "web-dev" },
                  { label: "Custom API & Microservices", value: "api-backend" },
                  { label: "Mobile Application", value: "mobile-app" },
                ]}
              />

              <div className="space-y-4 pt-2">
                <Checkbox
                  label="Enforce TypeScript Strict Mode"
                  description="Enforces zero-any rule across all route handlers and client components."
                  checked={formValues.checkboxVal}
                  onChange={(e) => setFormValues({ ...formValues, checkboxVal: e.target.checked })}
                />
                <Checkbox
                  label="Accept Terms & SLA Agreement"
                  error="You must review and accept the SLA agreement to proceed."
                  checked={false}
                  onChange={() => {}}
                />
              </div>

              <div className="md:col-span-2">
                <Textarea
                  label="Project Scope Specification"
                  required
                  rows={3}
                  value={formValues.textareaVal}
                  onChange={(e) => setFormValues({ ...formValues, textareaVal: e.target.value })}
                  helperText="Describe deliverables, third-party integrations, and performance SLAs."
                />
              </div>
            </div>
          </BaseCard>
        </Section>

        {/* -------------------------------------------------------------------
         * 6. BADGES & FEEDBACK STATES
         * ----------------------------------------------------------------- */}
        <Section spacing="sm">
          <SectionHeading
            badge="FEEDBACK & STATUS"
            title="Badges"
            highlightedText="& Feedback States"
            description="Semantic badges, loading spinners, empty states, and error alerts."
            align="left"
          />

          <div className="space-y-6">
            <BaseCard>
              <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-void-muted mb-3">
                Badges with Optional Pulse Indicators
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="default">Default Neutral</Badge>
                <Badge variant="purple" dot>
                  Electric Purple (Active)
                </Badge>
                <Badge variant="success" dot>
                  Success / Verified
                </Badge>
                <Badge variant="warning" dot>
                  Warning / Pending
                </Badge>
                <Badge variant="error" dot>
                  Error / Blocked
                </Badge>
                <Badge variant="outline">Outline Badge</Badge>
              </div>
            </BaseCard>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <BaseCard className="flex flex-col items-center justify-center">
                <span className="font-mono text-xs text-electric-purple mb-4">LoadingState</span>
                <LoadingState size="md" message="Synchronizing GSD project state..." />
              </BaseCard>

              <EmptyState
                title="No Enquiries Found"
                description="There are currently no inbound client leads in this pipeline category."
                action={{
                  label: "Simulate New Lead",
                  onClick: () => alert("Simulate action."),
                }}
              />

              <ErrorState
                title="Database Connection Offline"
                message="PostgreSQL connection deferred to Phase 3. No active database endpoint found."
                onRetry={() => alert("Retry verification triggered.")}
              />
            </div>
          </div>
        </Section>
      </Container>
    </div>
  );
}
