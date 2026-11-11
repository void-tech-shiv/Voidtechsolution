import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Clock,
  ShieldCheck,
  Mail,
  Globe2,
  Lock,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { ContactEnquiryForm } from "@/components/sections/contact-enquiry-form";

export const metadata: Metadata = {
  title: "Contact Us & Project Consultation — VOIDTECH SOLUTION",
  description:
    "Connect directly with VOIDTECH SOLUTION engineers. Submit your project requirements, request technical scoping, or inquire about custom software development.",
  openGraph: {
    title: "Contact Us & Project Consultation — VOIDTECH SOLUTION",
    description:
      "Connect directly with VOIDTECH SOLUTION engineers. Submit your project requirements, request technical scoping, or inquire about custom software development.",
    url: `${siteConfig.url}/contact`,
    siteName: siteConfig.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us & Project Consultation — VOIDTECH SOLUTION",
    description:
      "Connect directly with VOIDTECH SOLUTION engineers. Submit your project requirements, request technical scoping, or inquire about custom software development.",
  },
  alternates: {
    canonical: `${siteConfig.url}/contact`,
  },
};

export default function ContactPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute inset-0 bg-void-glow-radial opacity-40"
        aria-hidden="true"
      />

      {/* ========================================================================= */}
      {/* SECTION 1: HERO                                                           */}
      {/* ========================================================================= */}
      <section
        className="relative mx-auto max-w-7xl px-4 pt-20 pb-12 sm:px-6 sm:pt-28 sm:pb-16 lg:px-8 text-center"
        aria-labelledby="contact-hero-headline"
      >
        <div className="mx-auto max-w-4xl">
          <Badge
            variant="outline"
            className="mb-6 border-electric-purple/40 bg-electric-purple/10 text-electric-purple font-mono text-xs px-4 py-1.5 shadow-glow-xs"
          >
            DIRECT ENGINEERING CONSULTATION &bull; TECHNICAL DISCOVERY
          </Badge>

          <h1
            id="contact-hero-headline"
            className="font-mono text-4xl font-extrabold tracking-tight text-white sm:text-6xl leading-tight"
          >
            Let&apos;s Build Something{" "}
            <span className="bg-gradient-to-r from-electric-purple via-electric-violet to-electric-neon bg-clip-text text-transparent">
              Exceptional.
            </span>
          </h1>

          <p className="mt-6 text-base leading-relaxed text-void-light sm:text-lg max-w-2xl mx-auto">
            Connect directly with our engineering team. Whether you need a high-converting web application, multi-tenant SaaS, custom API, or autonomous AI automation, we provide direct architectural scoping and transparent project estimates.
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: AGENCY AVAILABILITY & CONSULTATION GUIDELINES                  */}
      {/* ========================================================================= */}
      <section
        className="relative mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8"
        aria-label="Agency Availability and Scoping Standards"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-void-border/80 bg-void-surface/50 p-5 backdrop-blur-md">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-electric-purple/20 border border-electric-purple/40 text-electric-purple mb-3">
              <Globe2 className="h-4 w-4" />
            </div>
            <h2 className="font-mono text-xs font-bold text-white mb-1 uppercase tracking-wider">
              Operating Model
            </h2>
            <p className="text-xs text-void-muted leading-relaxed">
              Distributed, remote-first software engineering team delivering worldwide.
            </p>
          </div>

          <div className="rounded-2xl border border-void-border/80 bg-void-surface/50 p-5 backdrop-blur-md">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-electric-purple/20 border border-electric-purple/40 text-electric-purple mb-3">
              <Clock className="h-4 w-4" />
            </div>
            <h2 className="font-mono text-xs font-bold text-white mb-1 uppercase tracking-wider">
              Working Hours
            </h2>
            <p className="text-xs text-void-muted leading-relaxed">
              Mon – Sat: 9:00 AM – 7:00 PM IST (Dedicated sprint overlap windows).
            </p>
          </div>

          <div className="rounded-2xl border border-void-border/80 bg-void-surface/50 p-5 backdrop-blur-md">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-electric-purple/20 border border-electric-purple/40 text-electric-purple mb-3">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h2 className="font-mono text-xs font-bold text-white mb-1 uppercase tracking-wider">
              Scoping Review
            </h2>
            <p className="text-xs text-void-muted leading-relaxed">
              We review every enquiry and respond as soon as possible with a detailed technical assessment.
            </p>
          </div>

          <div className="rounded-2xl border border-void-border/80 bg-void-surface/50 p-5 backdrop-blur-md">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-electric-purple/20 border border-electric-purple/40 text-electric-purple mb-3">
              <Lock className="h-4 w-4" />
            </div>
            <h2 className="font-mono text-xs font-bold text-white mb-1 uppercase tracking-wider">
              Confidentiality
            </h2>
            <p className="text-xs text-void-muted leading-relaxed">
              A non-disclosure agreement (NDA) can be discussed and signed upon request before confidential project materials are shared.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: MULTI-STEP ENQUIRY FORM                                        */}
      {/* ========================================================================= */}
      <section
        id="enquiry-form"
        className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"
        aria-labelledby="enquiry-form-headline"
      >
        <div className="mb-8 text-center">
          <Badge variant="outline" className="mb-3">
            TECHNICAL DISCOVERY
          </Badge>
          <h2
            id="enquiry-form-headline"
            className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-white"
          >
            Project Scoping & Requirement Intake
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-void-muted max-w-xl mx-auto">
            Complete the 3-step intake below. If you arrived from the Pricing Calculator, your selected scope is pre-populated.
          </p>
        </div>

        {/* Suspense wrapper for useSearchParams in Next.js App Router */}
        <Suspense
          fallback={
            <div className="rounded-2xl border border-void-border/80 bg-void-card-gradient p-12 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-electric-purple border-t-transparent" />
              <p className="font-mono text-xs text-void-muted">Loading Project Intake Form...</p>
            </div>
          }
        >
          <ContactEnquiryForm />
        </Suspense>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: DIRECT COMMUNICATION ALTERNATIVES                              */}
      {/* ========================================================================= */}
      <section
        className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 border-t border-void-border/60"
        aria-label="Direct Communication Channels"
      >
        <div className="mx-auto max-w-3xl rounded-3xl border border-void-border/80 bg-void-card-gradient p-8 text-center backdrop-blur-md">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-electric-purple/20 border border-electric-purple/40 text-electric-purple">
            <Mail className="h-6 w-6" />
          </div>
          <h2 className="font-mono text-xl sm:text-2xl font-bold text-white mb-2">
            Prefer Direct Email?
          </h2>
          <p className="text-void-light text-xs sm:text-sm max-w-lg mx-auto mb-6 leading-relaxed">
            For complex enterprise tenders, requests for proposals (RFPs), or non-disclosure agreement (NDA) requests, reach our support desk directly at:
          </p>

          <a
            href="mailto:voidtechsolutionsupport@gmail.com"
            className="inline-flex items-center gap-2 rounded-xl border border-electric-purple/50 bg-electric-purple/20 px-6 py-3 font-mono text-sm font-semibold text-white transition-all hover:bg-electric-purple hover:shadow-glow-sm"
          >
            <span>voidtechsolutionsupport@gmail.com</span>
          </a>

          <p className="mt-4 text-[11px] font-mono text-void-muted">
            We review every enquiry and respond as soon as possible.
          </p>
        </div>
      </section>
    </div>
  );
}
