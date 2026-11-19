"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, MessageCircle, Send } from "lucide-react";
import { submitEnquiryAction } from "@/server/actions/enquiry.actions";
import { siteConfig } from "@/config/site";

const PROJECT_TYPES = [
  { id: "business", label: "Business website", category: "WEB_DEVELOPMENT" },
  { id: "portfolio", label: "Portfolio / landing page", category: "WEB_DEVELOPMENT" },
  { id: "store", label: "Online store", category: "WEB_DEVELOPMENT" },
  { id: "custom", label: "Custom website / web app", category: "WEB_DEVELOPMENT" },
] as const;

type ProjectTypeId = (typeof PROJECT_TYPES)[number]["id"];

const WHATSAPP_MESSAGE =
  "Hi VOIDTECH SOLUTION! I'd like to discuss a website for my business. Could I get a quote?";

/**
 * WhatsApp's wa.me links require an international phone number with no plus
 * sign or punctuation. Do not show a WhatsApp CTA until a real number is set.
 */
export function buildWhatsAppLink(rawNumber: string | undefined): string | null {
  if (!rawNumber) return null;
  const normalized = rawNumber.trim().replace(/[\s()+-]/g, "");
  if (!/^[1-9]\d{7,14}$/.test(normalized)) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
}

export function QuickQuoteForm({ compact = false }: { compact?: boolean }) {
  const [projectType, setProjectType] = React.useState<ProjectTypeId>("business");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [consentGiven, setConsentGiven] = React.useState(false);
  const [websiteUrlHoneypot, setWebsiteUrlHoneypot] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submittedId, setSubmittedId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const whatsappHref = buildWhatsAppLink(process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    const selected = PROJECT_TYPES.find((item) => item.id === projectType) ?? PROJECT_TYPES[0];
    const scope = details.trim();
    // This form asks only for the essentials. The detailed 3-step form still
    // exists for visitors who already know their scope, budget and timeline.
    const description = scope
      ? `Quick quote requested for ${selected.label}.\n\n${scope}`
      : `Quick quote requested for ${selected.label}. Please contact me to discuss the scope and estimate.`;
    try {
      const result = await submitEnquiryAction({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        serviceCategory: selected.category,
        budgetRange: "NOT_SURE",
        timeline: "FLEXIBLE",
        message: description,
        consentGiven,
        website_url: websiteUrlHoneypot,
        additionalConfig: {
          source: "quick_quote",
          projectType: selected.id,
          projectTypeLabel: selected.label,
        },
      });
      if (result.success && result.enquiryId) {
        setSubmittedId(result.enquiryId);
        return;
      }
      setError(result.error || "Couldn't submit your request. Please try again.");
    } catch {
      setError("We couldn't send your request right now. Please try again or email us.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submittedId) {
    return (
      <div role="status" className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-6 text-center">
        <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-300" aria-hidden="true" />
        <h3 className="mt-3 text-lg font-bold text-white">Your request is saved!</h3>
        <p className="mt-2 text-sm leading-relaxed text-void-light">
          Thank you! Your request is in our agency enquiry inbox. We will contact you using the details you provided.
        </p>
        <p className="mt-2 text-xs text-void-muted">Reference: {submittedId}</p>
        <button
          type="button"
          className="mt-5 rounded-lg border border-void-border px-4 py-2 text-sm font-semibold text-white hover:border-electric-purple"
          onClick={() => {
            setSubmittedId(null);
            setDetails("");
            setConsentGiven(false);
          }}
        >Submit another request</button>
      </div>
    );
  }

  const inputClass = "min-h-11 w-full rounded-xl border border-void-border/80 bg-void-black/70 px-3 py-2.5 text-sm text-white outline-none placeholder:text-void-muted/80 focus:border-electric-purple focus:ring-2 focus:ring-electric-purple/20";

  return (
    <div className="rounded-2xl border border-electric-purple/30 bg-void-card-gradient p-5 shadow-glass-inner sm:p-7">
      <div className="mb-5">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-electric-purple">
          Quick Quote · 1-minute enquiry
        </p>
        <h3 className="mt-2 text-xl font-extrabold text-white sm:text-2xl">What would you like us to build?</h3>
        <p className="mt-2 text-sm text-void-light">
          Tell us the basics. No budget or technical knowledge required — we will discuss the details with you.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4" aria-label="Quick website quote request">
        <div>
          <label htmlFor={compact ? "quick-project-contact" : "quick-project-home"} className="mb-1.5 block text-xs font-semibold text-void-light">
            Website type
          </label>
          <select
            id={compact ? "quick-project-contact" : "quick-project-home"}
            value={projectType}
            onChange={(event) => setProjectType(event.target.value as ProjectTypeId)}
            className={inputClass}
          >
            {PROJECT_TYPES.map((item) => (
              <option className="bg-void-black" key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={compact ? "quick-name-contact" : "quick-name-home"} className="mb-1.5 block text-xs font-semibold text-void-light">Your name *</label>
            <input
              id={compact ? "quick-name-contact" : "quick-name-home"}
              className={inputClass}
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={100}
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label htmlFor={compact ? "quick-email-contact" : "quick-email-home"} className="mb-1.5 block text-xs font-semibold text-void-light">Email address *</label>
            <input
              id={compact ? "quick-email-contact" : "quick-email-home"}
              className={inputClass}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={150}
              placeholder="you@example.com"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor={compact ? "quick-phone-contact" : "quick-phone-home"} className="mb-1.5 block text-xs font-semibold text-void-light">Phone / WhatsApp number (optional)</label>
          <input
            id={compact ? "quick-phone-contact" : "quick-phone-home"}
            className={inputClass}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            maxLength={30}
            placeholder="Include country code, e.g. +91…"
          />
        </div>
        <div>
          <label htmlFor={compact ? "quick-details-contact" : "quick-details-home"} className="mb-1.5 block text-xs font-semibold text-void-light">
            What do you need? (optional)
          </label>
          <textarea
            id={compact ? "quick-details-contact" : "quick-details-home"}
            className={inputClass + " min-h-24 resize-y"}
            value={details}
            maxLength={2500}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="For example: a website for my café with a menu and enquiry form."
          />
        </div>
        {/* Honeypot is not shown or announced to human visitors. */}
        <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor={compact ? "quick-website-contact" : "quick-website-home"}>Your website URL</label>
          <input
            id={compact ? "quick-website-contact" : "quick-website-home"}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={websiteUrlHoneypot}
            onChange={(event) => setWebsiteUrlHoneypot(event.target.value)}
          />
        </div>
        <label className="flex items-start gap-3 text-xs leading-relaxed text-void-light">
          <input
            className="mt-0.5 accent-purple-500"
            type="checkbox"
            checked={consentGiven}
            onChange={(event) => setConsentGiven(event.target.checked)}
            required
          />
          <span>I agree that VOIDTECH SOLUTION may contact me about this project using the details I provided. *</span>
        </label>
        {error && <p role="alert" className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-electric-violet to-electric-purple px-5 py-3 text-sm font-bold text-white shadow-glow-sm transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          {isSubmitting ? "Sending your request…" : "Get My Free Quote"}
          {!isSubmitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </form>

      <div className="mt-5 flex flex-col gap-3 border-t border-void-border/70 pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">
        <Link href="/contact#enquiry-form" className="text-electric-purple hover:underline">
          Have a detailed brief? Use our full project form
        </Link>
        {whatsappHref ? (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-emerald-300 hover:underline">
            <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
          </a>
        ) : (
          <a href={`mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent("Website quote request")}`}
            className="inline-flex items-center gap-2 text-void-light hover:text-white">
            <Mail className="h-4 w-4" /> Prefer email? Contact us
          </a>
        )}
      </div>
      <p className="mt-4 text-[11px] text-void-muted">
        No payment required to request a quote. Sending a WhatsApp message directly does not create a CRM enquiry.
      </p>
    </div>
  );
}
