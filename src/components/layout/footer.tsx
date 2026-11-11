import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-void-border/70 bg-void-dark py-12 text-void-muted transition-colors">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="flex flex-col gap-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-electric-violet text-white font-mono font-bold text-xs">
                V
              </div>
              <span className="font-mono text-sm font-bold text-void-white tracking-wider">
                VOIDTECH SOLUTION
              </span>
            </div>
            <p className="text-xs text-electric-purple font-medium tracking-wide">
              {siteConfig.tagline}
            </p>
            <p className="max-w-sm text-xs leading-relaxed text-void-muted">
              {siteConfig.description}
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-2.5">
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-void-white">
              Navigation
            </h4>
            <ul className="flex flex-col gap-2 text-xs">
              {siteConfig.mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="hover:text-electric-purple transition-colors"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Foundation & Governance */}
          <div className="flex flex-col gap-2.5">
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-void-white">
              Architecture
            </h4>
            <ul className="flex flex-col gap-2 text-xs">
              <li>
                <span className="text-void-light">Stack:</span> Next.js 15 + Prisma + PostgreSQL
              </li>
              <li>
                <span className="text-void-light">Styling:</span> Tailwind CSS + Glassmorphism
              </li>
              <li>
                <span className="text-void-light">Governance:</span> GSD Mission Control
              </li>
              <li>
                <Link
                  href="/api/health"
                  className="text-electric-purple hover:underline"
                >
                  System Health API &rarr;
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-void-border/40 pt-6 text-[11px] sm:flex-row">
          <p>&copy; {currentYear} VOIDTECH SOLUTION. All rights reserved.</p>
          <p className="text-void-muted/80">
            Engineered with strict TypeScript, App Router, and high-assurance architecture.
          </p>
        </div>
      </div>
    </footer>
  );
}
