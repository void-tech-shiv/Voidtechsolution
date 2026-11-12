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
      className="relative min-h-[90vh] lg:min-h-[94vh] flex items-center overflow-hidden border-b border-[rgba(70,180,230,0.18)] bg-[#020914]"
      aria-labelledby="hero-headline"
    >
      {/* ===================================================================== */}
      {/* 3D TECHNOLOGY BACKGROUND ENVIRONMENT LAYER                            */}
      {/* ===================================================================== */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        {/* Cinematic 3D Technology Artwork */}
        <div className="relative w-full h-full">
          <Image
            src="/hero/voidtech-hero-3d.webp"
            alt="VOIDTECH 3D Digital Infrastructure & Cybernetic Architecture"
            priority
            fill
            sizes="100vw"
            className="object-cover object-[center_right] sm:object-right-top opacity-75 lg:opacity-90 transform-gpu scale-[1.02] transition-transform duration-1000"
          />

          {/* Deep Navy Gradient Overlays for High-Contrast Text Legibility */}
          {/* 1. Left Gradient (Protects Left Typography & CTAs) */}
          <div
            className="absolute inset-y-0 left-0 w-full lg:w-[65%] bg-gradient-to-r from-[#020914] via-[#020914]/95 via-50% to-transparent z-10"
            aria-hidden="true"
          />

          {/* 2. Mobile / Tablet Dark Wash (Ensures Flawless Legibility on Smaller Screens) */}
          <div
            className="absolute inset-0 bg-[#020914]/75 lg:hidden z-10"
            aria-hidden="true"
          />

          {/* 3. Bottom Fade (Blends Seamlessly into Section 2 #about) */}
          <div
            className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#020914] via-[#020914]/70 to-transparent z-10"
            aria-hidden="true"
          />

          {/* 4. Top Fade (Blends with Sticky Navigation Header) */}
          <div
            className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#020914]/90 to-transparent z-10"
            aria-hidden="true"
          />

          {/* Ambient Radial Cyan Bloom */}
          <div
            className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* Ambient Animated Cybernetic Particles */}
        <div className="absolute inset-0 z-10 opacity-60 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[20%] right-[30%] h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00D4FF] animate-pulse" />
          <div className="absolute top-[45%] right-[15%] h-1 w-1 rounded-full bg-blue-400 shadow-[0_0_6px_#168BFF] animate-pulse" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-[65%] right-[25%] h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#43E8FF] animate-pulse" style={{ animationDelay: "3s" }} />
          <div className="absolute top-[35%] right-[45%] h-1 w-1 rounded-full bg-cyan-400 shadow-[0_0_6px_#00D4FF] animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        {/* Floating Holographic HUD Telemetry Chips (Desktop Only) */}
        <div className="hidden lg:block absolute inset-0 z-20 pointer-events-none">
          {/* HUD Chip 1: Top Right - Uptime SLA Gauge */}
          <div className="absolute top-[18%] right-[8%] animate-float-slow">
            <div className="flex items-center gap-2.5 rounded-xl border border-[rgba(70,180,230,0.3)] bg-[#081A2B]/85 px-3.5 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
              </span>
              <div className="flex flex-col">
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
                  Uptime Guarantee
                </span>
                <span className="font-mono text-[11px] font-bold text-cyan-300">
                  99.9% HIGH AVAILABILITY SLA
                </span>
              </div>
            </div>
          </div>

          {/* HUD Chip 2: Center Right - Live Telemetry Monitor */}
          <div className="absolute top-[48%] right-[4%] animate-float-slow-reverse">
            <div className="flex items-center gap-3 rounded-xl border border-[rgba(70,180,230,0.3)] bg-[#0B2033]/85 px-4 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md">
              <Activity className="h-4 w-4 text-cyan-400 shrink-0" />
              <div className="flex flex-col">
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
                  Mesh Telemetry
                </span>
                <span className="font-mono text-[11px] font-semibold text-white">
                  12ms EDGE LATENCY • 0.00% LOSS
                </span>
              </div>
            </div>
          </div>

          {/* HUD Chip 3: Lower Right - Neural & System Verification */}
          <div className="absolute bottom-[22%] right-[14%] animate-float-slow">
            <div className="flex items-center gap-2.5 rounded-xl border border-[rgba(70,180,230,0.3)] bg-[#081A2B]/85 px-3.5 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <div className="flex flex-col">
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
                  Security Posture
                </span>
                <span className="font-mono text-[11px] font-bold text-emerald-400">
                  98% VERIFIED • ZERO VULNERABILITIES
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* FOREGROUND HERO CONTENT LAYER                                         */}
      {/* ===================================================================== */}
      <div className="relative z-30 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 w-full">
        <div className="max-w-2xl lg:max-w-xl xl:max-w-2xl">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(70,180,230,0.35)] bg-[rgba(0,212,255,0.08)] px-3.5 py-1.5 text-xs font-mono font-semibold text-cyan-300 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00D4FF] animate-pulse" />
            <span>VOIDTECH SOLUTION • {siteConfig.tagline}</span>
          </div>

          {/* Main Headline */}
          <h1
            id="hero-headline"
            className="mt-6 font-sans text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.08]"
          >
            Turning Ideas Into{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent filter drop-shadow-[0_0_30px_rgba(0,212,255,0.4)]">
              Powerful Digital Products.
            </span>
          </h1>

          {/* Subtitle Description */}
          <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-200">
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
                  "min-h-12 w-full sm:w-auto gap-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-400 text-white font-semibold shadow-[0_0_24px_rgba(0,212,255,0.45)] hover:shadow-[0_0_35px_rgba(0,212,255,0.7)] transition-all",
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
                  "min-h-12 w-full sm:w-auto border-[rgba(70,180,230,0.4)] bg-[#020914]/40 text-cyan-300 hover:bg-cyan-950/40 hover:border-cyan-400 backdrop-blur-sm transition-all",
              })}
            >
              Explore Our Services
            </Link>
          </div>

          {/* 4-Metric Commercial Information Cards */}
          <div className="mt-12 grid w-full grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 border-t border-[rgba(70,180,230,0.18)] pt-8">
            {[
              { value: "18+", label: "Specialized Tracks", sub: "Web, Mobile, AI & APIs" },
              { value: "100%", label: "Code Handover", sub: "Full Source & IP" },
              { value: "₹999", label: "Starting Rate", sub: "Transparent INR" },
              { value: "30-Day", label: "Warranty Shield", sub: "Bug-Fix Included" },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-xl border border-[rgba(70,180,230,0.2)] bg-[#081A2B]/70 p-3 sm:p-4 backdrop-blur-md transition-all hover:border-cyan-400/50 hover:bg-[#081A2B]/90 shadow-sm"
              >
                <p className="font-mono text-xl font-bold text-white sm:text-2xl">
                  {stat.value}
                </p>
                <p className="mt-1 font-mono text-xs font-semibold text-cyan-300">
                  {stat.label}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400 leading-tight">
                  {stat.sub}
                </p>
              </div>
            ))}
          </div>

          {/* Approach Note */}
          <p className="mt-4 text-[11px] text-slate-400">
            Full repository handover and project-specific architecture are part of the engineering approach. Pricing begins at ₹999 INR.
          </p>
        </div>
      </div>
    </section>
  );
}
