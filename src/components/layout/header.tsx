"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  // Close mobile drawer upon route navigation
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll and handle Escape key when mobile menu is open
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };

    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-void-border/70 bg-void-black/85 backdrop-blur-xl transition-all">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Identity */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 focus:outline-none"
          aria-label="VOIDTECH SOLUTION Home"
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
                  "transition-colors hover:text-void-white focus-visible:text-electric-purple focus:outline-none py-1",
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
          <Link href="/#contact" tabIndex={-1} className="hidden sm:inline-flex">
            <Button size="sm" variant="glow">
              Start Your Project
            </Button>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="flex h-10 w-10 md:hidden items-center justify-center rounded-lg border border-void-border bg-void-surface text-void-light hover:text-white hover:border-electric-purple/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-purple"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop & Sheet */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 z-50 md:hidden bg-void-black/80 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        >
          <div
            id="mobile-nav-menu"
            className="absolute top-0 right-0 h-full w-4/5 max-w-sm border-l border-void-border/80 bg-void-dark p-6 shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Drawer"
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1 pb-4 border-b border-void-border/50">
                <span className="font-mono text-sm font-bold text-void-white">VOIDTECH SOLUTION</span>
                <span className="text-xs text-electric-purple font-mono">{siteConfig.tagline}</span>
              </div>

              <nav className="flex flex-col gap-3" aria-label="Mobile Navigation">
                {siteConfig.mainNav.map((item) => {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-void-light hover:bg-void-surface hover:text-white"
                      )}
                    >
                      <span>{item.title}</span>
                      <ArrowRight className="h-4 w-4 text-void-muted opacity-60" />
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-6 border-t border-void-border/60 flex flex-col gap-3">
              <Link href="/#contact" tabIndex={-1} onClick={() => setMobileMenuOpen(false)}>
                <Button size="md" variant="primary" className="w-full">
                  Start Your Project
                </Button>
              </Link>
              <p className="text-[11px] text-center text-void-muted">
                Premium Software Development Agency
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
