"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@prisma/client";
import {
  LayoutDashboard,
  Inbox,
  Kanban,
  Layers,
  CircleDollarSign,
  Briefcase,
  HelpCircle,
  Users,
  ScrollText,
  Settings,
  ShieldAlert,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasPermission, type PermissionKey } from "@/server/security/rbac";
import { BrandLogo } from "@/components/ui/brand-logo";

export interface NavItemConfig {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission?: PermissionKey;
  badge?: string;
}

export const ADMIN_NAV_ITEMS: NavItemConfig[] = [
  {
    name: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    requiredPermission: "dashboard:view",
  },
  {
    name: "CRM Pipeline",
    href: "/admin/crm",
    icon: Kanban,
    requiredPermission: "enquiries:view",
    badge: "CRM",
  },
  {
    name: "Enquiries",
    href: "/admin/enquiries",
    icon: Inbox,
    requiredPermission: "enquiries:view",
  },
  {
    name: "Services",
    href: "/admin/services",
    icon: Layers,
    requiredPermission: "services:manage",
  },
  {
    name: "Pricing Tiers",
    href: "/admin/pricing",
    icon: CircleDollarSign,
    requiredPermission: "pricing:manage",
  },
  {
    name: "Portfolio",
    href: "/admin/portfolio",
    icon: Briefcase,
    requiredPermission: "portfolio:manage",
  },
  {
    name: "Knowledgebase (FAQ)",
    href: "/admin/faqs",
    icon: HelpCircle,
    requiredPermission: "faqs:manage",
  },
  {
    name: "Team & Access",
    href: "/admin/users",
    icon: Users,
    requiredPermission: "admins:manage",
    badge: "Super Admin",
  },
  {
    name: "Audit Trail",
    href: "/admin/audit-logs",
    icon: ScrollText,
    requiredPermission: "audit_logs:view",
    badge: "Audited",
  },
  {
    name: "Platform Settings",
    href: "/admin/settings",
    icon: Settings,
    requiredPermission: "settings:manage",
  },
];

interface AdminSidebarProps {
  role: UserRole;
  onNavigate?: () => void;
  onClose?: () => void;
  isMobile?: boolean;
}

export function AdminSidebar({
  role,
  onNavigate,
  onClose,
  isMobile = false,
}: AdminSidebarProps) {
  const pathname = usePathname();

  // Filter items based on RBAC permissions for the active role
  const visibleItems = ADMIN_NAV_ITEMS.filter((item) => {
    if (!item.requiredPermission) return true;
    return hasPermission(role, item.requiredPermission);
  });

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-void-dark/95 border-r border-void-border/80 backdrop-blur-xl text-void-light select-none",
        isMobile ? "w-72 p-4" : "w-64 p-5"
      )}
      aria-label="Admin Navigation"
    >
      {/* Brand & Console Title */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-void-border/60">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-2.5 group"
          aria-label="Admin Dashboard Home"
        >
          <BrandLogo variant="symbol" size="sm" href={false} />
          <div>
            <div className="font-mono text-sm font-bold text-white tracking-wider flex items-center gap-1.5">
              <span>VOIDTECH</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-electric-violet/20 text-electric-purple border border-electric-purple/30">
                ADMIN
              </span>
            </div>
            <div className="text-[11px] font-mono text-void-muted">
              Control Center
            </div>
          </div>
        </Link>

        {isMobile && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close admin menu"
            className="p-1.5 rounded-lg text-void-muted hover:text-white hover:bg-void-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1" aria-label="Console Navigation Links">
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          const IconComponent = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all group",
                isActive
                  ? "bg-electric-violet/20 text-white border border-electric-purple/50 shadow-glow-xs font-semibold"
                  : "text-void-muted hover:text-white hover:bg-void-surface/70 border border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <IconComponent
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-electric-purple"
                      : "text-void-muted group-hover:text-void-light"
                  )}
                />
                <span>{item.name}</span>
              </div>

              {item.badge && (
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-void-surface text-void-muted border border-void-border/60">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Role Indicator Footer */}
      <div className="pt-4 mt-auto border-t border-void-border/60">
        <div className="p-3 rounded-lg bg-void-charcoal/80 border border-void-border/60">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-electric-purple shrink-0" />
            <span className="text-[11px] font-semibold text-void-light">
              Active RBAC Role
            </span>
          </div>
          <div className="text-[11px] font-mono text-electric-purple">
            {role}
          </div>
          <div className="text-[10px] text-void-muted/80 mt-1">
            {role === "SUPER_ADMIN"
              ? "Unrestricted administrative privileges."
              : role === "ADMIN"
              ? "Standard operational permissions."
              : "Read & content publishing permissions."}
          </div>
        </div>
      </div>
    </aside>
  );
}

