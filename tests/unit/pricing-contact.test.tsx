import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextRequest } from "next/server";
import { PricingTable } from "@/components/sections/pricing-table";
import { PricingCalculator } from "@/components/sections/pricing-calculator";
import { ContactEnquiryForm } from "@/components/sections/contact-enquiry-form";
import { submitEnquiryAction } from "@/server/actions/enquiry.actions";
import { POST as enquiriesRouteHandler } from "@/app/api/enquiries/route";
import * as enquiriesRepo from "@/server/repositories/enquiries.repo";
import * as emailService from "@/server/email";

// Mock Next.js navigation hooks
const mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/contact",
}));

describe("Phase 6: Pricing Table & Approved Tiers", () => {
  it("renders all 10 approved packages with INR pricing and deliverables", () => {
    render(<PricingTable />);

    // Check tier count and approved package names
    expect(screen.getByText("Basic Static")).toBeInTheDocument();
    expect(screen.getByText("Standard Business")).toBeInTheDocument();
    expect(screen.getByText("Professional")).toBeInTheDocument();
    expect(screen.getByText("Premium Custom")).toBeInTheDocument();
    expect(screen.getByText("E-commerce")).toBeInTheDocument();
    expect(screen.getByText("SaaS")).toBeInTheDocument();
    expect(screen.getByText("LMS")).toBeInTheDocument();
    expect(screen.getByText("Marketplace")).toBeInTheDocument();
    expect(screen.getByText("ERP & CRM")).toBeInTheDocument();
    expect(screen.getByText("AI-Powered")).toBeInTheDocument();

    // Check approved starting prices in INR format
    expect(screen.getByText("₹999")).toBeInTheDocument();
    expect(screen.getByText("₹2,999")).toBeInTheDocument();
    expect(screen.getByText("₹5,999")).toBeInTheDocument();
    expect(screen.getByText("₹12,999+")).toBeInTheDocument();
    expect(screen.getByText("₹19,999+")).toBeInTheDocument();
    expect(screen.getByText("₹24,999+")).toBeInTheDocument();
    expect(screen.getByText("₹29,999+")).toBeInTheDocument();
    expect(screen.getByText("₹34,999+")).toBeInTheDocument();
    expect(screen.getByText("₹49,999+")).toBeInTheDocument();
    expect(screen.getByText("₹59,999+")).toBeInTheDocument();

    // Most popular badge on Professional tier
    expect(screen.getByText("Most Popular Tier")).toBeInTheDocument();
  });

  it("filters packages by category tabs", () => {
    render(<PricingTable />);

    // Filter to Websites & Portals (3)
    const websitesTab = screen.getByRole("button", { name: /Websites & Portals/i });
    fireEvent.click(websitesTab);
    expect(screen.getByText("Basic Static")).toBeInTheDocument();
    expect(screen.getByText("Standard Business")).toBeInTheDocument();
    expect(screen.getByText("Professional")).toBeInTheDocument();
    expect(screen.queryByText("AI-Powered")).not.toBeInTheDocument();

    // Filter to Enterprise & AI (3)
    const enterpriseTab = screen.getByRole("button", { name: /Enterprise & AI/i });
    fireEvent.click(enterpriseTab);
    expect(screen.getByText("AI-Powered")).toBeInTheDocument();
    expect(screen.getByText("ERP & CRM")).toBeInTheDocument();
    expect(screen.getByText("LMS")).toBeInTheDocument();
    expect(screen.queryByText("Basic Static")).not.toBeInTheDocument();

    // Reset to All Tiers
    const allTab = screen.getByRole("button", { name: /All Approved Tiers/i });
    fireEvent.click(allTab);
    expect(screen.getByText("Basic Static")).toBeInTheDocument();
    expect(screen.getByText("AI-Powered")).toBeInTheDocument();
  });

  it("provides package selection links pointing to /contact with package slug", () => {
    render(<PricingTable />);
    const selectLinks = screen.getAllByRole("link", { name: /Select Package/i });
    expect(selectLinks.length).toBe(10);
    expect(selectLinks[0]).toHaveAttribute("href", "/contact?package=basic-static");
  });
});

describe("Phase 6: Interactive Pricing Calculator", () => {
  it("renders default category and baseline price calculation", () => {
    render(<PricingCalculator />);

    expect(screen.getByText("Interactive Project Estimator")).toBeInTheDocument();
    expect(screen.getByText("1. Select Project Category")).toBeInTheDocument();

    // Default package is basic-static: ₹999 (present in baseline option & estimate summary)
    expect(screen.getAllByText("₹999").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Basic Static Website").length).toBeGreaterThan(0);
  });

  it("updates baseline when changing project discipline category", () => {
    render(<PricingCalculator />);

    // Select SaaS Platform category (radio button)
    const saasCategoryBtn = screen.getByRole("radio", { name: /SaaS Platform/i });
    fireEvent.click(saasCategoryBtn);

    // Baseline updates to SaaS package (₹24,999)
    expect(screen.getAllByText("₹24,999+").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SaaS Development").length).toBeGreaterThan(0);
  });

  it("recalculates total when toggling add-on integrations", () => {
    render(<PricingCalculator />);

    // Add User Authentication & RBAC (₹5,000) to Basic Static (₹999) => ₹5,999+
    const authAddonBtn = screen.getByText("User Authentication & RBAC").closest("button")!;
    fireEvent.click(authAddonBtn);

    expect(screen.getAllByText("₹5,999+").length).toBeGreaterThan(0);
    expect(screen.getByText("Selected Add-ons (1):")).toBeInTheDocument();
  });

  it("flags custom quotation when a bespoke add-on is selected", () => {
    render(<PricingCalculator />);

    // Select Legacy Database Migration (Custom Quote: price null)
    const legacyAddonBtn = screen.getByText("Legacy Database Migration").closest("button")!;
    fireEvent.click(legacyAddonBtn);

    expect(screen.getByText("+ Custom Scope Additions")).toBeInTheDocument();
  });

  it("applies delivery urgency multiplier for Priority Sprint (+25%)", () => {
    render(<PricingCalculator />);

    // Select Priority Sprint button
    const priorityBtn = screen.getByText("Priority Sprint").closest("button")!;
    fireEvent.click(priorityBtn);

    // Basic Static ₹999 + 25% = ₹1,249
    expect(screen.getAllByText("₹1,249+").length).toBeGreaterThan(0);
    expect(screen.getByText("Priority Sprint (+25%)")).toBeInTheDocument();
  });

  it("resets calculator to initial state", () => {
    render(<PricingCalculator />);

    // Change category to Mobile App
    const mobileBtn = screen.getByRole("radio", { name: /Mobile App/i });
    fireEvent.click(mobileBtn);
    expect(screen.getAllByText("₹12,999+").length).toBeGreaterThan(0);

    // Click Reset
    const resetBtn = screen.getByRole("button", { name: /Reset Calculator/i });
    fireEvent.click(resetBtn);

    // Restores default Basic Static (₹999)
    expect(screen.getAllByText("₹999").length).toBeGreaterThan(0);
  });
});

describe("Phase 6: Multi-Step Contact Enquiry Form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("category");
    mockSearchParams.delete("package");
    mockSearchParams.delete("addons");
    mockSearchParams.delete("timeline");
  });

  it("navigates through steps 1 -> 2 -> 3 with progressive validation", async () => {
    render(<ContactEnquiryForm />);

    // Step 1: Select Category
    expect(screen.getByText("STEP 1 OF 3")).toBeInTheDocument();
    const nextBtn1 = screen.getByRole("button", { name: /Continue: Technical Specs/i });
    fireEvent.click(nextBtn1);

    // Step 2: Technical Specs
    expect(screen.getByText("STEP 2 OF 3")).toBeInTheDocument();

    // Fill message (required min 10 chars)
    const messageInput = screen.getByPlaceholderText(/E\.g\., We need a Next\.js multi-tenant SaaS/i);
    fireEvent.change(messageInput, {
      target: { value: "We need a complete custom web app with PostgreSQL and authentication." },
    });

    const nextBtn2 = screen.getByRole("button", { name: /Continue: Contact Info/i });
    fireEvent.click(nextBtn2);

    // Step 3: Contact Info
    expect(screen.getByText("STEP 3 OF 3")).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Work Email/i)).toBeInTheDocument();
  });

  it("validates required fields on step 3 before allowing submission", async () => {
    render(<ContactEnquiryForm />);

    // Advance to Step 2
    fireEvent.click(screen.getByRole("button", { name: /Continue: Technical Specs/i }));

    // Fill brief
    fireEvent.change(screen.getByPlaceholderText(/E\.g\., We need a Next\.js multi-tenant SaaS/i), {
      target: { value: "Detailed requirements specification for enterprise development." },
    });

    // Advance to Step 3
    fireEvent.click(screen.getByRole("button", { name: /Continue: Contact Info/i }));

    // Attempt to submit without filling name or email
    const submitBtn = screen.getByRole("button", { name: /Submit Project Enquiry/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText("Full name must be at least 2 characters long")).toBeInTheDocument();
    expect(await screen.findByText("Please provide a valid work email address")).toBeInTheDocument();
  });

  it("displays success screen when enquiry is submitted successfully", async () => {
    vi.spyOn(enquiriesRepo, "createEnquiry").mockResolvedValueOnce({
      id: "ENQ-TEST-SUCCESS-101",
      name: "Siddharth Rao",
      email: "siddharth@startup.io",
      phone: "+91 9988776655",
      companyName: "Hyperion Labs",
      serviceCategory: "WEB_DEVELOPMENT",
      budgetRange: "15K_TO_50K",
      timeline: "1_TO_3_MONTHS",
      message: "Building a high-throughput developer dashboard.",
      selectedPackage: "premium-custom",
      additionalConfig: null,
      referenceUrl: null,
      consentGiven: true,
      status: "NEW",
      ipHash: null,
      userAgent: null,
      internalNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    render(<ContactEnquiryForm />);

    // Advance to Step 2
    fireEvent.click(screen.getByRole("button", { name: /Continue: Technical Specs/i }));

    // Fill Step 2
    fireEvent.change(screen.getByPlaceholderText(/E\.g\., We need a Next\.js multi-tenant SaaS/i), {
      target: { value: "Building a high-throughput developer dashboard with Next.js." },
    });

    // Advance to Step 3
    fireEvent.click(screen.getByRole("button", { name: /Continue: Contact Info/i }));

    // Fill Step 3
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: "Siddharth Rao" } });
    fireEvent.change(screen.getByLabelText(/Work Email/i), { target: { value: "siddharth@startup.io" } });
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: "+91 9988776655" } });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /Submit Project Enquiry/i }));

    expect(await screen.findByText("Enquiry Successfully Received!")).toBeInTheDocument();
    expect(screen.getByText("ENQ-TEST-SUCCESS-101")).toBeInTheDocument();
    expect(screen.getByText("Confirmation Email")).toBeInTheDocument();
    expect(screen.getByText("Engineering Scoping")).toBeInTheDocument();
  });

  it("preserves form state and displays error alert when server encounters failure", async () => {
    vi.spyOn(enquiriesRepo, "createEnquiry").mockRejectedValueOnce(
      new Error("Database service unavailable")
    );

    render(<ContactEnquiryForm />);

    // Advance to Step 2
    fireEvent.click(screen.getByRole("button", { name: /Continue: Technical Specs/i }));

    const briefText = "Critical enterprise web application requirements for logistics.";
    fireEvent.change(screen.getByPlaceholderText(/E\.g\., We need a Next\.js multi-tenant SaaS/i), {
      target: { value: briefText },
    });

    // Advance to Step 3
    fireEvent.click(screen.getByRole("button", { name: /Continue: Contact Info/i }));

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: "Anita Desai" } });
    fireEvent.change(screen.getByLabelText(/Work Email/i), { target: { value: "anita@enterprise.in" } });

    fireEvent.click(screen.getByRole("button", { name: /Submit Project Enquiry/i }));

    // Error alert banner should be rendered
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Submission Interrupted")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry Submission/i })).toBeInTheDocument();

    // Data must be preserved
    expect(screen.getByDisplayValue("Anita Desai")).toBeInTheDocument();
    expect(screen.getByDisplayValue("anita@enterprise.in")).toBeInTheDocument();
  });
});

describe("Phase 6: Server Action & API Route Processing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submitEnquiryAction rejects honeypot bot trap silently", async () => {
    const result = await submitEnquiryAction({
      name: "Spam Bot",
      email: "bot@spammer.org",
      serviceCategory: "WEB_DEVELOPMENT",
      message: "Buy cheap backlinks today at our spam portal.",
      website_url: "https://spam.net", // Honeypot populated!
      consentGiven: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Spam submission detected.");
  });

  it("submitEnquiryAction rejects duplicate submissions within cooldown window", async () => {
    const payload = {
      name: "Coordinated Lead",
      email: `lead_${Date.now()}@testcorp.com`,
      serviceCategory: "API_BACKEND" as const,
      message: "Testing duplicate rate limiter prevention window.",
      selectedPackage: "premium-custom",
      consentGiven: true,
    };

    vi.spyOn(enquiriesRepo, "createEnquiry").mockResolvedValue({
      id: "ENQ-DUP-001",
      ...payload,
      phone: null,
      companyName: null,
      budgetRange: null,
      timeline: null,
      additionalConfig: null,
      referenceUrl: null,
      status: "NEW",
      ipHash: null,
      userAgent: null,
      internalNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res1 = await submitEnquiryAction(payload, "192.168.1.50");
    expect(res1.success).toBe(true);

    // Immediate second submission with identical payload
    const res2 = await submitEnquiryAction(payload, "192.168.1.50");
    expect(res2.success).toBe(false);
    expect(res2.error).toContain("An identical enquiry was recently submitted");
  });

  it("submitEnquiryAction dispatches emails non-blockingly upon database persistence", async () => {
    const emailSpy = vi.spyOn(emailService, "dispatchEnquiryNotifications").mockResolvedValue({
      customerEmailSuccess: true,
      adminEmailSuccess: true,
      errors: [],
    });

    const uniqueEmail = `real_lead_${Date.now()}@agency.com`;
    vi.spyOn(enquiriesRepo, "createEnquiry").mockResolvedValueOnce({
      id: "ENQ-PERSISTED-777",
      name: "Dev Lead",
      email: uniqueEmail,
      phone: "+91 9876543210",
      companyName: "DevCorp",
      serviceCategory: "AI_AUTOMATION",
      budgetRange: "50K_PLUS",
      timeline: "URGENT_UNDER_1_MONTH",
      message: "Need autonomous AI agent for pipeline routing.",
      selectedPackage: "ai-powered",
      additionalConfig: null,
      referenceUrl: null,
      consentGiven: true,
      status: "NEW",
      ipHash: null,
      userAgent: null,
      internalNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await submitEnquiryAction(
      {
        name: "Dev Lead",
        email: uniqueEmail,
        phone: "+91 9876543210",
        serviceCategory: "AI_AUTOMATION",
        message: "Need autonomous AI agent for pipeline routing.",
        selectedPackage: "ai-powered",
        consentGiven: true,
      },
      "10.0.0.99"
    );

    expect(result.success).toBe(true);
    expect(result.enquiryId).toBe("ENQ-PERSISTED-777");
    expect(emailSpy).toHaveBeenCalled();
  });

  it("POST /api/enquiries returns 201 on valid submission", async () => {
    const uniqueEmail = `api_lead_${Date.now()}@client.org`;
    vi.spyOn(enquiriesRepo, "createEnquiry").mockResolvedValueOnce({
      id: "ENQ-API-SUCCESS-999",
      name: "API Tester",
      email: uniqueEmail,
      phone: null,
      companyName: null,
      serviceCategory: "WEB_DEVELOPMENT",
      budgetRange: null,
      timeline: null,
      message: "Testing API route submission from external form.",
      selectedPackage: "professional",
      additionalConfig: null,
      referenceUrl: null,
      consentGiven: true,
      status: "NEW",
      ipHash: null,
      userAgent: null,
      internalNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = new NextRequest("http://localhost:3000/api/enquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "10.0.0.1",
      },
      body: JSON.stringify({
        name: "API Tester",
        email: uniqueEmail,
        serviceCategory: "WEB_DEVELOPMENT",
        message: "Testing API route submission from external form.",
        selectedPackage: "professional",
        consentGiven: true,
      }),
    });

    const response = await enquiriesRouteHandler(req);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.enquiryId).toBe("ENQ-API-SUCCESS-999");
  });

  it("POST /api/enquiries returns 400 on malformed schema payload", async () => {
    const req = new NextRequest("http://localhost:3000/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "X", // too short
        email: "not-an-email",
        message: "short",
      }),
    });

    const response = await enquiriesRouteHandler(req);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.details).toBeDefined();
  });
});
