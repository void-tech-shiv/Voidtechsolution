import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("@/server/actions/enquiry.actions", () => ({
  submitEnquiryAction: vi.fn(),
}));

import { submitEnquiryAction } from "@/server/actions/enquiry.actions";
import { buildWhatsAppLink, QuickQuoteForm } from "@/components/sections/quick-quote-form";

const submitMock = vi.mocked(submitEnquiryAction);

describe("VOIDTECH SOLUTION Phase 2 quick quote", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    submitMock.mockResolvedValue({ success: true, enquiryId: "enq_quote123" });
  });

  it("uses the same validated CRM enquiry action with sensible defaults and source attribution", async () => {
    render(<QuickQuoteForm />);
    fireEvent.change(screen.getByLabelText("Website type"), { target: { value: "store" } });
    fireEvent.change(screen.getByLabelText("Your name *"), { target: { value: "Customer Example" } });
    fireEvent.change(screen.getByLabelText("Email address *"), { target: { value: "Customer@Example.Com" } });
    fireEvent.change(screen.getByLabelText("Phone / WhatsApp number (optional)"), { target: { value: "+919876543210" } });
    fireEvent.change(screen.getByLabelText("What do you need? (optional)"), { target: { value: "I need a small online store." } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Get My Free Quote" }));
    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));
    expect(submitMock).toHaveBeenCalledWith(expect.objectContaining({
      name: "Customer Example",
      email: "customer@example.com",
      phone: "+919876543210",
      consentGiven: true,
      serviceCategory: "WEB_DEVELOPMENT",
      budgetRange: "NOT_SURE",
      timeline: "FLEXIBLE",
      website_url: "",
      additionalConfig: {
        source: "quick_quote",
        projectType: "store",
        projectTypeLabel: "Online store",
      },
    }));
    expect(submitMock.mock.calls[0]?.[0]).toEqual(expect.objectContaining({
      message: expect.stringContaining("I need a small online store."),
    }));
    await waitFor(() => expect(screen.getByText(/Your request is saved/)).toBeInTheDocument());
    expect(screen.getByText(/enq_quote123/)).toBeInTheDocument();
  });

  it("accepts an optional description and does not invent project specifications", async () => {
    render(<QuickQuoteForm />);
    fireEvent.change(screen.getByLabelText("Your name *"), { target: { value: "Client Example" } });
    fireEvent.change(screen.getByLabelText("Email address *"), { target: { value: "client@example.com" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Get My Free Quote" }));
    await waitFor(() => expect(submitMock).toHaveBeenCalled());
    const input = submitMock.mock.calls[0]?.[0] as { message: string; phone?: string };
    expect(input.message).toMatch(/contact me to discuss the scope and estimate/);
    expect(input.phone).toBeUndefined();
  });

  it("shows server submission failure without claiming a lead was saved", async () => {
    submitMock.mockResolvedValue({ success: false, error: "Submission limit reached. Try again." });
    render(<QuickQuoteForm />);
    fireEvent.change(screen.getByLabelText("Your name *"), { target: { value: "Client Example" } });
    fireEvent.change(screen.getByLabelText("Email address *"), { target: { value: "client@example.com" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Get My Free Quote" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Submission limit reached"));
    expect(screen.queryByText(/Your request is saved/)).not.toBeInTheDocument();
  });

  it("offers a detailed intake and does not invent a WhatsApp phone number", () => {
    render(<QuickQuoteForm />);
    expect(screen.getByRole("link", { name: /full project form/i })).toHaveAttribute("href", "/contact#enquiry-form");
    expect(screen.getByRole("link", { name: /Prefer email/i })).toHaveAttribute("href", expect.stringContaining("mailto:"));
    expect(screen.queryByRole("link", { name: /Chat on WhatsApp/i })).not.toBeInTheDocument();
  });
});

describe("WhatsApp number configuration", () => {
  it("generates an international click-to-chat URL only for valid numbers", () => {
    const url = buildWhatsAppLink("+91 98765 43210");
    expect(url).toContain("https://wa.me/919876543210?text=");
    expect(buildWhatsAppLink(undefined)).toBeNull();
    expect(buildWhatsAppLink("")).toBeNull();
    expect(buildWhatsAppLink("1234")).toBeNull();
    expect(buildWhatsAppLink("invalid-business-number")).toBeNull();
  });
});
