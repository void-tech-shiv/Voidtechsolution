"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/server/actions/auth.actions";
import { sanitizeCallbackUrl } from "@/server/security/cookie";

export function AdminLoginForm() {
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Email address is required.");
      return;
    }

    if (!password) {
      setErrorMessage("Password is required.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await loginAction({
        email: trimmedEmail,
        password,
        rememberMe,
      });

      if (!result.success) {
        setErrorMessage(result.error || "Invalid email or password.");
        setPassword("");
        setIsSubmitting(false);
        return;
      }

      // Success: determine destination and redirect
      const destination = sanitizeCallbackUrl(rawCallbackUrl, "/admin");
      // Full navigation guarantees cookies and server components re-evaluate cleanly
      window.location.href = destination;
    } catch {
      setErrorMessage("An unexpected authentication error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative rounded-2xl border border-void-border/80 bg-void-charcoal/95 backdrop-blur-xl p-8 shadow-glass-inner">
        {/* Glow ambient highlight */}
        <div
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-electric-violet/20 blur-3xl rounded-full pointer-events-none"
          aria-hidden="true"
        />

        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-electric-violet/10 border border-electric-purple/30 text-electric-purple mb-3 shadow-glow-sm">
            <Lock className="w-5 h-5" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Admin Console
          </h1>
          <p className="text-xs text-void-muted mt-1.5 uppercase tracking-widest font-mono">
            VOIDTECH SOLUTION // SECURE ACCESS
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            data-testid="auth-error-banner"
            aria-label="Authentication error"
            className="mb-6 flex items-start gap-3 p-3.5 rounded-lg border border-red-500/40 bg-red-950/40 text-red-200 text-sm animate-in fade-in duration-200"
          >
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 text-xs leading-relaxed font-medium">
              {errorMessage}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Email Field */}
          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-semibold text-void-light uppercase tracking-wider mb-2"
            >
              Administrator Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-void-muted">
                <Mail className="w-4 h-4" aria-hidden="true" />
              </div>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                disabled={isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@voidtechsolution.com"
                className="w-full pl-10 pr-4 py-2.5 bg-void-black/60 border border-void-border/80 rounded-lg text-sm text-white placeholder-void-muted/60 focus:outline-none focus:border-electric-purple/80 focus:ring-1 focus:ring-electric-purple/80 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-void-light uppercase tracking-wider"
              >
                Master Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-void-muted">
                <Lock className="w-4 h-4" aria-hidden="true" />
              </div>
              <input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-11 py-2.5 bg-void-black/60 border border-void-border/80 rounded-lg text-sm text-white placeholder-void-muted/60 focus:outline-none focus:border-electric-purple/80 focus:ring-1 focus:ring-electric-purple/80 transition-colors disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={0}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-void-muted hover:text-white transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label
              htmlFor="admin-remember"
              className="flex items-center gap-2.5 cursor-pointer text-xs text-void-muted hover:text-void-light transition-colors"
            >
              <input
                id="admin-remember"
                name="rememberMe"
                type="checkbox"
                checked={rememberMe}
                disabled={isSubmitting}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-void-border/80 bg-void-black/60 text-electric-purple focus:ring-electric-purple/50 focus:ring-offset-0 transition-colors"
              />
              <span>Remember session on this device</span>
            </label>
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center"
              isLoading={isSubmitting}
              rightIcon={!isSubmitting ? <ArrowRight className="w-4 h-4" /> : undefined}
            >
              {isSubmitting ? "Authenticating Session..." : "Authenticate"}
            </Button>
          </div>
        </form>

        {/* Security & Access Notice */}
        <div className="mt-8 pt-6 border-t border-void-border/60 text-center">
          <p className="text-[11px] leading-relaxed text-void-muted">
            <span className="font-semibold text-void-light">RESTRICTED PORTAL:</span> Authorized VOIDTECH personnel only.
            Public account registration is disabled. All authentication activity, IP addresses, and session tokens are cryptographically monitored and permanently audited.
          </p>
        </div>
      </div>
    </div>
  );
}

