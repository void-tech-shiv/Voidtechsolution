"use client";

import * as React from "react";

export function TechEcosystemRibbon() {
  const technologies = [
    { name: "Next.js 15", category: "Full-Stack Framework" },
    { name: "React 19", category: "UI Engine" },
    { name: "TypeScript", category: "Type Safety" },
    { name: "Node.js", category: "Runtime" },
    { name: "Python", category: "AI & Data" },
    { name: "PostgreSQL", category: "Relational DB" },
    { name: "Prisma ORM", category: "Data Layer" },
    { name: "Flutter", category: "Mobile Apps" },
    { name: "Docker", category: "Containers" },
    { name: "AWS", category: "Cloud Infra" },
    { name: "Google Cloud", category: "Cloud & AI" },
    { name: "Tailwind CSS", category: "Design System" },
  ];

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
          Powered by Modern Technology
        </span>
        <h3 className="mt-2 text-xl sm:text-2xl font-mono font-bold text-white">
          Enterprise Frameworks & Resilient Tooling
        </h3>
      </div>

      <div className="rounded-2xl border border-[rgba(70,180,230,0.2)] bg-[#081A2B]/60 p-6 sm:p-8 backdrop-blur-xl shadow-glass-inner">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {technologies.map((tech) => (
            <div
              key={tech.name}
              className="group flex flex-col items-center justify-center rounded-xl border border-[rgba(70,180,230,0.15)] bg-[#0B2033]/50 p-4 transition-all duration-200 hover:border-cyan-400/50 hover:bg-[#0B2033] hover:shadow-[0_0_15px_rgba(0,212,255,0.2)]"
            >
              <span className="font-mono text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                {tech.name}
              </span>
              <span className="mt-1 font-mono text-[10px] text-slate-400 group-hover:text-slate-300">
                {tech.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
