"use client";

import * as React from "react";
import { Activity, ShieldCheck, Cpu, Terminal } from "lucide-react";

export function HeroArchitectureVisual() {
  const [activeTab, setActiveTab] = React.useState<number>(0);

  const tabs = [
    { label: "NEXT.JS & REACT", icon: Terminal },
    { label: "AI AGENTS & RAG", icon: Cpu },
    { label: "POSTGRESQL & APIS", icon: Activity },
    { label: "DEVOPS & DOCKER", icon: ShieldCheck },
  ];

  return (
    <div className="relative w-full max-w-xl mx-auto lg:max-w-none">
      {/* Outer ambient glow */}
      <div
        className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-blue-600/10 to-transparent blur-2xl"
        aria-hidden="true"
      />

      {/* Main Glass Frame */}
      <div className="relative overflow-hidden rounded-2xl border border-[rgba(70,180,230,0.25)] bg-[#061321]/80 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        {/* Top Window Bar */}
        <div className="flex items-center justify-between border-b border-[rgba(70,180,230,0.15)] bg-[#081A2B]/60 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            <span className="ml-2 font-mono text-[11px] font-medium text-slate-400">
              voidtech://sys.cluster.v1
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00D4FF] animate-pulse" />
            <span className="font-mono text-[10px] text-cyan-300">LIVE MESH</span>
          </div>
        </div>

        {/* 3D Wireframe Software Architecture Canvas */}
        <div className="relative h-80 sm:h-96 w-full overflow-hidden bg-gradient-to-b from-[#020914] via-[#061321] to-[#081A2B]">
          {/* Isometric Perspective Grid Ground */}
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0, 212, 255, 0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.25) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              transform: "perspective(600px) rotateX(60deg) translateY(20px)",
              transformOrigin: "center bottom",
            }}
          />

          {/* Central 3D Isometric Software Wireframe Visualization */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="h-full w-full max-h-[340px]"
              viewBox="0 0 500 360"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="cyanLine" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#168BFF" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="glowG" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
                </linearGradient>
                <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Floor Base Ring */}
              <ellipse cx="250" cy="270" rx="180" ry="60" stroke="#00D4FF" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />
              <ellipse cx="250" cy="270" rx="120" ry="40" stroke="#168BFF" strokeWidth="1.5" opacity="0.5" />

              {/* Tower / Microservice Stack 1 (Left - Database & Storage) */}
              <g transform="translate(140, 150)">
                <polygon points="0,30 40,10 80,30 40,50" stroke="#00D4FF" strokeWidth="1.2" fill="#081A2B" fillOpacity="0.8" />
                <polygon points="0,30 0,60 40,80 40,50" stroke="#00D4FF" strokeWidth="1.2" fill="#061321" fillOpacity="0.8" />
                <polygon points="40,50 40,80 80,60 80,30" stroke="#168BFF" strokeWidth="1.2" fill="#0B2033" fillOpacity="0.8" />

                <polygon points="0,0 40,-20 80,0 40,20" stroke="#00D4FF" strokeWidth="1.2" fill="#081A2B" fillOpacity="0.8" />
                <polygon points="0,0 0,30 40,50 40,20" stroke="#00D4FF" strokeWidth="1.2" fill="#061321" fillOpacity="0.8" />
                <polygon points="40,20 40,50 80,30 80,0" stroke="#168BFF" strokeWidth="1.2" fill="#0B2033" fillOpacity="0.8" />

                <polygon points="0,-30 40,-50 80,-30 40,-10" stroke="#43E8FF" strokeWidth="1.5" fill="#0B2033" fillOpacity="0.9" />
                <polygon points="0,-30 0,0 40,20 40,-10" stroke="#00D4FF" strokeWidth="1.2" fill="#061321" fillOpacity="0.8" />
                <polygon points="40,-10 40,20 80,0 80,-30" stroke="#168BFF" strokeWidth="1.2" fill="#081A2B" fillOpacity="0.8" />

                {/* DB Pulse dot */}
                <circle cx="40" cy="-30" r="3" fill="#00D4FF" filter="url(#neonBlur)" />
              </g>

              {/* Central Core (AI Gateway & Orchestrator Stack) */}
              <g transform="translate(210, 80)">
                <polygon points="0,60 40,40 80,60 40,80" stroke="#00D4FF" strokeWidth="1.5" fill="#081A2B" fillOpacity="0.85" />
                <polygon points="0,60 0,110 40,130 40,80" stroke="#00D4FF" strokeWidth="1.5" fill="#061321" fillOpacity="0.85" />
                <polygon points="40,80 40,130 80,110 80,60" stroke="#168BFF" strokeWidth="1.5" fill="#0B2033" fillOpacity="0.85" />

                <polygon points="0,10 40,-10 80,10 40,30" stroke="#43E8FF" strokeWidth="1.8" fill="#0B2033" fillOpacity="0.9" />
                <polygon points="0,10 0,60 40,80 40,30" stroke="#00D4FF" strokeWidth="1.5" fill="#061321" fillOpacity="0.85" />
                <polygon points="40,30 40,80 80,60 80,10" stroke="#168BFF" strokeWidth="1.5" fill="#081A2B" fillOpacity="0.85" />

                {/* Top Neural Core Beacon */}
                <line x1="40" y1="-10" x2="40" y2="-40" stroke="#00D4FF" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx="40" cy="-45" r="5" fill="#43E8FF" filter="url(#neonBlur)" />
                <circle cx="40" cy="-45" r="9" stroke="#00D4FF" strokeWidth="1" opacity="0.6" />
              </g>

              {/* Right Tower (Edge API & CDN Nodes) */}
              <g transform="translate(300, 140)">
                <polygon points="0,40 40,20 80,40 40,60" stroke="#00D4FF" strokeWidth="1.2" fill="#081A2B" fillOpacity="0.8" />
                <polygon points="0,40 0,80 40,100 40,60" stroke="#00D4FF" strokeWidth="1.2" fill="#061321" fillOpacity="0.8" />
                <polygon points="40,60 40,100 80,80 80,40" stroke="#168BFF" strokeWidth="1.2" fill="#0B2033" fillOpacity="0.8" />

                <polygon points="0,0 40,-20 80,0 40,20" stroke="#43E8FF" strokeWidth="1.4" fill="#0B2033" fillOpacity="0.9" />
                <polygon points="0,0 0,40 40,60 40,20" stroke="#00D4FF" strokeWidth="1.2" fill="#061321" fillOpacity="0.8" />
                <polygon points="40,20 40,60 80,40 80,0" stroke="#168BFF" strokeWidth="1.2" fill="#081A2B" fillOpacity="0.8" />

                <circle cx="40" cy="0" r="3" fill="#168BFF" filter="url(#neonBlur)" />
              </g>

              {/* Interconnecting Data Highway Lines with Glowing Tracers */}
              <path d="M180 180 L250 160 L340 180" stroke="url(#cyanLine)" strokeWidth="2" fill="none" />
              <path d="M180 140 L250 110 L340 140" stroke="#00D4FF" strokeWidth="1.5" strokeDasharray="6 4" fill="none" opacity="0.8" />
              <path d="M250 70 L250 20 L280 10" stroke="#43E8FF" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />

              {/* Vertical Data Beams */}
              <line x1="180" y1="120" x2="180" y2="280" stroke="#00D4FF" strokeWidth="1" strokeDasharray="2 4" opacity="0.3" />
              <line x1="250" y1="70" x2="250" y2="300" stroke="#00D4FF" strokeWidth="1" strokeDasharray="2 4" opacity="0.4" />
              <line x1="340" y1="140" x2="340" y2="280" stroke="#168BFF" strokeWidth="1" strokeDasharray="2 4" opacity="0.3" />

              {/* Orbiting data points */}
              <circle cx="215" cy="170" r="2.5" fill="#43E8FF" filter="url(#neonBlur)" />
              <circle cx="295" cy="170" r="2.5" fill="#00D4FF" filter="url(#neonBlur)" />
              <circle cx="250" cy="135" r="3" fill="#43E8FF" filter="url(#neonBlur)" />
            </svg>
          </div>

          {/* FLOATING HUD WIDGET 1: Top Right - Circular Radial Progress (Inspired by Reference) */}
          <div className="absolute right-3 top-3 rounded-xl border border-[rgba(70,180,230,0.3)] bg-[#0B2033]/90 p-3 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center">
                <svg className="h-11 w-11 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(70, 180, 230, 0.2)"
                    strokeWidth="3.5"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#00D4FF"
                    strokeWidth="3.5"
                    strokeDasharray="99.9, 100"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute font-mono text-[10px] font-bold text-white">99%</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
                  Uptime SLA
                </span>
                <span className="font-mono text-xs font-bold text-cyan-300">
                  HIGH AVAILABILITY
                </span>
              </div>
            </div>
          </div>

          {/* FLOATING HUD WIDGET 2: Middle Right - Live Telemetry Feed (Inspired by Reference) */}
          <div className="absolute right-3 top-20 hidden sm:block rounded-xl border border-[rgba(70,180,230,0.3)] bg-[#081A2B]/90 p-2.5 shadow-xl backdrop-blur-md w-40">
            <div className="flex items-center justify-between border-b border-[rgba(70,180,230,0.15)] pb-1.5 mb-2">
              <span className="font-mono text-[9px] uppercase text-slate-400">Live Telemetry</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">Edge Latency:</span>
                <span className="font-semibold text-emerald-400">12ms</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">Packet Loss:</span>
                <span className="font-semibold text-cyan-300">0.00%</span>
              </div>
            </div>
          </div>

          {/* FLOATING HUD WIDGET 3: Bottom Right - Waveform Health Index (Inspired by Reference) */}
          <div className="absolute right-3 bottom-3 rounded-xl border border-[rgba(70,180,230,0.3)] bg-[#0B2033]/90 p-3 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 block">
                  Health Index
                </span>
                <span className="font-mono text-sm font-bold text-cyan-300">
                  98% VERIFIED
                </span>
              </div>
              <svg className="h-6 w-20 text-cyan-400" viewBox="0 0 80 24" fill="none">
                <path
                  d="M0 12 L15 12 L20 4 L25 20 L30 10 L35 14 L40 12 L55 12 L60 6 L65 18 L70 12 L80 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom Technical Pill Tabs (Exact match to Reference) */}
        <div className="border-t border-[rgba(70,180,230,0.18)] bg-[#081A2B]/80 px-3 py-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {tabs.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === idx;
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-[10px] font-semibold transition-all ${
                    isActive
                      ? "border border-cyan-400/60 bg-cyan-950/60 text-cyan-300 shadow-[0_0_12px_rgba(0,212,255,0.25)]"
                      : "border border-transparent text-slate-400 hover:border-[rgba(70,180,230,0.2)] hover:bg-[#0B2033] hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
