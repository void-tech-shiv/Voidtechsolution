import type { ReactNode } from "react";
import Image from "next/image";

interface PublicPageHeroProps {
  headingId: string;
  sectionId?: string;
  eyebrow: string;
  title: ReactNode;
  description: string;
  actions?: ReactNode;
  asideLabel: string;
  aside: ReactNode;
  footer?: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
}

export function PublicPageHero({
  sectionId,
  headingId,
  eyebrow,
  title,
  description,
  actions,
  asideLabel,
  aside,
  footer,
  imageSrc,
  imageAlt,
}: PublicPageHeroProps) {
  return (
    <section
      id={sectionId}
      className="public-page-hero relative overflow-hidden border-b border-void-border/60 bg-[#050507]"
      aria-labelledby={headingId}
    >
      {/* 3D Technology Background Layer (When Provided) */}
      {imageSrc ? (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          <Image
            src={imageSrc}
            alt={imageAlt || "VOIDTECH 3D Digital Infrastructure"}
            priority
            fill
            sizes="100vw"
            className="object-cover object-[center_right] sm:object-right-top opacity-50 lg:opacity-75 transform-gpu scale-[1.01]"
          />
          {/* Deep Violet / Obsidian Gradient Shield (Protects Left Typography & CTAs) */}
          <div
            className="absolute inset-y-0 left-0 w-full lg:w-[65%] bg-gradient-to-r from-[#050507] via-[#050507]/95 via-50% to-transparent z-10"
            aria-hidden="true"
          />
          {/* Mobile / Tablet Dark Wash */}
          <div
            className="absolute inset-0 bg-[#050507]/75 lg:hidden z-10"
            aria-hidden="true"
          />
          {/* Bottom Blend */}
          <div
            className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050507] to-transparent z-10"
            aria-hidden="true"
          />
          {/* Top Blend */}
          <div
            className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#050507]/80 to-transparent z-10"
            aria-hidden="true"
          />
          {/* Ambient Violet Radial Glow */}
          <div
            className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-electric-purple/10 blur-[120px] pointer-events-none"
            aria-hidden="true"
          />
        </div>
      ) : (
        <div className="public-page-hero__ambient" aria-hidden="true" />
      )}

      {/* Foreground Hero Content Container - Full 1440px Desktop Width */}
      <div className="relative z-20 mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-6 sm:gap-10 px-4 py-8 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:gap-14 lg:px-8 xl:px-12 lg:py-20">
        <div className="min-w-0">
          <span className="public-page-hero__eyebrow">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-electric-neon shadow-[0_0_8px_#C084FC] animate-pulse" aria-hidden="true" />
            {eyebrow}
          </span>
          <h1
            id={headingId}
            className="mt-3.5 sm:mt-6 max-w-4xl font-sans text-3xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            {title}
          </h1>
          <p className="mt-3 sm:mt-6 max-w-3xl text-sm leading-relaxed text-void-light sm:text-lg">
            {description}
          </p>
          {actions ? (
            <div className="mt-5 sm:mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {actions}
            </div>
          ) : null}
        </div>

        {/* Aside Panel / Visual Card */}
        <aside className="public-page-hero__aside" aria-label={asideLabel}>
          <div className="mb-3.5 flex items-center justify-between gap-3 border-b border-void-border/70 pb-3 sm:mb-5 sm:pb-4">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-void-muted">
              {asideLabel}
            </span>
            <span className="rounded-full border border-electric-purple/30 bg-electric-purple/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-electric-purple">
              VOIDTECH
            </span>
          </div>
          {aside}
        </aside>
      </div>

      {footer ? (
        <div className="relative z-20 mx-auto w-full max-w-[1440px] px-4 pb-10 sm:px-6 lg:px-8 xl:px-12">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
