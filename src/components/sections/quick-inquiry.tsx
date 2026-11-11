"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickInquiry() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-electric-purple/40 bg-void-card-gradient p-8 sm:p-12 shadow-glow-md backdrop-blur-xl"
    >
      {/* Background ambient neon glow */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-electric-purple/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-electric-violet/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        {/* Section Sub-badge */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-electric-purple/30 bg-electric-purple/10 px-3.5 py-1 text-xs font-mono font-medium text-electric-purple">
          <span className="h-1.5 w-1.5 rounded-full bg-electric-neon" />
          <span>PROJECT CONSULTATION & INTAKE</span>
        </div>

        {/* Headline */}
        <h2 className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Have an Idea? Let&apos;s Build It.
        </h2>

        {/* Supporting Copy */}
        <p className="mt-4 text-base leading-relaxed text-void-light sm:text-lg">
          Tell us what you&apos;re planning. Let&apos;s explore how the right technology can bring it to life.
        </p>

        {/* Action Controls */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/#services" tabIndex={-1}>
            <Button size="lg" variant="glow" className="gap-2">
              <span>Explore Services & Capabilities</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Link href="/#pricing" tabIndex={-1}>
            <Button size="lg" variant="outline">
              Review Pricing Tiers
            </Button>
          </Link>
        </div>

        {/* Notice on Official Public Intake Channel */}
        <div className="mt-6 inline-block rounded-lg border border-void-border/60 bg-void-surface/50 px-4 py-2 text-xs text-void-muted">
          Official digital intake channels open with platform launch. Scope your project via our capability catalog.
        </div>

        {/* Service Highlights */}
        <div className="mt-10 grid grid-cols-1 gap-4 border-t border-void-border/50 pt-8 sm:grid-cols-3">
          <div className="flex items-center justify-center gap-2 text-xs text-void-muted">
            <Clock className="h-4 w-4 text-electric-purple shrink-0" aria-hidden="true" />
            <span>Structured Requirements Scoping</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-void-muted">
            <ShieldCheck className="h-4 w-4 text-electric-purple shrink-0" aria-hidden="true" />
            <span>Full Repository Handover</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-void-muted">
            <CheckCircle className="h-4 w-4 text-electric-purple shrink-0" aria-hidden="true" />
            <span>Clear Milestone Pricing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
