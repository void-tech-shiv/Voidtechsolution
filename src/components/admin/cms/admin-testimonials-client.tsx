/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";


import * as React from "react";
import type { UserRole } from "@prisma/client";
import {
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import {
  verifyTestimonialAction,
  recordClientConsentAction,
  revokeTestimonialConsentAction,
} from "@/server/actions/cms/testimonials.actions";


interface AdminTestimonialsClientProps {
  initialTestimonials: Array<Record<string, any>>;
  userRole: UserRole;
}


export function AdminTestimonialsClient({
  initialTestimonials,
  userRole,
}: AdminTestimonialsClientProps) {
  const [testimonials, setTestimonials] = React.useState(initialTestimonials);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const isEditor = userRole === "EDITOR";

  const handleVerify = async (id: string) => {
    setLoadingId(id);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await verifyTestimonialAction(id);
    if (res.success) {
      setTestimonials((prev) =>
        prev.map((t) => (t.id === id ? { ...t, verificationStatus: "VERIFIED" } : t))
      );
      setSuccessMsg("Testimonial claims successfully verified.");
    } else {
      setErrorMsg(res.error?.message || "Verification failed.");
    }
    setLoadingId(null);
  };

  const handleRecordConsent = async (id: string) => {
    const url = prompt(
      "Enter client written consent documentation URL (e.g. DocuSign or verified confirmation):",
      "https://voidtechsolution.codedev.co.in/legal/consent-evidence"
    );
    if (!url) return;

    setLoadingId(id);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await recordClientConsentAction(id, url);
    if (res.success) {
      setTestimonials((prev) =>
        prev.map((t) => (t.id === id ? { ...t, clientConsentStatus: "GRANTED" } : t))
      );
      setSuccessMsg("Client legal consent successfully confirmed and recorded.");
    } else {
      setErrorMsg(res.error?.message || "Failed to record consent.");
    }
    setLoadingId(null);
  };

  const handleRevokeConsent = async (id: string) => {
    if (
      !confirm(
        "WARNING: Revoking consent will immediately delist this testimonial across all public pages at the database query level. Proceed?"
      )
    ) {
      return;
    }

    setLoadingId(id);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await revokeTestimonialConsentAction(id);
    if (res.success) {
      setTestimonials((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, clientConsentStatus: "REVOKED", isActive: false }
            : t
        )
      );
      setSuccessMsg("Consent revoked. Testimonial instantly delisted from public queries.");
    } else {
      setErrorMsg(res.error?.message || "Failed to revoke consent.");
    }
    setLoadingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {errorMsg && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3 animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3 animate-in fade-in"
        >
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Testimonial Table */}
      <div className="border border-void-border/80 rounded-xl bg-void-dark/40 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-void-border/80 bg-void-black/60 text-void-gray uppercase tracking-wider font-mono">
                <th className="py-3.5 px-4 font-semibold">Client & Role</th>
                <th className="py-3.5 px-4 font-semibold">Quote Content</th>
                <th className="py-3.5 px-4 font-semibold">Audit Status</th>
                <th className="py-3.5 px-4 font-semibold">Consent Status</th>
                <th className="py-3.5 px-4 font-semibold">Public Live</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-void-border/40">
              {testimonials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-void-gray">
                    No testimonials registered in the system.
                  </td>
                </tr>
              ) : (
                testimonials.map((t) => {
                  const isVerified = t.verificationStatus === "VERIFIED";
                  const isConsentGranted = t.clientConsentStatus === "GRANTED";
                  const isRevoked = t.clientConsentStatus === "REVOKED";
                  const isLoading = loadingId === t.id;


                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-void-black/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="font-semibold text-void-light">
                          {t.clientName}
                        </div>
                        <div className="text-[11px] text-void-gray">
                          {t.clientRole} • {t.clientCompany}
                        </div>
                      </td>
                      <td className="py-4 px-4 max-w-xs text-void-gray line-clamp-2">
                        &ldquo;{t.content}&rdquo;
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                            isVerified
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {t.verificationStatus}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                            isConsentGranted
                              ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                              : isRevoked
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                          }`}
                        >
                          {t.clientConsentStatus}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        {t.isActive && isVerified && isConsentGranted ? (
                          <span className="text-emerald-400 font-mono text-[11px]">
                            ● Public
                          </span>
                        ) : (
                          <span className="text-void-gray font-mono text-[11px]">
                            ○ Delisted
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isVerified && (
                            <button
                              type="button"
                              disabled={isEditor || isLoading}
                              onClick={() => handleVerify(t.id)}
                              className="px-2.5 py-1 rounded bg-void-purple/10 text-void-purple hover:bg-void-purple hover:text-white border border-void-purple/20 transition-colors disabled:opacity-40"
                              title={
                                isEditor
                                  ? "Editors cannot verify claims"
                                  : "Audit factual claims"
                              }
                            >
                              Verify
                            </button>
                          )}

                          {!isConsentGranted && !isRevoked && (
                            <button
                              type="button"
                              disabled={isEditor || isLoading}
                              onClick={() => handleRecordConsent(t.id)}
                              className="px-2.5 py-1 rounded bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white border border-sky-500/20 transition-colors disabled:opacity-40"
                              title={
                                isEditor
                                  ? "Editors cannot record consent"
                                  : "Record client legal consent"
                              }
                            >
                              Record Consent
                            </button>
                          )}

                          {isConsentGranted && (
                            <button
                              type="button"
                              disabled={isEditor || isLoading}
                              onClick={() => handleRevokeConsent(t.id)}
                              className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 transition-colors disabled:opacity-40"
                              title={
                                isEditor
                                  ? "Editors cannot revoke consent"
                                  : "Revoke consent and delist immediately"
                              }
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
