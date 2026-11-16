"use client";

import * as React from "react";
import type { UserRole, AdminUser } from "@prisma/client";
import {
  UserPlus,
  ShieldCheck,
  Shield,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Lock,
} from "lucide-react";
import {
  createAdminUserAction,
  updateAdminRoleAction,
  setAdminStatusAction,
  deleteAdminUserAction,
} from "@/server/actions/admin-management.actions";

type SafeAdmin = Omit<AdminUser, "passwordHash">;

interface AdminUsersClientProps {
  initialAdmins: SafeAdmin[];
  currentRole: UserRole;
  currentUserId: string;
}

export function AdminUsersClient({
  initialAdmins,
  currentRole,
  currentUserId,
}: AdminUsersClientProps) {
  const [admins, setAdmins] = React.useState<SafeAdmin[]>(initialAdmins);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isActionPending, setIsActionPending] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  // New admin form state
  const [newName, setNewName] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [newRole, setNewRole] = React.useState<"ADMIN" | "EDITOR">("ADMIN");

  const clearFeedback = () => setFeedback(null);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setIsActionPending(true);

    try {
      const res = await createAdminUserAction({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });

      if (!res.success || !res.data) {
        setFeedback({ type: "error", message: res.error || "Failed to create administrator." });
        return;
      }

      setAdmins((prev) => [...prev, res.data!.user]);
      setFeedback({
        type: "success",
        message: `Administrator '${res.data.user.name}' (${res.data.user.role}) provisioned successfully.`,
      });
      setIsAddModalOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("ADMIN");
    } catch {
      setFeedback({ type: "error", message: "Network error occurred." });
    } finally {
      setIsActionPending(false);
    }
  };

  const handleToggleStatus = async (admin: SafeAdmin) => {
    if (admin.role === "SUPER_ADMIN") {
      setFeedback({ type: "error", message: "The master SUPER_ADMIN account cannot be deactivated." });
      return;
    }

    if (admin.id === currentUserId) {
      setFeedback({ type: "error", message: "You cannot deactivate your own administrative account." });
      return;
    }

    const nextStatus = !admin.isActive;
    const confirmMsg = nextStatus
      ? `Re-activate administrator '${admin.name}'?`
      : `Deactivate administrator '${admin.name}'? Their active sessions will be terminated immediately.`;

    if (!window.confirm(confirmMsg)) return;

    setIsActionPending(true);
    clearFeedback();

    try {
      const res = await setAdminStatusAction({
        targetUserId: admin.id,
        isActive: nextStatus,
      });

      if (!res.success || !res.data) {
        setFeedback({ type: "error", message: res.error || "Failed to update status." });
        return;
      }

      setAdmins((prev) =>
        prev.map((a) => (a.id === admin.id ? { ...a, isActive: res.data!.user.isActive } : a))
      );
      setFeedback({
        type: "success",
        message: `Administrator '${admin.name}' is now ${nextStatus ? "Active" : "Deactivated"}.`,
      });
    } catch {
      setFeedback({ type: "error", message: "Failed to update status." });
    } finally {
      setIsActionPending(false);
    }
  };

  const handleRoleChange = async (admin: SafeAdmin, role: "ADMIN" | "EDITOR") => {
    if (admin.role === "SUPER_ADMIN") {
      setFeedback({ type: "error", message: "The master SUPER_ADMIN role cannot be altered." });
      return;
    }

    if (admin.role === role) return;

    if (!window.confirm(`Change role of '${admin.name}' to ${role}? Active sessions will be rotated.`)) {
      return;
    }

    setIsActionPending(true);
    clearFeedback();

    try {
      const res = await updateAdminRoleAction({
        targetUserId: admin.id,
        role,
      });

      if (!res.success || !res.data) {
        setFeedback({ type: "error", message: res.error || "Failed to change role." });
        return;
      }

      setAdmins((prev) =>
        prev.map((a) => (a.id === admin.id ? { ...a, role: res.data!.user.role } : a))
      );
      setFeedback({
        type: "success",
        message: `Role for '${admin.name}' changed to ${role}.`,
      });
    } catch {
      setFeedback({ type: "error", message: "Failed to update role." });
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDeleteAdmin = async (admin: SafeAdmin) => {
    if (admin.role === "SUPER_ADMIN") {
      setFeedback({ type: "error", message: "The master SUPER_ADMIN account cannot be deleted." });
      return;
    }

    if (!window.confirm(`PERMANENTLY DELETE administrator '${admin.name}'? This action is irreversible.`)) {
      return;
    }

    setIsActionPending(true);
    clearFeedback();

    try {
      const res = await deleteAdminUserAction(admin.id);
      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to delete account." });
        return;
      }

      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
      setFeedback({ type: "success", message: `Administrator '${admin.name}' permanently deleted.` });
    } catch {
      setFeedback({ type: "error", message: "Failed to delete administrator." });
    } finally {
      setIsActionPending(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-users-page">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Team & Access Control
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Manage administrative personnel, assign roles, and audit access permissions.
          </p>
        </div>

        {currentRole === "SUPER_ADMIN" && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            data-testid="add-admin-btn"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-all hover:bg-violet-500"
          >
            <UserPlus className="h-4 w-4" />
            Add Administrator
          </button>
        )}
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          data-testid="admin-users-feedback"
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
          <button onClick={clearFeedback} className="text-xs opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Administrators Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-300" data-testid="admin-users-table">
            <thead className="border-b border-white/10 bg-neutral-950/60 text-xs uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Administrator</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Last Active</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {admins.map((admin) => (
                <tr key={admin.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-neutral-800 text-sm font-semibold text-white">
                        {admin.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white">{admin.name}</div>
                        <div className="font-mono text-xs text-neutral-500">{admin.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        admin.role === "SUPER_ADMIN"
                          ? "border border-violet-500/30 bg-violet-500/10 text-violet-300"
                          : admin.role === "ADMIN"
                          ? "border border-blue-500/30 bg-blue-500/10 text-blue-300"
                          : "border border-neutral-700 bg-neutral-800 text-neutral-300"
                      }`}
                    >
                      {admin.role === "SUPER_ADMIN" ? (
                        <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
                      ) : (
                        <Shield className="h-3.5 w-3.5" />
                      )}
                      {admin.role}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        admin.isActive
                          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : "border border-red-500/20 bg-red-500/10 text-red-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          admin.isActive ? "bg-emerald-400" : "bg-red-400"
                        }`}
                      />
                      {admin.isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-xs text-neutral-400">
                    {admin.lastLoginAt
                      ? new Date(admin.lastLoginAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Never logged in"}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {admin.role === "SUPER_ADMIN" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                        <Lock className="h-3 w-3" /> Master Protected
                      </span>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        {/* Role switch */}
                        <button
                          disabled={isActionPending}
                          onClick={() =>
                            handleRoleChange(admin, admin.role === "ADMIN" ? "EDITOR" : "ADMIN")
                          }
                          className="rounded-lg border border-white/5 bg-neutral-800/60 px-2 py-1 text-xs text-neutral-300 hover:border-violet-500/30 hover:bg-neutral-800"
                          title="Switch role between ADMIN and EDITOR"
                        >
                          Make {admin.role === "ADMIN" ? "EDITOR" : "ADMIN"}
                        </button>

                        {/* Status toggle */}
                        <button
                          disabled={isActionPending}
                          onClick={() => handleToggleStatus(admin)}
                          className={`rounded-lg border px-2 py-1 text-xs font-medium ${
                            admin.isActive
                              ? "border-amber-500/20 bg-amber-950/20 text-amber-300 hover:bg-amber-900/30"
                              : "border-emerald-500/20 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/30"
                          }`}
                        >
                          {admin.isActive ? "Deactivate" : "Activate"}
                        </button>

                        {/* Delete */}
                        <button
                          disabled={isActionPending}
                          onClick={() => handleDeleteAdmin(admin)}
                          className="rounded-lg border border-red-500/20 bg-red-950/20 p-1 text-red-400 hover:bg-red-900/40"
                          title="Delete account"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Administrator Modal */}
      {isAddModalOpen && (
        <div
          data-testid="create-admin-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">Create Administrator Account</h2>
            <p className="mt-1 text-xs text-neutral-400">
              Only ADMIN and EDITOR roles can be provisioned. SUPER_ADMIN is protected by system invariant.
            </p>

            <form onSubmit={handleCreateAdmin} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300">Work Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@voidtechsolution.com"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300">
                  Temporary Master Password (min 12 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={12}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300">Assigned Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as "ADMIN" | "EDITOR")}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                >
                  <option value="ADMIN">ADMIN (Operations & Content)</option>
                  <option value="EDITOR">EDITOR (Content Management Only)</option>
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 disabled:opacity-50"
                >
                  {isActionPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
