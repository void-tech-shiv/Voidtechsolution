"use client";

import { usePathname } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";

// Public agency contact number supplied by the owner. Keep this independent
// from NEXT_PUBLIC build-time variables so the CTA works on Cloudflare Workers.
export const WHATSAPP_CHAT_URL =
  "https://wa.me/917541910379?text=" +
  encodeURIComponent("Hi VOIDTECH SOLUTION! I would like to discuss getting a website built.");

/**
 * Global, responsive WhatsApp contact shortcut for the public website.
 * The admin dashboard should never be covered by marketing widgets.
 */
export function FloatingWhatsApp() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div
      className="group fixed bottom-5 right-4 z-[60] sm:bottom-7 sm:right-7"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[calc(100%+0.75rem)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-void-black/95 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:block"
      >
        Chat on WhatsApp
      </span>
      <a
        href={WHATSAPP_CHAT_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with VOIDTECH SOLUTION on WhatsApp"
        title="Chat on WhatsApp"
        className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-[#25D366] text-white shadow-[0_8px_32px_rgba(37,211,102,0.35)] transition-transform duration-200 hover:scale-105 hover:bg-[#1ebe5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 active:scale-95 motion-reduce:transition-none"
      >
        {/* Phone inside a chat bubble: recognizable without an external icon CDN. */}
        <MessageCircle className="h-8 w-8" strokeWidth={2.2} aria-hidden="true" />
        <Phone
          className="absolute left-1/2 top-1/2 h-[15px] w-[15px] -translate-x-1/2 -translate-y-1/2"
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </a>
    </div>
  );
}
