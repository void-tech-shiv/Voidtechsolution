"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextValue {
  expandedItems: Set<string>;
  toggleItem: (value: string) => void;
  type?: "single" | "multiple";
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  collapsible?: boolean;
}

export function Accordion({
  type = "single",
  defaultValue,
  className,
  children,
  ...props
}: AccordionProps) {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(() => {
    if (!defaultValue) return new Set();
    if (Array.isArray(defaultValue)) return new Set(defaultValue);
    return new Set([defaultValue]);
  });

  const toggleItem = React.useCallback(
    (value: string) => {
      setExpandedItems((prev) => {
        const next = new Set(prev);
        if (next.has(value)) {
          next.delete(value);
        } else {
          if (type === "single") {
            next.clear();
          }
          next.add(value);
        }
        return next;
      });
    },
    [type]
  );

  return (
    <AccordionContext.Provider value={{ expandedItems, toggleItem, type }}>
      <div className={cn("space-y-3", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const AccordionItemContext = React.createContext<{ value: string; isExpanded: boolean } | null>(
  null
);

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    if (!context) {
      throw new Error("AccordionItem must be used within an Accordion");
    }

    const isExpanded = context.expandedItems.has(value);

    return (
      <AccordionItemContext.Provider value={{ value, isExpanded }}>
        <div
          ref={ref}
          className={cn(
            "rounded-xl border border-void-border/70 bg-void-surface/40 backdrop-blur-sm transition-all duration-200 overflow-hidden",
            isExpanded && "border-electric-purple/40 bg-void-surface/70 shadow-glow-xs",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  }
);
AccordionItem.displayName = "AccordionItem";

export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  iconClassName?: string;
}

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, iconClassName, children, ...props }, ref) => {
    const itemContext = React.useContext(AccordionItemContext);
    const accordionContext = React.useContext(AccordionContext);

    if (!itemContext || !accordionContext) {
      throw new Error("AccordionTrigger must be used within an AccordionItem");
    }

    const { value, isExpanded } = itemContext;
    const contentId = `accordion-content-${value}`;
    const triggerId = `accordion-trigger-${value}`;

    return (
      <button
        ref={ref}
        id={triggerId}
        type="button"
        aria-expanded={isExpanded}
        aria-controls={contentId}
        onClick={() => accordionContext.toggleItem(value)}
        className={cn(
          "flex w-full items-center justify-between p-5 text-left text-sm sm:text-base font-medium text-void-white transition-colors hover:text-electric-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-purple focus-visible:ring-offset-2 focus-visible:ring-offset-void-black",
          className
        )}
        {...props}
      >
        <span className="pr-4">{children}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-void-muted transition-transform duration-200",
            isExpanded && "rotate-180 text-electric-purple",
            iconClassName
          )}
          aria-hidden="true"
        />
      </button>
    );
  }
);
AccordionTrigger.displayName = "AccordionTrigger";

export type AccordionContentProps = React.HTMLAttributes<HTMLDivElement>;

export const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const itemContext = React.useContext(AccordionItemContext);

    if (!itemContext) {
      throw new Error("AccordionContent must be used within an AccordionItem");
    }

    const { value, isExpanded } = itemContext;
    const contentId = `accordion-content-${value}`;
    const triggerId = `accordion-trigger-${value}`;

    if (!isExpanded) {
      return null;
    }

    return (
      <div
        ref={ref}
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        className={cn(
          "px-5 pb-5 pt-0 text-sm leading-relaxed text-void-muted animate-fadeIn",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AccordionContent.displayName = "AccordionContent";
