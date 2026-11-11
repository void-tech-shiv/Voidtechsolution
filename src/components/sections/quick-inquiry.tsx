"use client";

import * as React from "react";
import { Mail, ArrowRight, ShieldCheck, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickInquiryProps {
  contactEmail: string;
}

export function QuickInquiry({ contactEmail }: QuickInquiryProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      id="contact"
      className="relative overflow-hidden rounded-2xl border border-electric-purple/40 bg-void-card-gradient p-8 sm:p-12 shadow-glow-md backdrop-blur-xl"
    >
      {/* Background ambient neon glow */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-electric-purple/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-electric-violet/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        {/* Section Sub-badge */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-electric-purple/30 bg-electric-purple/10 px-3.5 py-1 text-xs font-mono font-medium text-electric-purple">
          <span className="h-1.5 w-1.5 rounded-full bg-electric-neon" />
          <span>DIRECT PROJECT CONSULTATION</span>
        </div>

        {/* Headline */}
        <h2 className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Have an Idea? Let&apos;s Build It.
        </h2>

        {/* Supporting Copy */}
        <p className="mt-4 text-base leading-relaxed text-void-light sm:text-lg">
          Tell us what you&apos;re planning. Let&apos;s explore how the right technology can bring it to life.
        </p>

        {/* Primary Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href={`mailto:${contactEmail}?subject=New%20Project%20Inquiry%20-%20VoidTech%20Solution`}
            className="inline-flex"
          >
            <Button size="lg" variant="glow" className="gap-2">
              <span>Start Your Project</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </a>

          <button
            type="button"
            onClick={handleCopyEmail}
            className="inline-flex items-center gap-2 rounded-lg border border-void-border/90 bg-void-surface px-5 py-3 text-sm font-medium text-void-white transition-colors hover:border-electric-purple/50 hover:bg-void-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-purple"
          >
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                <span className="text-emerald-400">Email Copied!</span>
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 text-electric-purple" aria-hidden="true" />
                <span>Copy Direct Email</span>
              </>
            )}
          </button>
        </div>

        {/* Service Assurance Guarantees */}
        <div className="mt-10 grid grid-cols-1 gap-4 border-t border-void-border/50 pt-8 sm:grid-cols-3">
          <div className="flex items-center justify-center gap-2 text-xs text-void-muted">
            <Clock className="h-4 w-4 text-electric-purple shrink-0" aria-hidden="true" />
            <span>24-Hour Scoping Turnaround</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-void-muted">
            <ShieldCheck className="h-4 w-4 text-electric-purple shrink-0" aria-hidden="true" />
            <span>Complete Source Code Ownership</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-void-muted">
            <CheckCircle className="h-4 w-4 text-electric-purple shrink-0" aria-hidden="true" />
            <span>Transparent Milestone Pricing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
