import type { ReactNode } from "react";

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
}

export function PublicPageHero({ sectionId, headingId, eyebrow, title, description, actions, asideLabel, aside, footer }: PublicPageHeroProps) {
  return (
    <section id={sectionId} className="public-page-hero relative overflow-hidden border-b border-void-border/60" aria-labelledby={headingId}>
      <div className="public-page-hero__ambient" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.82fr)] lg:gap-16 lg:px-8 lg:py-24">
        <div className="min-w-0">
          <span className="public-page-hero__eyebrow"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-electric-neon" aria-hidden="true" />{eyebrow}</span>
          <h1 id={headingId} className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-6xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-void-light sm:text-lg">{description}</p>
          {actions ? <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div> : null}
        </div>
        <aside className="public-page-hero__aside" aria-label={asideLabel}>
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-void-border/70 pb-4">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-void-muted">{asideLabel}</span>
            <span className="rounded-full border border-electric-purple/30 bg-electric-purple/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-electric-purple">VOIDTECH</span>
          </div>
          {aside}
        </aside>
      </div>
      {footer ? <div className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">{footer}</div> : null}
    </section>
  );
}
