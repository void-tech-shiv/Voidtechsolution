"use client";

import * as React from "react";
import { X, GitCompare, Check } from "lucide-react";


export interface RevisionDiffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  leftTitle?: string;
  leftData: Record<string, unknown> | null;
  rightTitle?: string;
  rightData: Record<string, unknown> | null;
  onRestore?: () => void;
  restoreLabel?: string;
}

export function RevisionDiffDialog({
  isOpen,
  onClose,
  title,
  leftTitle = "Published Snapshot",
  leftData,
  rightTitle = "Working Draft",
  rightData,
  onRestore,
  restoreLabel = "Apply Revision",
}: RevisionDiffDialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Compute all unique keys
  const allKeys = Array.from(
    new Set([
      ...Object.keys(leftData || {}),
      ...Object.keys(rightData || {}),
    ])
  ).sort();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="diff-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-void-dark border border-void-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-void-border/80 bg-void-black/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-void-purple/10 text-void-purple">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 id="diff-dialog-title" className="text-lg font-semibold text-void-light">
                {title}
              </h2>
              <p className="text-xs text-void-gray">
                Visual side-by-side comparison of content revisions and field-level changes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close diff viewer"
            className="p-1.5 rounded-lg text-void-gray hover:text-void-light hover:bg-void-border/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Column Labels */}
        <div className="grid grid-cols-2 px-6 py-2.5 bg-void-black/40 border-b border-void-border/60 text-xs font-mono uppercase tracking-wider text-void-gray">
          <div>{leftTitle}</div>
          <div className="text-void-purple">{rightTitle}</div>
        </div>

        {/* Diff Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 font-mono text-xs">
          {allKeys.length === 0 ? (
            <div className="text-center py-12 text-void-gray">
              No content attributes available for comparison.
            </div>
          ) : (
            allKeys.map((key) => {
              const leftVal = leftData ? leftData[key] : undefined;
              const rightVal = rightData ? rightData[key] : undefined;
              const isDifferent =
                JSON.stringify(leftVal) !== JSON.stringify(rightVal);

              return (
                <div
                  key={key}
                  className={`p-3 rounded-lg border transition-colors ${
                    isDifferent
                      ? "bg-void-purple/5 border-void-purple/30"
                      : "bg-void-black/30 border-void-border/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-void-light">{key}</span>
                    {isDifferent && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Modified
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-void-gray break-words">
                      {leftVal !== undefined
                        ? typeof leftVal === "object"
                          ? JSON.stringify(leftVal, null, 2)
                          : String(leftVal)
                        : <span className="italic opacity-50">Empty</span>}
                    </div>
                    <div
                      className={`break-words ${
                        isDifferent
                          ? "text-void-purple font-medium"
                          : "text-void-gray"
                      }`}
                    >
                      {rightVal !== undefined
                        ? typeof rightVal === "object"
                          ? JSON.stringify(rightVal, null, 2)
                          : String(rightVal)
                        : <span className="italic opacity-50">Empty</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-void-border/80 bg-void-black/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg text-void-gray hover:text-void-light hover:bg-void-border/40 transition-colors"
          >
            Dismiss
          </button>
          {onRestore && (
            <button
              type="button"
              onClick={onRestore}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-void-purple text-white hover:bg-void-purple/90 transition-colors shadow-lg shadow-void-purple/20"
            >
              <Check className="w-4 h-4" />
              {restoreLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
