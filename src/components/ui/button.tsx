import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "glow";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const buttonBaseStyles =
  "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-purple/70 focus-visible:ring-offset-2 focus-visible:ring-offset-void-black disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer tracking-wide";

export const buttonVariantsMap = {
  primary:
    "bg-gradient-to-r from-electric-violet to-electric-purple text-white shadow-glow-sm hover:shadow-glow-md hover:brightness-110 active:scale-[0.98] border border-electric-purple/40",
  secondary:
    "bg-void-charcoal text-void-light border border-void-border hover:border-electric-purple/40 hover:text-white hover:bg-void-surface active:scale-[0.98]",
  outline:
    "border border-electric-purple/60 text-electric-purple hover:bg-electric-purple/10 active:bg-electric-purple/20 active:scale-[0.98]",
  ghost:
    "text-void-muted hover:text-void-white hover:bg-void-surface/80 active:bg-void-surface",
  glow:
    "bg-void-charcoal text-white border border-electric-purple shadow-glow-md hover:shadow-glow-lg hover:border-electric-neon active:scale-[0.98]",
};

export const buttonSizesMap = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: keyof typeof buttonVariantsMap;
  size?: keyof typeof buttonSizesMap;
  className?: string;
} = {}) {
  return cn(buttonBaseStyles, buttonVariantsMap[variant], buttonSizesMap[size], className);
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={buttonVariants({ variant, size, className })}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </span>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export const PrimaryButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant">>(
  (props, ref) => <Button ref={ref} variant="primary" {...props} />
);
PrimaryButton.displayName = "PrimaryButton";

export const SecondaryButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant">>(
  (props, ref) => <Button ref={ref} variant="secondary" {...props} />
);
SecondaryButton.displayName = "SecondaryButton";

export const OutlineButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant">>(
  (props, ref) => <Button ref={ref} variant="outline" {...props} />
);
OutlineButton.displayName = "OutlineButton";

export const GhostButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant">>(
  (props, ref) => <Button ref={ref} variant="ghost" {...props} />
);
GhostButton.displayName = "GhostButton";

export const GlowButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant">>(
  (props, ref) => <Button ref={ref} variant="glow" {...props} />
);
GlowButton.displayName = "GlowButton";
