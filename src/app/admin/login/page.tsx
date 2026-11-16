import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = {
  title: "Admin Portal Login | VOIDTECH SOLUTION",
  description: "Restricted administrative console authentication for VOIDTECH SOLUTION",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLoginPage() {
  // Authoritative Server-Side check: If already authenticated and active, redirect to dashboard
  const current = await getCurrentAdmin();
  if (current && current.user.isActive) {
    redirect("/admin");
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-void-black text-void-light px-4 py-8 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background radial gradient accent */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-electric-violet/10 blur-[140px] rounded-full pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Bar Navigation */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-void-muted hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Return to Public Site</span>
        </Link>
        <div className="flex items-center gap-2 text-[11px] font-mono text-void-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>TLS 1.3 / OWASP ASVS v4.0</span>
        </div>
      </div>

      {/* Center Auth Form inside Suspense boundary */}
      <div className="w-full my-auto py-10 z-10">
        <Suspense
          fallback={
            <div className="w-full max-w-md mx-auto p-8 rounded-2xl border border-void-border/40 bg-void-charcoal/50 text-center animate-pulse">
              <div className="w-10 h-10 mx-auto rounded-lg bg-void-surface mb-4" />
              <div className="h-6 w-32 mx-auto rounded bg-void-surface mb-2" />
              <div className="h-4 w-48 mx-auto rounded bg-void-surface" />
            </div>
          }
        >
          <AdminLoginForm />
        </Suspense>
      </div>

      {/* Footer System Telemetry */}
      <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-void-muted/60 z-10 pt-4 border-t border-void-border/40">
        <div>VOIDTECH SOLUTION Core v0.1.0 // Node.js App Router</div>
        <div>Security Protocol: Cryptographic HMAC-SHA256 Tokenization</div>
      </div>
    </div>
  );
}

