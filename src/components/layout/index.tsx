import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// -----------------------------------------------------------------------------
// Container Component
// -----------------------------------------------------------------------------
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "narrow" | "wide" | "full";
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = "default", children, ...props }, ref) => {
    const sizeClasses = {
      narrow: "max-w-4xl",
      default: "max-w-[1440px]",
      wide: "max-w-[1600px]",
      full: "max-w-full",
    };

    return (
      <div
        ref={ref}
        className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12", sizeClasses[size], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Container.displayName = "Container";

// -----------------------------------------------------------------------------
// Section Component
// -----------------------------------------------------------------------------
export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?: "sm" | "md" | "lg" | "none";
}

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, spacing = "md", children, ...props }, ref) => {
    const spacingClasses = {
      none: "py-0",
      sm: "py-10 md:py-16",
      md: "py-16 md:py-24 lg:py-28",
      lg: "py-24 md:py-32 lg:py-40",
    };

    return (
      <section
        ref={ref}
        className={cn("relative w-full overflow-hidden", spacingClasses[spacing], className)}
        {...props}
      >
        {children}
      </section>
    );
  }
);
Section.displayName = "Section";

// -----------------------------------------------------------------------------
// SectionHeading Component
// -----------------------------------------------------------------------------
export interface SectionHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  badge?: string;
  title: string;
  highlightedText?: string;
  description?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  className,
  badge,
  title,
  highlightedText,
  description,
  align = "center",
  ...props
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col mb-12 md:mb-16",
        align === "center" ? "items-center text-center mx-auto max-w-3xl" : "items-start text-left max-w-2xl",
        className
      )}
      {...props}
    >
      {badge && (
        <Badge variant="purple" size="md" dot className="mb-4">
          {badge}
        </Badge>
      )}

      <h2 className="font-mono text-3xl font-bold tracking-tight text-void-white sm:text-4xl md:text-5xl leading-tight">
        {title}{" "}
        {highlightedText && (
          <span className="text-electric-purple">{highlightedText}</span>
        )}
      </h2>

      {description && (
        <p className="mt-4 text-sm sm:text-base text-void-muted leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

