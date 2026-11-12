"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  Sparkles,
  UserCheck,
  Clock,
  Award,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAdminNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/server/actions/crm.actions";

interface NotificationItem {
  id: string;
  recipientId: string;
  enquiryId?: string | null;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date | string;
}

export function AdminNotificationsBell() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await getAdminNotificationsAction();
      if (res.success && res.data) {
        setNotifications(res.data.items as unknown as NotificationItem[]);
        setUnreadCount(res.data.unreadCount);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Click outside listener
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkOneRead = async (id: string) => {
    const res = await markNotificationReadAction(id);
    if (res.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllRead = async () => {
    const res = await markAllNotificationsReadAction();
    if (res.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "NEW_LEAD":
        return <Sparkles className="w-4 h-4 text-blue-400" />;
      case "LEAD_ASSIGNED":
        return <UserCheck className="w-4 h-4 text-violet-400" />;
      case "FOLLOWUP_DUE":
        return <Clock className="w-4 h-4 text-amber-400" />;
      case "LEAD_WON":
        return <Award className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-void-light" />;
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        aria-label="View notifications"
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="relative p-2 rounded-lg text-void-muted hover:text-white hover:bg-void-surface transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white shadow-sm ring-2 ring-void-black">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notifications Popover */}
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-void-dark border border-void-border shadow-2xl z-40 overflow-hidden animate-in fade-in duration-150"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-void-border bg-void-dark/95 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-void-white uppercase tracking-wider">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  {unreadCount} Unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Feed */}
          <div className="max-h-80 overflow-y-auto divide-y divide-void-subtle/50 scrollbar-thin scrollbar-thumb-void-surface">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-void-muted">
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "p-3.5 transition-colors flex items-start gap-3",
                    n.isRead ? "bg-transparent opacity-70" : "bg-violet-500/5"
                  )}
                >
                  <div className="p-1.5 rounded-lg bg-void-surface shrink-0 mt-0.5">
                    {getTypeIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-void-white truncate">
                        {n.title}
                      </span>
                      <span className="text-[10px] text-void-muted shrink-0">
                        {new Date(n.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <p className="text-[11px] text-void-light line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>

                    {n.enquiryId && (
                      <Link
                        href="/admin/crm"
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 text-[10px] text-violet-400 hover:underline pt-1"
                      >
                        <span>View in CRM</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </div>

                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkOneRead(n.id)}
                      className="p-1 rounded text-void-muted hover:text-void-white shrink-0"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-void-border bg-void-dark/80 text-center">
            <Link
              href="/admin/crm"
              onClick={() => setIsOpen(false)}
              className="text-xs text-void-muted hover:text-violet-400 font-medium transition-colors"
            >
              Open CRM Pipeline Board →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
