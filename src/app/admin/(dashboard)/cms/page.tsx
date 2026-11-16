import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { prisma } from "@/lib/prisma";
import {
  Layers,
  CircleDollarSign,
  Briefcase,
  HelpCircle,
  MessageSquareQuote,
  LayoutTemplate,
  ImageIcon,
  ArrowRight,
  Clock,
  CheckCircle2,
  FileEdit,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/card";

export const metadata = {
  title: "CMS Overview | VOIDTECH SOLUTION",
  description: "Headless Content Management System and publishing governance dashboard",
};

export default async function CmsOverviewPage() {
  const current = await getCurrentAdmin();
  if (!current || !current.user.isActive) {
    redirect("/admin/login");
  }

  // Fetch live CMS metrics concurrently
  const [
    _totalItems,
    publishedCount,
    draftCount,
    pendingTestimonials,
    totalMedia,
    recentRevisions,
  ] = await Promise.all([

    prisma.contentItem.count().catch(() => 0),
    prisma.contentItem.count({ where: { publicationStatus: "PUBLISHED" } }).catch(() => 0),
    prisma.contentItem.count({ where: { publicationStatus: "DRAFT" } }).catch(() => 0),
    prisma.testimonial.count({ where: { verificationStatus: "UNVERIFIED" } }).catch(() => 0),
    prisma.mediaAsset.count().catch(() => 0),
    prisma.contentRevision
      .findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { contentItem: true },
      })
      .catch(() => []),
  ]);

  const cmsModules = [
    {
      title: "Services Catalog",
      description: "Manage 18 software engineering offerings, deliverables, and tech stack tags.",
      href: "/admin/services",
      icon: Layers,
      countLabel: "18 Offerings",
      badge: "Core Catalog",
    },
    {
      title: "Commercial Pricing Tiers",
      description: "INR pricing packages, feature lists, and commercial tier management.",
      href: "/admin/pricing",
      icon: CircleDollarSign,
      countLabel: "INR Currency",
      badge: current.user.role === "EDITOR" ? "Draft Only" : "Full Governance",
    },
    {
      title: "Portfolio & Benchmarks",
      description: "Concept lab benchmarks, internal prototypes, and client case studies.",
      href: "/admin/portfolio",
      icon: Briefcase,
      countLabel: "Showcase",
      badge: "Case Studies",
    },
    {
      title: "Knowledgebase (FAQ)",
      description: "Frequently asked questions across engineering, pricing, and timelines.",
      href: "/admin/faqs",
      icon: HelpCircle,
      countLabel: "General & Tech",
      badge: "Q&A",
    },
    {
      title: "Client Testimonials",
      description: "Dual-gate verification: factual claim auditing and legal consent management.",
      href: "/admin/cms/testimonials",
      icon: MessageSquareQuote,
      countLabel: `${pendingTestimonials} Pending`,
      badge: "Dual Consent",
    },
    {
      title: "Editorial Page Sections",
      description: "Editable marketing headlines, heroes, and copy across the public website.",
      href: "/admin/cms/sections",
      icon: LayoutTemplate,
      countLabel: "Landing Copy",
      badge: "Hero & Copy",
    },
    {
      title: "Media Asset Library",
      description: "WebP optimized raster storage, accessible alt texts, and secure local delivery.",
      href: "/admin/cms/media",
      icon: ImageIcon,
      countLabel: `${totalMedia} Assets`,
      badge: "WebP Pipeline",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-void-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-void-purple/10 text-void-purple border border-void-purple/20">
              PHASE 10 CMS ENGINE
            </span>
            <span className="text-xs text-void-gray">
              Role: <strong className="text-void-light">{current.user.role}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-void-light">
            Content Management Hub
          </h1>
          <p className="text-sm text-void-gray mt-1">
            Headless administrative operations, draft versioning, and atomic publishing controls.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard className="p-4 bg-void-dark/60 border-void-border/80">
          <div className="flex items-center gap-2 text-void-gray text-xs font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            PUBLISHED
          </div>
          <div className="text-2xl font-bold text-void-light mt-1 font-mono">
            {publishedCount}
          </div>
          <div className="text-[11px] text-void-gray mt-0.5">Live on public website</div>
        </GlassCard>

        <GlassCard className="p-4 bg-void-dark/60 border-void-border/80">
          <div className="flex items-center gap-2 text-void-gray text-xs font-mono">
            <FileEdit className="w-4 h-4 text-amber-400" />
            DRAFTS
          </div>
          <div className="text-2xl font-bold text-void-light mt-1 font-mono">
            {draftCount}
          </div>
          <div className="text-[11px] text-void-gray mt-0.5">Under editorial review</div>
        </GlassCard>

        <GlassCard className="p-4 bg-void-dark/60 border-void-border/80">
          <div className="flex items-center gap-2 text-void-gray text-xs font-mono">
            <ShieldCheck className="w-4 h-4 text-void-purple" />
            PENDING AUDIT
          </div>
          <div className="text-2xl font-bold text-void-light mt-1 font-mono">
            {pendingTestimonials}
          </div>
          <div className="text-[11px] text-void-gray mt-0.5">Awaiting dual verification</div>
        </GlassCard>

        <GlassCard className="p-4 bg-void-dark/60 border-void-border/80">
          <div className="flex items-center gap-2 text-void-gray text-xs font-mono">
            <ImageIcon className="w-4 h-4 text-sky-400" />
            MEDIA ASSETS
          </div>
          <div className="text-2xl font-bold text-void-light mt-1 font-mono">
            {totalMedia}
          </div>
          <div className="text-[11px] text-void-gray mt-0.5">Optimized WebP graphics</div>
        </GlassCard>
      </div>

      {/* CMS Content Modules Grid */}
      <div>
        <h2 className="text-lg font-semibold text-void-light mb-4">
          Content Catalog & Publishing Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cmsModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="group block p-5 rounded-xl bg-void-dark/50 border border-void-border/80 hover:border-void-purple/50 hover:bg-void-dark/90 transition-all shadow-sm hover:shadow-lg hover:shadow-void-purple/5"
              >
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-lg bg-void-purple/10 text-void-purple group-hover:bg-void-purple group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {mod.badge}
                  </Badge>
                </div>
                <h3 className="text-base font-semibold text-void-light mt-4 group-hover:text-void-purple transition-colors flex items-center justify-between">
                  {mod.title}
                  <ArrowRight className="w-4 h-4 text-void-gray group-hover:translate-x-1 group-hover:text-void-purple transition-all" />
                </h3>
                <p className="text-xs text-void-gray mt-1 line-clamp-2">
                  {mod.description}
                </p>
                <div className="mt-4 pt-3 border-t border-void-border/40 text-[11px] font-mono text-void-gray">
                  {mod.countLabel}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Editorial Activity */}
      <div className="border border-void-border/80 rounded-xl bg-void-dark/40 overflow-hidden">
        <div className="px-6 py-4 border-b border-void-border/60 bg-void-black/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-void-purple" />
            <h3 className="text-sm font-semibold text-void-light">
              Recent Revision Activity
            </h3>
          </div>
          <span className="text-xs text-void-gray font-mono">Last 5 Changes</span>
        </div>

        <div className="divide-y divide-void-border/40">
          {recentRevisions.length === 0 ? (
            <div className="text-center py-8 text-xs text-void-gray">
              No recent revision activity recorded.
            </div>
          ) : (
            recentRevisions.map((rev) => (
              <div
                key={rev.id}
                className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-void-black/20 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-void-light">
                      {rev.title}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-void-black text-void-purple border border-void-border">
                      v{rev.versionNumber}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-void-gray">
                      {rev.revisionStatus}
                    </span>
                  </div>
                  <div className="text-[11px] text-void-gray mt-0.5">
                    Author: {rev.authorName} • Slug: {rev.contentItem?.slug || "N/A"}
                  </div>
                </div>
                <div className="text-[11px] font-mono text-void-gray">
                  {new Date(rev.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
