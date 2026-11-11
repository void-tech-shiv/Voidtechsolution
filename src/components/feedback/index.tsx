import * as React from "react";
import { AlertCircle, FolderOpen, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// -----------------------------------------------------------------------------
// LoadingState Component
// -----------------------------------------------------------------------------
export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({
  className,
  message = "Loading...",
  size = "md",
  ...props
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center text-void-muted",
        className
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      <svg
        className={cn("animate-spin text-electric-purple mb-3", sizeClasses[size])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-80"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {message && <p className="text-xs font-mono text-void-light">{message}</p>}
    </div>
  );
}

// -----------------------------------------------------------------------------
// EmptyState Component
// -----------------------------------------------------------------------------
export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  className,
  title,
  description,
  icon,
  action,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-void-border/80 bg-void-surface/30 p-10 text-center",
        className
      )}
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-void-surface border border-void-border text-void-muted mb-4">
        {icon || <FolderOpen className="h-6 w-6 text-electric-purple/70" />}
      </div>
      <h3 className="font-mono text-base font-semibold text-void-white mb-1.5">{title}</h3>
      <p className="max-w-sm text-xs text-void-muted leading-relaxed mb-6">{description}</p>
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// ErrorState Component
// -----------------------------------------------------------------------------
export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  className,
  title = "Something went wrong",
  message,
  onRetry,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-status-error-border bg-status-error-bg p-8 text-center",
        className
      )}
      role="alert"
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-error/15 text-status-error mb-4">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="font-mono text-base font-semibold text-void-white mb-1.5">{title}</h3>
      <p className="max-w-md text-xs text-status-error/90 leading-relaxed mb-6">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="border-status-error text-status-error hover:bg-status-error/10"
          onClick={onRetry}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
}

