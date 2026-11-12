"use client";

import * as React from "react";
import { Save, AlertTriangle, CheckCircle2, Loader2, Globe, Mail, ShieldAlert } from "lucide-react";
import { updateSiteSettingAction } from "@/server/actions/admin-content.actions";

interface AdminSettingsClientProps {
  initialSettings: Record<string, string>;
}

export function AdminSettingsClient({ initialSettings }: AdminSettingsClientProps) {
  const [settings, setSettings] = React.useState<Record<string, string>>(initialSettings);
  const [isPending, setIsPending] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    setIsPending(true);
    setFeedback(null);

    try {
      const res = await updateSiteSettingAction(key, settings[key] || "");
      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to update setting." });
        return;
      }

      setFeedback({ type: "success", message: `Setting '${key}' updated successfully.` });
    } catch {
      setFeedback({ type: "error", message: "Failed to persist setting." });
    } finally {
      setIsPending(false);
    }
  };

  const settingDefinitions = [
    {
      key: "site_name",
      label: "Platform Brand Name",
      description: "Official agency brand displayed across hero, header, and metadata.",
      type: "text",
      icon: Globe,
    },
    {
      key: "site_tagline",
      label: "Brand Tagline",
      description: "Core agency positioning tagline.",
      type: "text",
      icon: Globe,
    },
    {
      key: "contact_email",
      label: "Inbound Support Desk Email",
      description: "Official verified contact email address displayed to clients.",
      type: "email",
      icon: Mail,
    },
    {
      key: "enquiry_auto_reply",
      label: "Enquiry Auto-Confirmation",
      description: "Automatically dispatch confirmation email to client upon enquiry submission.",
      type: "select",
      options: ["true", "false"],
      icon: Mail,
    },
    {
      key: "maintenance_mode",
      label: "Maintenance Mode",
      description: "Enable system maintenance banner across public marketing routes.",
      type: "select",
      options: ["false", "true"],
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="space-y-6" data-testid="admin-settings-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Platform Configuration
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Global application settings and operational toggles. Restricted to SUPER_ADMIN.
        </p>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          data-testid="admin-settings-feedback"
          className={`flex items-center justify-between rounded-xl border p-4 text-sm ${
            feedback.type === "success"
              ? "border-emerald-500/20 bg-emerald-950/30 text-emerald-300"
              : "border-red-500/20 bg-red-950/30 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Settings Grid */}
      <div className="space-y-4">
        {settingDefinitions.map((item) => {
          const Icon = item.icon;
          const currentValue = settings[item.key] ?? "";

          return (
            <div
              key={item.key}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-neutral-900/50 p-6 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="max-w-xl">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-violet-400" />
                  <span className="font-semibold text-white">{item.label}</span>
                  <span className="font-mono text-xs text-neutral-500">({item.key})</span>
                </div>
                <p className="mt-1 text-xs text-neutral-400">{item.description}</p>
              </div>

              <div className="flex items-center gap-3">
                {item.type === "select" ? (
                  <select
                    value={currentValue}
                    onChange={(e) => handleChange(item.key, e.target.value)}
                    className="rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                  >
                    {item.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.toUpperCase()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={item.type}
                    value={currentValue}
                    onChange={(e) => handleChange(item.key, e.target.value)}
                    className="w-64 rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none sm:w-80"
                  />
                )}

                <button
                  disabled={isPending}
                  onClick={() => handleSave(item.key)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-600/20 px-3 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-600/30 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
