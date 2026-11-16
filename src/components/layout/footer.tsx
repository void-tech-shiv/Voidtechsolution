"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { BrandLogo } from "@/components/ui/brand-logo";

export function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Hide public footer inside administrative portal routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const featuredServices = [
    { title: "Website Development", href: "/services" },
    { title: "App Development", href: "/services" },
    { title: "Custom API Development", href: "/services" },
    { title: "AI Automation & Workflows", href: "/services" },
    { title: "Autonomous AI Agents", href: "/services" },
    { title: "SaaS Development", href: "/services" },
  ];

  return (
    <footer className="w-full border-t border-void-border/80 bg-void-dark py-14 text-void-muted transition-colors">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand & Introduction Column */}
          <div className="flex flex-col gap-3.5 sm:col-span-2">
            <BrandLogo variant="footer" size="md" href="/" />
            <p className="max-w-md text-xs leading-relaxed text-void-muted">
              {siteConfig.description}
            </p>
            <div className="mt-2 flex flex-col gap-1 text-[11px] text-void-muted/80">
              <p>
                <span className="text-void-light">Commercial Intake:</span> Direct consultation via project brief
              </p>
              <p>
                <span className="text-void-light">Support & Enquiries:</span>{" "}
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="text-electric-purple hover:underline"
                >
                  {siteConfig.contactEmail}
                </a>
              </p>
              <p>
                <span className="text-void-light">Operations:</span> Distributed / Remote-First Global Engineering
              </p>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="flex flex-col gap-3">
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-void-white">
              Navigation
            </h4>
            <ul className="flex flex-col gap-2 text-xs" aria-label="Footer Navigation Links">
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

          {/* Service Capabilities */}
          <div className="flex flex-col gap-3">
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-void-white">
              Core Capabilities
            </h4>
            <ul className="flex flex-col gap-2 text-xs" aria-label="Footer Capabilities Links">
              {featuredServices.map((service, index) => (
                <li key={index}>
                  <Link
                    href={service.href}
                    className="hover:text-electric-purple transition-colors"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Governance & Connect */}
          <div className="flex flex-col gap-3">
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-void-white">
              Connect & Verify
            </h4>
            <p className="text-[11px] leading-relaxed text-void-muted">
              Official community channels and code repositories will be announced at public release.
            </p>
            <ul className="flex flex-col gap-2 text-xs pt-1" aria-label="Footer Verification Links">
              <li>
                <Link
                  href="/design-system"
                  className="font-mono text-[11px] text-electric-purple hover:underline"
                >
                  Inspect Design System Tokens &rarr;
                </Link>
              </li>
              <li>
                <Link
                  href="/api/health"
                  className="font-mono text-[11px] text-electric-purple hover:underline"
                >
                  System Health API &rarr;
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Metadata Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-void-border/50 pt-6 text-[11px] sm:flex-row">
          <p>&copy; {currentYear} VOIDTECH SOLUTION. All rights reserved.</p>
          <p className="text-void-muted/70">
            Engineered with Next.js 15 App Router, Strict TypeScript, and GSD Mission Control.
          </p>
        </div>
      </div>
    </footer>
  );
}
