import * as React from "react";
import Link from "next/link";
import { Check, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export function Card({ className, glow = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-void-border/80 bg-void-card-gradient backdrop-blur-md p-6 text-void-light transition-all duration-300",
        glow && "hover:border-electric-purple/50 hover:shadow-glow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export const BaseCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-void-border bg-void-charcoal/90 p-6 text-void-light shadow-sm transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
BaseCard.displayName = "BaseCard";

export const GlassCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glow = true, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative rounded-xl border border-void-border/80 bg-void-card-gradient backdrop-blur-xl p-6 text-void-light shadow-glass-inner transition-all duration-300 void-card-hover",
        glow && "hover:border-electric-purple/50 hover:shadow-glow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
GlassCard.displayName = "GlassCard";

export interface ServiceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  category: string;
  description: string;
  technologies?: string[];
  icon?: React.ReactNode;
  orderNumber?: number | string;
  onClickCTA?: () => void;
}

export const ServiceCard = React.forwardRef<HTMLDivElement, ServiceCardProps>(
  (
    {
      className,
      title,
      category,
      description,
      technologies = [],
      icon,
      orderNumber,
      onClickCTA,
      ...props
    },
    ref
  ) => (
    <GlassCard
      ref={ref}
      className={cn("group flex flex-col justify-between h-full", className)}
      {...props}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-void-surface border border-electric-purple/30 text-electric-purple group-hover:scale-105 group-hover:border-electric-purple group-hover:shadow-glow-sm transition-all">
                {icon}
              </div>
            )}
            {orderNumber && (
              <span className="font-mono text-xs font-bold text-electric-purple">
                #{String(orderNumber).padStart(2, "0")}
              </span>
            )}
          </div>
          <span className="rounded-full border border-void-border bg-void-surface/90 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-void-muted">
            {category.replace(/_/g, " ")}
          </span>
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-void-white group-hover:text-electric-purple transition-colors mb-2">
          {title}
        </h3>
        <p className="text-sm text-void-muted leading-relaxed line-clamp-3 mb-6">
          {description}
        </p>
      </div>

      <div className="pt-4 border-t border-void-border/50">
        {technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {technologies.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="rounded-md border border-void-border bg-void-surface/60 px-2 py-0.5 text-[11px] font-mono text-void-light"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
        {onClickCTA && (
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-between text-xs text-electric-purple hover:text-white group/btn"
            onClick={onClickCTA}
          >
            <span>Learn More & Scope</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
          </Button>
        )}
      </div>
    </GlassCard>
  )
);
ServiceCard.displayName = "ServiceCard";

export interface PricingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tierName: string;
  tagline: string;
  price: string;
  billingPeriod?: string;
  isPopular?: boolean;
  features: string[];
  ctaText?: string;
  href?: string;
  onSelectTier?: () => void;
}

export const PricingCard = React.forwardRef<HTMLDivElement, PricingCardProps>(
  (
    {
      className,
      tierName,
      tagline,
      price,
      billingPeriod = "per project",
      isPopular = false,
      features,
      ctaText = "Choose Plan",
      href,
      onSelectTier,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        "relative flex flex-col justify-between rounded-xl p-8 transition-all duration-300",
        isPopular
          ? "border-2 border-electric-purple bg-void-surface-elevated/90 shadow-glow-md"
          : "border border-void-border/80 bg-void-card-gradient backdrop-blur-md hover:border-electric-purple/40",
        className
      )}
      {...props}
    >
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-electric-violet to-electric-purple px-4 py-1 text-[11px] font-mono font-bold tracking-wider text-white uppercase shadow-glow-sm">
          Most Popular
        </div>
      )}

      <div>
        <div className="mb-6">
          <h3 className="font-mono text-xl font-bold text-void-white">{tierName}</h3>
          <p className="mt-1 text-xs text-void-muted leading-relaxed">{tagline}</p>
        </div>

        <div className="mb-8 flex items-baseline gap-1.5">
          <span className="font-mono text-4xl font-extrabold text-white tracking-tight">{price}</span>
          <span className="text-xs text-void-muted">/ {billingPeriod}</span>
        </div>

        <ul className="mb-8 space-y-3 text-xs text-void-light" aria-label={`Features for ${tierName}`}>
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <Check className="h-4 w-4 shrink-0 text-electric-purple mt-0.5" aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {href ? (
        <Link href={href} className="w-full">
          <Button
            variant={isPopular ? "primary" : "secondary"}
            size="lg"
            className="w-full"
          >
            {ctaText}
          </Button>
        </Link>
      ) : (
        <Button
          variant={isPopular ? "primary" : "secondary"}
          size="lg"
          className="w-full"
          onClick={onSelectTier}
        >
          {ctaText}
        </Button>
      )}
    </div>
  )
);
PricingCard.displayName = "PricingCard";

export interface ProjectCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  client: string;
  industry: string;
  summary: string;
  techStack: string[];
  metrics?: { label: string; value: string }[];
  liveUrl?: string;
}

export const ProjectCard = React.forwardRef<HTMLDivElement, ProjectCardProps>(
  (
    {
      className,
      title,
      client,
      industry,
      summary,
      techStack,
      metrics = [],
      liveUrl,
      ...props
    },
    ref
  ) => (
    <GlassCard
      ref={ref}
      className={cn("group flex flex-col justify-between overflow-hidden", className)}
      {...props}
    >
      <div>
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-mono font-medium text-electric-purple">{client}</span>
          <span className="rounded bg-void-surface px-2 py-0.5 text-[10px] font-mono text-void-muted uppercase">
            {industry}
          </span>
        </div>
        <h3 className="text-lg font-bold text-void-white group-hover:text-electric-purple transition-colors mb-2">
          {title}
        </h3>
        <p className="text-sm text-void-muted leading-relaxed line-clamp-3 mb-6">
          {summary}
        </p>

        {metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-6 p-3 rounded-lg bg-void-black/60 border border-void-border/50">
            {metrics.map((metric, i) => (
              <div key={i} className="flex flex-col">
                <span className="font-mono text-sm font-bold text-white">{metric.value}</span>
                <span className="text-[10px] text-void-muted uppercase">{metric.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-void-border/50 flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {techStack.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="rounded border border-void-border bg-void-surface/50 px-2 py-0.5 text-[10px] font-mono text-void-light"
            >
              {tech}
            </span>
          ))}
        </div>
        {liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-electric-purple hover:underline"
            aria-label={`View live site for ${title}`}
          >
            <span>Live</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </GlassCard>
  )
);
ProjectCard.displayName = "ProjectCard";

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-4 flex flex-col space-y-1.5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold tracking-tight text-void-white group-hover:text-electric-purple transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-void-muted leading-relaxed", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("pt-0", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-6 flex items-center pt-4 border-t border-void-border/50", className)} {...props}>
      {children}
    </div>
  );
}
