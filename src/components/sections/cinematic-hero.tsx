"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Activity, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/config/site";
import { buttonVariants } from "@/components/ui/button";

export function CinematicHero() {
  return (
    <section
      id="hero"
      className="relative min-h-[90vh] lg:min-h-[94vh] flex items-center overflow-hidden border-b border-void-border/60 bg-[#050507]"
      aria-labelledby="hero-headline"
    >
      {/* ===================================================================== */}
      {/* 3D TECHNOLOGY BACKGROUND ENVIRONMENT LAYER (VIOLET / OBSIDIAN)        */}
      {/* ===================================================================== */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        {/* Cinematic 3D Technology Artwork */}
        <div className="relative w-full h-full">
          <Image
            src="/hero/voidtech-hero-violet.webp"
            alt="VOIDTECH 3D Digital Infrastructure & Cybernetic Architecture"
            priority
            fill
            sizes="100vw"
            className="object-cover object-[center_right] sm:object-right-top opacity-75 lg:opacity-90 transform-gpu scale-[1.02] transition-transform duration-1000"
          />

          {/* Deep Violet & Obsidian Gradient Overlays for High-Contrast Text Legibility */}
          {/* 1. Left Gradient (Protects Left Typography & CTAs) */}
          <div
            className="absolute inset-y-0 left-0 w-full lg:w-[65%] bg-gradient-to-r from-[#050507] via-[#050507]/95 via-50% to-transparent z-10"
            aria-hidden="true"
          />

          {/* 2. Mobile / Tablet Dark Wash (Ensures Flawless Legibility on Smaller Screens) */}
          <div
            className="absolute inset-0 bg-[#050507]/75 lg:hidden z-10"
            aria-hidden="true"
          />

          {/* 3. Bottom Fade (Blends Seamlessly into Section 2 #about) */}
          <div
            className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050507] via-[#050507]/70 to-transparent z-10"
            aria-hidden="true"
          />

          {/* 4. Top Fade (Blends with Sticky Navigation Header) */}
          <div
            className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#050507]/90 to-transparent z-10"
            aria-hidden="true"
          />

          {/* Ambient Radial Violet Bloom */}
          <div
            className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-electric-purple/15 blur-[120px] pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* Ambient Animated Cybernetic Particles */}
        <div className="absolute inset-0 z-10 opacity-60 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[20%] right-[30%] h-1.5 w-1.5 rounded-full bg-electric-neon shadow-[0_0_8px_#C084FC] animate-pulse" />
          <div className="absolute top-[45%] right-[15%] h-1 w-1 rounded-full bg-electric-purple shadow-[0_0_6px_#8B5CF6] animate-pulse" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-[65%] right-[25%] h-2 w-2 rounded-full bg-electric-violet shadow-[0_0_10px_#A855F7] animate-pulse" style={{ animationDelay: "3s" }} />
          <div className="absolute top-[35%] right-[45%] h-1 w-1 rounded-full bg-electric-neon shadow-[0_0_6px_#C084FC] animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        {/* Floating Holographic Technical Panels (Desktop Only - Illustrative / Non-Metric) */}
        <div className="hidden lg:block absolute inset-0 z-20 pointer-events-none">
          {/* Technical Panel 1: Top Right - Architecture Blueprint Indicator */}
          <div className="absolute top-[18%] right-[8%] animate-float-slow">
            <div className="flex items-center gap-2.5 rounded-xl border border-void-border/80 bg-[#100D1B]/90 px-3.5 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-electric-neon opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-electric-purple" />
              </span>
              <div className="flex flex-col">
                <span className="font-mono text-[9px] uppercase tracking-wider text-void-muted">
                  Architecture Blueprint
                </span>
                <span className="font-mono text-[11px] font-bold text-electric-neon">
                  CLOUD RUNTIME • HIGH AVAILABILITY TARGET
                </span>
              </div>
            </div>
          </div>

          {/* Technical Panel 2: Center Right - Network Topology Architecture */}
          <div className="absolute top-[48%] right-[4%] animate-float-slow-reverse">
            <div className="flex items-center gap-3 rounded-xl border border-void-border/80 bg-[#171126]/90 px-4 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md">
              <Activity className="h-4 w-4 text-electric-purple shrink-0" />
              <div className="flex flex-col">
                <span className="font-mono text-[9px] uppercase tracking-wider text-void-muted">
                  Network Topology (Illustrative)
                </span>
                <span className="font-mono text-[11px] font-semibold text-white">
                  MULTI-REGION EDGE ROUTING • LOW-LATENCY MESH
                </span>
              </div>
            </div>
          </div>

          {/* Technical Panel 3: Lower Right - Verification Pipeline */}
          <div className="absolute bottom-[22%] right-[14%] animate-float-slow">
            <div className="flex items-center gap-2.5 rounded-xl border border-void-border/80 bg-[#100D1B]/90 px-3.5 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <div className="flex flex-col">
                <span className="font-mono text-[9px] uppercase tracking-wider text-void-muted">
                  Verification Pipeline
                </span>
                <span className="font-mono text-[11px] font-bold text-emerald-400">
                  TEST-DRIVEN • AUTOMATED CI/CD GATES
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* FOREGROUND HERO CONTENT LAYER - 1440px CONTAINER WIDTH                */}
      {/* ===================================================================== */}
      <div className="relative z-30 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12 py-16 sm:py-20 lg:py-24">
        <div className="max-w-3xl lg:max-w-2xl xl:max-w-3xl">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-electric-purple/40 bg-electric-purple/10 px-3.5 py-1.5 text-xs font-mono font-semibold text-electric-neon backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-electric-neon shadow-[0_0_8px_#C084FC] animate-pulse" />
            <span>VOIDTECH SOLUTION • {siteConfig.tagline}</span>
          </div>

          {/* Main Headline */}
          <h1
            id="hero-headline"
            className="mt-6 font-sans text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.08]"
          >
            Turning Ideas Into{" "}
            <span className="bg-gradient-to-r from-electric-purple via-electric-violet to-electric-neon bg-clip-text text-transparent filter drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              Powerful Digital Products.
            </span>
          </h1>

          {/* Subtitle Description */}
          <p className="mt-6 text-base sm:text-lg leading-relaxed text-void-light max-w-2xl">
            We design, develop, and deliver modern digital solutions — from websites and applications to custom software, APIs, and AI-powered automation.
          </p>

          {/* Dual Action CTAs */}
          <div className="mt-8 flex w-full flex-col gap-3.5 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href="/contact"
              className={buttonVariants({
                variant: "glow",
                size: "lg",
                className:
                  "min-h-12 w-full sm:w-auto gap-2 bg-gradient-to-r from-electric-violet via-electric-purple to-purple-500 text-white font-semibold shadow-glow-sm hover:shadow-glow-md transition-all",
              })}
            >
              <span>Start Your Project</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/services"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className:
                  "min-h-12 w-full sm:w-auto border-electric-purple/40 bg-void-black/40 text-electric-purple hover:bg-electric-purple/15 hover:border-electric-purple backdrop-blur-sm transition-all",
              })}
            >
              Explore Our Services
            </Link>
          </div>

          {/* 4-Metric Commercial Information Cards */}
          <div className="mt-12 grid w-full grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 border-t border-void-border/60 pt-8">
            {[
              { value: "18+", label: "Specialized Tracks", sub: "Web, Mobile, AI & APIs" },
              { value: "100%", label: "Code Handover", sub: "Full Source & IP" },
              { value: "₹999", label: "Starting Rate", sub: "Transparent INR" },
              { value: "30-Day", label: "Warranty Shield", sub: "Bug-Fix Included" },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-xl border border-void-border/80 bg-[#100D1B]/80 p-3 sm:p-4 backdrop-blur-md transition-all hover:border-electric-purple/50 hover:bg-[#100D1B]/95 shadow-sm"
              >
                <p className="font-mono text-xl font-bold text-white sm:text-2xl">
                  {stat.value}
                </p>
                <p className="mt-1 font-mono text-xs font-semibold text-electric-purple">
                  {stat.label}
                </p>
                <p className="mt-0.5 text-[10px] text-void-muted leading-tight">
                  {stat.sub}
                </p>
              </div>
            ))}
          </div>

          {/* Approach Note */}
          <p className="mt-4 text-[11px] text-void-muted">
            Full repository handover and project-specific architecture are part of the engineering approach. Pricing begins at ₹999 INR.
          </p>
        </div>
      </div>
    </section>
  );
}
