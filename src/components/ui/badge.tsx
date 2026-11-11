import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "purple" | "success" | "warning" | "error" | "outline";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center font-mono font-medium rounded-full transition-colors select-none";

  const variants = {
    default:
      "border border-void-border bg-void-surface text-void-light",
    purple:
      "border border-electric-purple/35 bg-electric-purple/15 text-electric-purple shadow-glow-xs",
    success:
      "border border-status-success-border bg-status-success-bg text-status-success",
    warning:
      "border border-status-warning-border bg-status-warning-bg text-status-warning",
    error:
      "border border-status-error-border bg-status-error-bg text-status-error",
    outline:
      "border border-void-border/80 text-void-muted bg-transparent",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
  };

  const dotColors = {
    default: "bg-void-muted",
    purple: "bg-electric-neon animate-pulse",
    success: "bg-status-success",
    warning: "bg-status-warning",
    error: "bg-status-error",
    outline: "bg-void-light",
  };

  return (
    <span
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColors[variant])}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}

