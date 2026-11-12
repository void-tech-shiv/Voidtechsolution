"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/site";
import { buttonVariants } from "@/components/ui/button";
import { BrandLogo } from "@/components/ui/brand-logo";
import { cn } from "@/lib/utils";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();

  const triggerButtonRef = React.useRef<HTMLButtonElement>(null);
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const lastFocusedElementRef = React.useRef<HTMLElement | null>(null);

  // Mark client mounted for safe createPortal usage
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile drawer upon route navigation
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile drawer if screen resizes to desktop breakpoint (>= 768px)
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Manage body scroll locking and touch behavior when drawer is open
  React.useEffect(() => {
    if (!mobileMenuOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyTouch = document.body.style.touchAction;
    const originalDocOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.touchAction = originalBodyTouch;
      document.documentElement.style.overflow = originalDocOverflow;
    };
  }, [mobileMenuOpen]);

  // Focus management: Save focus on open, set focus to close button, restore focus on close
  React.useEffect(() => {
    if (mobileMenuOpen) {
      lastFocusedElementRef.current = triggerButtonRef.current;
      const timer = setTimeout(() => {
        triggerButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else if (lastFocusedElementRef.current) {
      lastFocusedElementRef.current.focus();
    }
    return undefined;
  }, [mobileMenuOpen]);

  // Keyboard navigation & Focus Trap
  React.useEffect(() => {
    if (!mobileMenuOpen) return;

    lastFocusedElementRef.current = triggerButtonRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMobileMenuOpen(false);
        triggerButtonRef.current?.focus();
        return;
      }

      if (e.key === "Tab") {
        const trigger = triggerButtonRef.current;
        const drawer = drawerRef.current;
        if (!drawer || !trigger) return;

        const drawerFocusable = Array.from(
          drawer.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);

        if (drawerFocusable.length === 0) return;

        const allFocusable = [trigger, ...drawerFocusable];
        const first = allFocusable[0];
        const last = allFocusable[allFocusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  // Hide public navigation header inside administrative portal routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-void-border/70 bg-void-black/90 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Official Brand Identity - Exactly ONE instance */}
          <BrandLogo
            variant="header"
            size="md"
            href="/"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex items-center gap-7 text-sm font-medium text-void-muted"
            aria-label="Desktop Navigation"
          >
            {siteConfig.mainNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "transition-colors hover:text-void-white focus-visible:text-electric-purple focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-electric-purple rounded py-1 px-1",
                    isActive && "text-electric-purple font-semibold"
                  )}
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* Action Controls & Mobile Trigger */}
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className={cn(
                buttonVariants({ variant: "glow", size: "sm" }),
                "hidden min-h-10 sm:inline-flex"
              )}
            >
              Start Your Project
            </Link>

            {/* Exactly ONE Mobile Menu / Close Control */}
            <button
              ref={triggerButtonRef}
              type="button"
              className="flex h-10 w-10 md:hidden items-center justify-center rounded-lg border border-void-border bg-void-surface text-void-light hover:text-white hover:border-electric-purple/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-purple transition-colors cursor-pointer shrink-0"
              aria-label={mobileMenuOpen ? "Close navigation drawer" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-electric-purple" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer Portal (Mounted to document.body, avoiding CSS backdrop-filter containing block constraint) */}
      {mounted &&
        mobileMenuOpen &&
        createPortal(
          <div
            id="mobile-nav-drawer"
            className="fixed inset-0 top-16 z-40 md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            {/* Dimmed Background Backdrop (blocks background interaction, closes drawer on tap) */}
            <div
              className="fixed inset-0 top-16 bg-void-black/80 backdrop-blur-md transition-opacity duration-300 motion-reduce:transition-none"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Sliding Drawer Panel Attached Below Sticky Header */}
            <div
              ref={drawerRef}
              className="fixed top-16 right-0 bottom-0 z-40 w-full sm:max-w-sm border-l border-void-border/80 bg-void-dark shadow-2xl flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-in-out motion-reduce:transition-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Navigation Links Section */}
              <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto">
                <div className="flex items-center justify-between px-1">
                  <span className="font-mono text-[11px] font-bold text-void-muted uppercase tracking-wider">
                    Menu Navigation
                  </span>
                  <span className="rounded-full border border-electric-purple/30 bg-electric-purple/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-electric-purple">
                    Explore
                  </span>
                </div>

                <nav className="flex flex-col gap-2" aria-label="Mobile Navigation Links">
                  {siteConfig.mainNav.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center justify-between rounded-xl px-4 py-3 min-h-[48px] text-base font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-purple",
                          isActive
                            ? "bg-electric-purple/15 text-electric-purple border border-electric-purple/30 font-semibold"
                            : "text-void-light hover:bg-void-surface hover:text-white border border-transparent"
                        )}
                      >
                        <span>{item.title}</span>
                        <ArrowRight
                          className={cn(
                            "h-4 w-4 transition-transform shrink-0",
                            isActive ? "text-electric-purple" : "text-void-muted opacity-60"
                          )}
                          aria-hidden="true"
                        />
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer Bottom Action Card */}
              <div className="p-5 border-t border-void-border/60 bg-void-surface/20 flex flex-col gap-3.5 shrink-0">
                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    buttonVariants({ variant: "glow", size: "lg" }),
                    "w-full min-h-[48px] justify-center text-sm font-semibold shadow-glow-sm"
                  )}
                >
                  <span>Start Your Project</span>
                  <ArrowRight className="h-4 w-4 ml-1.5 shrink-0" aria-hidden="true" />
                </Link>
                <div className="text-center flex flex-col gap-0.5">
                  <p className="text-[11px] text-electric-purple font-mono">
                    {siteConfig.tagline}
                  </p>
                  <p className="text-[10px] text-void-muted">
                    Official Desk: {siteConfig.contactEmail}
                  </p>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
