import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-void-border/70 bg-void-black/80 backdrop-blur-xl transition-all">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Identity */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 focus:outline-none"
          aria-label="VOIDTECH SOLUTION Home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-electric-violet to-electric-purple shadow-glow-sm group-hover:shadow-glow-md transition-all">
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

        {/* Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-6 text-sm font-medium text-void-muted"
          aria-label="Main Navigation"
        >
          {siteConfig.mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-void-white hover:text-electric-purple focus-visible:text-electric-purple focus:outline-none"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        {/* Action Button & Phase Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-electric-purple/30 bg-electric-purple/10 px-2.5 py-1 text-[11px] font-mono text-electric-purple">
            <span className="h-1.5 w-1.5 rounded-full bg-electric-purple animate-pulse" />
            Phase 1 Foundation
          </div>
          <Link href="/contact" tabIndex={-1}>
            <Button size="sm" variant="glow">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
