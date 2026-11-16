"use client";

import * as React from "react";
import Link from "next/link";
import type { UserRole } from "@prisma/client";
import {
  Menu,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/auth.actions";
import { AdminNotificationsBell } from "./admin-notifications-bell";

interface AdminHeaderProps {
  user: {
    name: string;
    email: string;
    role: UserRole;
  };
  onOpenMobileMenu?: () => void;
}

export function AdminHeader({ user, onOpenMobileMenu }: AdminHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutAction();
      window.location.href = "/admin/login";
    } catch {
      window.location.href = "/admin/login";
    }
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-electric-neon/20 text-electric-neon border-electric-neon/40";
      case "ADMIN":
        return "bg-electric-purple/20 text-electric-purple border-electric-purple/40";
      case "EDITOR":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      default:
        return "bg-void-surface text-void-light border-void-border";
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-void-border/80 bg-void-black/90 px-4 sm:px-6 lg:px-8 backdrop-blur-xl">
      {/* Mobile Drawer Trigger + Dashboard Label */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open mobile navigation drawer"
            className="lg:hidden p-2 rounded-lg text-void-muted hover:text-white hover:bg-void-surface transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-void-muted hidden sm:inline">
            WORKSPACE //
          </span>
          <span className="text-sm font-semibold text-white">
            VOIDTECH Administrative Console
          </span>
        </div>
      </div>

      {/* Right Side: Identity, Role, Preview Site, Logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Public Site Link */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-1.5 text-xs text-void-muted hover:text-white transition-colors"
          title="Open public website in new tab"
        >
          <span>Live Site</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* In-App Notifications Bell */}
        <AdminNotificationsBell />

        <div className="h-4 w-px bg-void-border hidden md:block" aria-hidden="true" />

        {/* User Badge & Identity */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-xs font-semibold text-white leading-tight">
              {user.name}
            </span>
            <span className="text-[11px] font-mono text-void-muted leading-tight">
              {user.email}
            </span>
          </div>

          <span
            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(
              user.role
            )}`}
          >
            {user.role}
          </span>
        </div>

        {/* Logout CTA */}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleLogout}
          isLoading={isLoggingOut}
          className="text-xs px-2.5 py-1.5 h-8 gap-1.5 border-void-border hover:border-red-500/40 hover:text-red-400"
          title="Sign out of administrative session"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
