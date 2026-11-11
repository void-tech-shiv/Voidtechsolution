import Link from "next/link";
import { siteConfig, servicesRegistry } from "@/config/site";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute inset-0 bg-void-glow-radial opacity-60"
        aria-hidden="true"
      />

      <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Milestone Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-electric-purple/40 bg-electric-purple/10 px-4 py-1.5 text-xs font-mono text-electric-purple mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-electric-neon opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-electric-purple" />
            </span>
            <span>PHASE 1 FOUNDATION ESTABLISHED</span>
          </div>

          {/* Agency Brand Title */}
          <h1 className="font-mono text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-none">
            VOIDTECH <span className="text-electric-purple">SOLUTION</span>
          </h1>

          <p className="mt-4 text-xl font-medium tracking-wide text-electric-neon font-sans">
            {siteConfig.tagline}
          </p>

          <p className="mt-6 text-base leading-relaxed text-void-muted sm:text-lg">
            Engineering foundation established for an elite software development agency.
            Next.js App Router, strict TypeScript, PostgreSQL data layer with Prisma ORM,
            and high-assurance governance via GSD Mission Control.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/api/health" tabIndex={-1}>
              <Button variant="glow" size="lg">
                Inspect Health API &rarr;
              </Button>
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={-1}
            >
              <Button variant="secondary" size="lg">
                Architecture Blueprint
              </Button>
            </a>
          </div>
        </div>

        {/* Registered Services Architecture Overview */}
        <div className="mt-24">
          <div className="mb-10 text-center">
            <h2 className="font-mono text-2xl font-bold tracking-tight text-void-white sm:text-3xl">
              Registered Business Services (18 Capabilities)
            </h2>
            <p className="mt-2 text-sm text-void-muted">
              Pre-registered service specifications ready for implementation in subsequent phases.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {servicesRegistry.map((service, index) => (
              <Card key={service.id} glow className="group">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-electric-purple">
                      #{String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="rounded bg-void-border/60 px-2 py-0.5 text-[10px] font-mono text-void-muted uppercase">
                      {service.category.replace(/_/g, " ")}
                    </span>
                  </div>
                  <CardTitle>{service.title}</CardTitle>
                  <CardDescription>{service.shortDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {service.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md border border-void-border bg-void-surface px-2 py-0.5 text-[11px] font-mono text-void-light"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

