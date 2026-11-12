"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  const triggerButtonRef = React.useRef<HTMLButtonElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const lastFocusedElementRef = React.useRef<HTMLElement | null>(null);

  // Close mobile drawer upon route navigation
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
      lastFocusedElementRef.current = document.activeElement as HTMLElement | null;
      // Focus close button after DOM updates
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else if (lastFocusedElementRef.current) {
      lastFocusedElementRef.current.focus();
    }
    return undefined;
  }, [mobileMenuOpen]);

  // Keyboard navigation: Escape key to close, and Tab key focus trap inside drawer
  React.useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMobileMenuOpen(false);
        return;
      }

      if (e.key === "Tab") {
        const drawer = drawerRef.current;
        if (!drawer) return;

        const focusableElements = drawer.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-void-border/70 bg-void-black/85 backdrop-blur-xl transition-all">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Identity */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-purple/70 rounded-lg p-1"
          aria-label="VOIDTECH SOLUTION Home"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-electric-violet to-electric-purple shadow-glow-xs group-hover:shadow-glow-sm transition-all">
            <span className="font-mono text-base font-black text-white">V</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-base font-bold tracking-wider text-void-white group-hover:text-electric-purple transition-colors">
              VOIDTECH
            </span>
            <span className="text-[10px] uppercase tracking-widest text-void-muted">
              SOLUTION
            </span>
          </div>
        </Link>

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
          <Link href="/contact" className="hidden sm:inline-flex">
            <Button size="sm" variant="glow">
              Start Your Project
            </Button>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            ref={triggerButtonRef}
            type="button"
            className="flex h-10 w-10 md:hidden items-center justify-center rounded-lg border border-void-border bg-void-surface text-void-light hover:text-white hover:border-electric-purple/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-purple transition-colors cursor-pointer"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Modal & Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
        >
          {/* Dimmed Background Backdrop (blocks background interaction) */}
          <div
            className="fixed inset-0 bg-void-black/85 backdrop-blur-md transition-opacity duration-300 motion-reduce:transition-none"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Dedicated Fixed-Position Sliding Drawer Panel */}
          <div
            ref={drawerRef}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-[320px] sm:max-w-sm border-l border-void-border/80 bg-void-dark shadow-2xl flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-in-out motion-reduce:transition-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header with Title and Accessible Close Button */}
            <div className="flex items-center justify-between border-b border-void-border/60 px-5 py-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-electric-violet text-white font-mono font-bold text-xs shadow-glow-xs">
                  V
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-xs font-bold text-void-white tracking-wider">
                    VOIDTECH
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-void-muted">
                    SOLUTION
                  </span>
                </div>
              </div>

              {/* Dedicated Close Button */}
              <button
                ref={closeButtonRef}
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-void-border bg-void-surface text-void-light hover:text-white hover:border-electric-purple/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-purple transition-colors cursor-pointer"
                aria-label="Close navigation drawer"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Navigation Links with Adequate Spacing and Touch Targets */}
            <div className="px-5 py-6 flex-1 flex flex-col gap-5 overflow-y-auto">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[11px] font-bold text-void-muted uppercase tracking-wider px-2">
                  Menu Navigation
                </span>
              </div>

              <nav className="flex flex-col gap-2" aria-label="Mobile Navigation Links">
                {siteConfig.mainNav.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
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
                          "h-4 w-4 transition-transform",
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
                  buttonVariants({ variant: "primary", size: "lg" }),
                  "w-full min-h-[48px] justify-center text-sm font-semibold shadow-glow-sm"
                )}
              >
                <span>Start Your Project</span>
                <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
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
        </div>
      )}
    </header>
  );
}
