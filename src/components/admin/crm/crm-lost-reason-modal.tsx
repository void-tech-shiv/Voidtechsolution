"use client";

import * as React from "react";
import { AlertCircle, X } from "lucide-react";

interface CrmLostReasonModalProps {
  isOpen: boolean;
  leadName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

const PRESET_REASONS = [
  "Budget constraint / Pricing mismatch",
  "Competitor selected",
  "Project postponed or canceled",
  "Client unresponsive after follow-ups",
  "Technical scope mismatch",
];

export function CrmLostReasonModal({
  isOpen,
  leadName,
  onConfirm,
  onCancel,
}: CrmLostReasonModalProps) {
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setReason("");
      setError("");
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("A documented reason is mandatory when marking a lead as LOST.");
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lost-reason-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-md p-6 bg-void-dark border border-void-border rounded-2xl shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <h3 id="lost-reason-title" className="text-base font-semibold text-void-white">
              Mark Lead as Lost
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-void-muted hover:text-void-white hover:bg-void-surface transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-void-muted">
          Business policy requires a documented reason for moving{" "}
          <span className="font-semibold text-void-light">{leadName}</span> to{" "}
          <span className="text-rose-400 font-medium">LOST</span>. This feedback assists in
          deal post-mortems and pricing calibrations.
        </p>

        {/* Preset Reason Chips */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-void-light">Quick Presets:</label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_REASONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setReason(preset);
                  setError("");
                }}
                className="text-[11px] px-2.5 py-1 rounded-md bg-void-surface border border-void-subtle text-void-light hover:text-void-white hover:border-void-border transition-colors text-left"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="lost-reason-text" className="text-xs font-medium text-void-light block mb-1">
              Lost Reason Details <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="lost-reason-text"
              ref={textareaRef}
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              placeholder="Explain why this deal did not close..."
              className="w-full text-xs p-3 rounded-lg bg-void-surface border border-void-border text-void-white placeholder:text-void-muted focus:outline-none focus:border-rose-500/50 resize-none"
            />
            {error && <p className="text-[11px] text-rose-400 mt-1">{error}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-xs font-medium text-void-light bg-void-surface hover:bg-void-surface/80 border border-void-subtle transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-sm"
            >
              Confirm Lost
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

