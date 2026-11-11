import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const featuredServices = [
    { title: "Website Development", href: "/services" },
    { title: "App Development", href: "/services" },
    { title: "Custom API Development", href: "/services" },
    { title: "AI Automation & Workflows", href: "/services" },
    { title: "Autonomous AI Agents", href: "/services" },
    { title: "SaaS Development", href: "/services" },
  ];

  const socialLinks = [
    { title: "GitHub", href: "https://github.com", placeholderNote: "(Official Repo)" },
    { title: "LinkedIn", href: "https://linkedin.com", placeholderNote: "(Company Page)" },
    { title: "X (Twitter)", href: "https://x.com", placeholderNote: "(Announcements)" },
  ];

  return (
    <footer className="w-full border-t border-void-border/80 bg-void-dark py-14 text-void-muted transition-colors">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand & Introduction Column */}
          <div className="flex flex-col gap-3.5 sm:col-span-2">
            <Link href="/" className="flex items-center gap-2 group w-fit" aria-label="VOIDTECH SOLUTION Home">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-electric-violet text-white font-mono font-bold text-xs shadow-glow-xs">
                V
              </div>
              <span className="font-mono text-sm font-bold text-void-white tracking-wider group-hover:text-electric-purple transition-colors">
                VOIDTECH SOLUTION
              </span>
            </Link>
            <p className="text-xs text-electric-purple font-mono font-medium tracking-wide">
              {siteConfig.tagline}
            </p>
            <p className="max-w-md text-xs leading-relaxed text-void-muted">
              {siteConfig.description}
            </p>
            <div className="mt-2 flex flex-col gap-1 text-[11px] text-void-muted/80">
              <p>
                <span className="text-void-light">Commercial Intake:</span>{" "}
                <a href={`mailto:${siteConfig.contactEmail}`} className="text-electric-purple hover:underline">
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
            <ul className="flex flex-col gap-2 text-xs" aria-label="Footer Social Links">
              {socialLinks.map((social) => (
                <li key={social.title}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-electric-purple transition-colors"
                  >
                    <span>{social.title}</span>
                    <span className="text-[10px] text-void-muted/60">{social.placeholderNote}</span>
                  </a>
                </li>
              ))}
              <li className="pt-2">
                <Link
                  href="/design-system"
                  className="font-mono text-[11px] text-electric-purple hover:underline"
                >
                  Inspect Design System &rarr;
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
