import * as React from "react";
import { cn } from "@/lib/utils";

// -----------------------------------------------------------------------------
// FormLabel Component
// -----------------------------------------------------------------------------
export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "block text-xs font-mono font-medium uppercase tracking-wider text-void-light mb-1.5",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-status-error ml-1" aria-hidden="true">*</span>}
    </label>
  )
);
FormLabel.displayName = "FormLabel";

// -----------------------------------------------------------------------------
// Input Component
// -----------------------------------------------------------------------------
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, helperText, required, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full">
        {label && (
          <FormLabel htmlFor={inputId} required={required}>
            {label}
          </FormLabel>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={cn(
            "w-full rounded-lg border bg-void-surface px-3.5 py-2.5 text-sm text-void-white placeholder:text-void-muted transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-purple/60 focus-visible:border-electric-purple",
            "disabled:opacity-50 disabled:pointer-events-none disabled:bg-void-dark",
            error ? "border-status-error focus-visible:ring-status-error/40" : "border-void-border hover:border-void-muted/40",
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-status-error" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-1.5 text-xs text-void-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// -----------------------------------------------------------------------------
// Textarea Component
// -----------------------------------------------------------------------------
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, required, id, rows = 4, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    return (
      <div className="w-full">
        {label && (
          <FormLabel htmlFor={textareaId} required={required}>
            {label}
          </FormLabel>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={cn(
            "w-full rounded-lg border bg-void-surface px-3.5 py-2.5 text-sm text-void-white placeholder:text-void-muted transition-colors duration-150 resize-y",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-purple/60 focus-visible:border-electric-purple",
            "disabled:opacity-50 disabled:pointer-events-none disabled:bg-void-dark",
            error ? "border-status-error focus-visible:ring-status-error/40" : "border-void-border hover:border-void-muted/40",
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-status-error" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-1.5 text-xs text-void-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// -----------------------------------------------------------------------------
// Select Component
// -----------------------------------------------------------------------------
export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, required, options = [], id, children, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    return (
      <div className="w-full">
        {label && (
          <FormLabel htmlFor={selectId} required={required}>
            {label}
          </FormLabel>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              "w-full appearance-none rounded-lg border bg-void-surface px-3.5 py-2.5 text-sm text-void-white transition-colors duration-150 pr-10",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-purple/60 focus-visible:border-electric-purple",
              "disabled:opacity-50 disabled:pointer-events-none disabled:bg-void-dark",
              error ? "border-status-error focus-visible:ring-status-error/40" : "border-void-border hover:border-void-muted/40",
              className
            )}
            {...props}
          >
            {children ||
              options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-void-charcoal text-white">
                  {opt.label}
                </option>
              ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-void-muted">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-status-error" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-1.5 text-xs text-void-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

// -----------------------------------------------------------------------------
// Checkbox Component
// -----------------------------------------------------------------------------
export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;

    return (
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={cn(
            "h-4 w-4 rounded border-void-border bg-void-surface text-electric-purple accent-electric-purple transition duration-150 cursor-pointer mt-0.5",
            "focus-visible:ring-2 focus-visible:ring-electric-purple/70 focus-visible:ring-offset-2 focus-visible:ring-offset-void-black",
            className
          )}
          {...props}
        />
        <div className="flex flex-col">
          <label htmlFor={checkboxId} className="text-sm font-medium text-void-light cursor-pointer select-none">
            {label}
          </label>
          {description && (
            <p className="text-xs text-void-muted">{description}</p>
          )}
          {error && (
            <p className="mt-1 text-xs text-status-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
