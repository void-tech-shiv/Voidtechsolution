"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Clock, CheckCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BrandLogo } from "@/components/ui/brand-logo";

export function QuickInquiry() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-void-border/80 bg-gradient-to-b from-[#100D1B]/95 to-[#050507]/98 p-8 sm:p-12 shadow-[0_0_40px_-10px_rgba(168,85,247,0.25)] backdrop-blur-xl"
    >
      {/* Background ambient purple/violet glows */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-electric-purple/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-electric-violet/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-[auto_1fr_auto]">
        {/* Left: Official 3D Holographic Cybernetic Emblem */}
        <div className="hidden lg:flex flex-col items-center justify-center">
          <div className="relative flex h-36 w-36 items-center justify-center">
            {/* Outer rotating pulse rings */}
            <div className="absolute inset-0 rounded-full border border-electric-purple/30 animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-2 rounded-full border border-dashed border-electric-neon/40 animate-[spin_12s_linear_infinite_reverse]" />
            <div className="absolute inset-5 rounded-full border border-purple-500/30" />
            <div className="absolute inset-0 rounded-full bg-electric-purple/10 blur-xl" />

            {/* Central Official Emblem */}
            <BrandLogo variant="emblem" size="md" href={false} />

            {/* Orbiting cyber indicators */}
            <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-electric-neon shadow-[0_0_8px_#C084FC]" />
            <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-electric-purple shadow-[0_0_8px_#8B5CF6]" />
          </div>
        </div>

        {/* Center: Main CTA Copy & Action Controls */}
        <div className="text-center lg:text-left">
          {/* Sub-badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-electric-purple/40 bg-electric-purple/10 px-3.5 py-1 text-xs font-mono font-medium text-electric-neon">
            <span className="h-1.5 w-1.5 rounded-full bg-electric-neon shadow-[0_0_6px_#C084FC]" />
            <span>PROJECT CONSULTATION & INTAKE</span>
          </div>

          {/* Headline */}
          <h2 className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Have an Idea? Let&apos;s Build It.
          </h2>

          {/* Supporting Copy */}
          <p className="mt-3 text-base leading-relaxed text-void-light sm:text-lg">
            Tell us what you&apos;re planning. Let&apos;s explore how thoughtful architecture and practical engineering can bring it to life.
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <Link
              href="/services"
              className={buttonVariants({
                variant: "glow",
                size: "lg",
                className: "gap-2 min-h-12 bg-gradient-to-r from-electric-violet via-electric-purple to-purple-500 text-white font-semibold shadow-glow-sm hover:shadow-glow-md",
              })}
            >
              <span>Explore Services & Capabilities</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/pricing"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "min-h-12 border-electric-purple/50 text-electric-purple hover:bg-electric-purple/15",
              })}
            >
              Review Pricing Tiers
            </Link>
          </div>

          {/* Platform Notice */}
          <div className="mt-4 inline-block rounded-lg border border-void-border/70 bg-[#050507]/60 px-4 py-1.5 text-xs text-void-muted">
            Official digital intake channels open with platform launch. Scope your project via our capability catalog.
          </div>
        </div>

        {/* Right: Engineering Readiness HUD Card */}
        <div className="hidden xl:block">
          <div className="w-64 rounded-xl border border-void-border/80 bg-[#171126]/85 p-5 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-void-border/60 pb-3">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-electric-purple">
                Readiness Telemetry
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981] animate-pulse" />
                <span className="font-mono text-[10px] text-emerald-400">ONLINE</span>
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="font-mono text-[11px] text-void-muted">Average Response</p>
                <p className="font-mono text-xl font-bold text-white">2 - 4 Hours</p>
              </div>
              <div className="border-t border-void-border/60 pt-2.5">
                <p className="font-mono text-[11px] text-void-muted">Code Transfer</p>
                <p className="font-mono text-xs font-semibold text-electric-purple">100% Repository IP Handover</p>
              </div>
              <div className="border-t border-void-border/60 pt-2.5">
                <p className="font-mono text-[11px] text-void-muted">Commercial Terms</p>
                <p className="font-mono text-xs font-semibold text-void-light">50/50 Milestone Escrow</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Highlights Strip */}
      <div className="mt-10 grid grid-cols-1 gap-4 border-t border-void-border/60 pt-8 sm:grid-cols-3">
        <div className="flex items-center justify-center gap-2.5 text-xs text-void-light">
          <Clock className="h-4 w-4 text-electric-purple shrink-0" aria-hidden="true" />
          <span className="font-medium">Structured Requirements Scoping</span>
        </div>
        <div className="flex items-center justify-center gap-2.5 text-xs text-void-light">
          <ShieldCheck className="h-4 w-4 text-electric-purple shrink-0" aria-hidden="true" />
          <span className="font-medium">Full Repository Handover</span>
        </div>
        <div className="flex items-center justify-center gap-2.5 text-xs text-void-light">
          <CheckCircle className="h-4 w-4 text-electric-purple shrink-0" aria-hidden="true" />
          <span className="font-medium">Clear Milestone Pricing</span>
        </div>
      </div>
    </div>
  );
}
