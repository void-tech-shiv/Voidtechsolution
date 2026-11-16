"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export interface BrandLogoProps {
  variant?: "header" | "footer" | "symbol" | "full" | "emblem";
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  href?: string | false;
  className?: string;
  priority?: boolean;
  onClick?: () => void;
}

const sizeConfig = {
  sm: {
    symbolSize: 28,
    titleSize: "text-sm",
    subSize: "text-[9px]",
    taglineSize: "text-[10px]",
    emblemSize: 48,
  },
  md: {
    symbolSize: 36,
    titleSize: "text-base",
    subSize: "text-[10px]",
    taglineSize: "text-xs",
    emblemSize: 72,
  },
  lg: {
    symbolSize: 48,
    titleSize: "text-xl",
    subSize: "text-xs",
    taglineSize: "text-xs",
    emblemSize: 120,
  },
  xl: {
    symbolSize: 64,
    titleSize: "text-2xl",
    subSize: "text-sm",
    taglineSize: "text-sm",
    emblemSize: 220,
  },
};

export function BrandLogo({
  variant = "header",
  size = "md",
  showTagline = false,
  href = "/",
  className,
  priority = false,
  onClick,
}: BrandLogoProps) {
  const currentSize = sizeConfig[size];

  // 1. EMBLEM VARIANT: Full circular glowing brand badge
  if (variant === "emblem") {
    const emblemContent = (
      <div
        className={cn(
          "relative flex items-center justify-center select-none group",
          className
        )}
      >
        <Image
          src="/brand/voidtech-emblem.webp"
          alt="VOIDTECH SOLUTION Official Emblem"
          width={currentSize.emblemSize}
          height={currentSize.emblemSize}
          priority={priority}
          className="rounded-full shadow-glow-sm group-hover:shadow-glow-md transition-all duration-300 transform-gpu group-hover:scale-105"
        />
      </div>
    );

    if (href) {
      return (
        <Link
          href={href}
          onClick={onClick}
          aria-label="VOIDTECH SOLUTION Home"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-purple/70 rounded-full"
        >
          {emblemContent}
        </Link>
      );
    }
    return emblemContent;
  }

  // 2. SYMBOL VARIANT: Compact official ribbon V mark only
  if (variant === "symbol") {
    const symbolContent = (
      <div
        className={cn(
          "relative flex items-center justify-center select-none group",
          className
        )}
      >
        <div className="relative transform-gpu transition-all duration-300 group-hover:scale-110">
          <Image
            src="/brand/voidtech-symbol.webp"
            alt="VOIDTECH Official Brand Symbol"
            width={currentSize.symbolSize}
            height={Math.round(currentSize.symbolSize * 0.82)}
            priority={priority}
            className="drop-shadow-[0_0_12px_rgba(168,85,247,0.45)]"
          />
        </div>
      </div>
    );

    if (href) {
      return (
        <Link
          href={href}
          onClick={onClick}
          aria-label="VOIDTECH SOLUTION Home"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-purple/70 rounded-lg p-1"
        >
          {symbolContent}
        </Link>
      );
    }
    return symbolContent;
  }

  // 3. HEADER, FOOTER, & FULL LOGO VARIANTS (Symbol + Typography)
  const isFooter = variant === "footer";
  const shouldRenderTagline = showTagline || variant === "full" || isFooter;

  const logoContent = (
    <div
      className={cn(
        "group flex items-center gap-3 select-none",
        isFooter ? "items-start" : "items-center",
        className
      )}
    >
      {/* Official 3D Origami Ribbon V Symbol */}
      <div className="relative shrink-0 flex items-center justify-center">
        <Image
          src="/brand/voidtech-symbol.webp"
          alt="VOIDTECH"
          width={currentSize.symbolSize}
          height={Math.round(currentSize.symbolSize * 0.82)}
          priority={priority}
          className="transform-gpu transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_16px_rgba(168,85,247,0.65)] drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]"
        />
      </div>

      {/* Brand Wordmark with Perfect Proportions */}
      <div className="flex flex-col">
        <span className="sr-only">VOIDTECH SOLUTION</span>
        <div className={cn("flex items-baseline font-mono font-black tracking-wider leading-none", currentSize.titleSize)} aria-hidden="true">
          <span className="text-white group-hover:text-void-white transition-colors">
            VOID
          </span>
          <span className="text-electric-purple group-hover:text-electric-neon transition-colors filter drop-shadow-[0_0_10px_rgba(168,85,247,0.45)]">
            TECH
          </span>
        </div>

        {/* Subtitle / Separation Bar */}
        <div className="flex items-center gap-1.5 mt-1" aria-hidden="true">
          <span className="h-[1px] w-3 bg-gradient-to-r from-transparent to-electric-purple/40" />
          <span className={cn("font-mono uppercase font-semibold tracking-[0.22em] text-void-light/90 leading-none", currentSize.subSize)}>
            SOLUTION
          </span>
          <span className="h-[1px] w-3 bg-gradient-to-l from-transparent to-electric-purple/40" />
        </div>

        {/* Tagline */}
        {shouldRenderTagline && (
          <p className={cn("mt-1.5 font-mono text-electric-purple/80 font-medium tracking-wide", currentSize.taglineSize)}>
            {siteConfig.tagline}
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        aria-label="VOIDTECH SOLUTION Home"
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-purple/70 rounded-lg p-1 inline-flex items-center"
      >
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
