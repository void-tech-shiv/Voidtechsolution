import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from "next/navigation";
import { FloatingWhatsApp, WHATSAPP_CHAT_URL } from "@/components/layout/floating-whatsapp";

const mockUsePathname = vi.mocked(usePathname);

describe("Floating WhatsApp contact shortcut", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  it("opens the agency WhatsApp number with a prefilled introduction", () => {
    render(<FloatingWhatsApp />);
    const link = screen.getByRole("link", { name: "Chat with VOIDTECH SOLUTION on WhatsApp" });
    expect(link).toHaveAttribute("href", WHATSAPP_CHAT_URL);
    expect(link.getAttribute("href")).toContain("https://wa.me/917541910379?text=");
    expect(link.getAttribute("href")).toContain("VOIDTECH");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders across marketing pages without requiring environment variables", () => {
    mockUsePathname.mockReturnValue("/pricing");
    render(<FloatingWhatsApp />);
    expect(screen.getByRole("link", { name: /WhatsApp/ })).toBeInTheDocument();
  });

  it.each(["/admin", "/admin/login", "/admin/crm", "/admin/traffic"])(
    "does not obstruct the administrative console at %s",
    (pathname) => {
      mockUsePathname.mockReturnValue(pathname);
      render(<FloatingWhatsApp />);
      expect(screen.queryByRole("link", { name: /WhatsApp/ })).not.toBeInTheDocument();
    },
  );

  it("has an accessible name and a visible keyboard focus treatment", () => {
    render(<FloatingWhatsApp />);
    const link = screen.getByRole("link", { name: /Chat with VOIDTECH SOLUTION on WhatsApp/ });
    expect(link).toHaveAttribute("title", "Chat on WhatsApp");
    expect(link.className).toContain("focus-visible:ring");
  });
});
