import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import HomePage from "@/app/page";
import { ServicesFilter } from "@/components/sections/services-filter";
import { FaqAccordion } from "@/components/sections/faq-accordion";
import { QuickInquiry } from "@/components/sections/quick-inquiry";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { servicesRegistry } from "@/config/site";
import type { Service, FAQ, ServiceCategory } from "@prisma/client";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("Phase 4: Homepage & Marketing Experience", () => {
  it("renders the complete Homepage with all 9 strategic sections", async () => {
    const pageComponent = await HomePage();
    const { container } = render(pageComponent);

    // Section 1: Hero
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Turning Ideas Into Powerful Digital Products."
    );
    expect(screen.getByText(/We design, develop, and deliver modern digital solutions/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start Your Project/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Explore Our Services/i })).toBeInTheDocument();

    // Section 2: Brand Introduction
    expect(screen.getByText(/Technology should move your business forward/i)).toBeInTheDocument();
    expect(screen.getByText(/Purpose-Driven Design/i)).toBeInTheDocument();
    expect(screen.getByText(/Direct Code Handover/i)).toBeInTheDocument();
    expect(screen.getByText(/High-Assurance Code/i)).toBeInTheDocument();

    // Section 3: Services Showcase Heading
    expect(screen.getByText("Full-Spectrum Digital Services")).toBeInTheDocument();

    // Section 4: Why Choose VoidTech
    expect(screen.getByText("Why Partner With VoidTech")).toBeInTheDocument();
    expect(screen.getByText("Built Around Your Requirements")).toBeInTheDocument();
    expect(screen.getByText("Maintainable Software Architecture")).toBeInTheDocument();

    // Section 5: Development Process
    expect(screen.getByText("The 7-Stage Development Journey")).toBeInTheDocument();
    expect(screen.getByText("Discovery")).toBeInTheDocument();
    expect(screen.getByText("Planning")).toBeInTheDocument();
    expect(screen.getAllByText("UI/UX Design").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Development").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Testing").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Deployment").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Support").length).toBeGreaterThanOrEqual(1);

    // Section 6: Featured Projects / Concept Lab
    expect(screen.getByText("Internal Engineering Prototypes")).toBeInTheDocument();

    // Section 7: Pricing Preview
    expect(screen.getByText("Predictable Investment Tiers")).toBeInTheDocument();

    // Section 8: FAQ Preview
    expect(screen.getByText("Frequently Asked Questions")).toBeInTheDocument();

    // Section 9: Closing CTA
    expect(screen.getByText("Have an Idea? Let's Build It.")).toBeInTheDocument();

    // Check landmark sections
    expect(container.querySelector("#hero")).toBeInTheDocument();
    expect(container.querySelector("#about")).toBeInTheDocument();
    expect(container.querySelector("#services")).toBeInTheDocument();
    expect(container.querySelector("#why-us")).toBeInTheDocument();
    expect(container.querySelector("#process")).toBeInTheDocument();
    expect(container.querySelector("#portfolio")).toBeInTheDocument();
    expect(container.querySelector("#pricing")).toBeInTheDocument();
    expect(container.querySelector("#faq")).toBeInTheDocument();
    expect(container.querySelector("#contact")).toBeInTheDocument();
  });

  it("verifies all 10 approved pricing packages render with accurate INR formatting and plus signs", async () => {
    const pageComponent = await HomePage();
    render(pageComponent);

    // Verify presence of all 10 approved packages
    const expectedTiers = [
      { name: "Basic Static", price: "₹999" },
      { name: "Standard Business", price: "₹2,999" },
      { name: "Professional", price: "₹5,999" },
      { name: "Premium Custom", price: "₹12,999+" },
      { name: "E-commerce", price: "₹19,999+" },
      { name: "SaaS", price: "₹24,999+" },
      { name: "LMS", price: "₹29,999+" },
      { name: "Marketplace", price: "₹34,999+" },
      { name: "ERP & CRM", price: "₹49,999+" },
      { name: "AI-Powered", price: "₹59,999+" },
    ];

    for (const tier of expectedTiers) {
      expect(screen.getAllByText(tier.name).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(tier.price).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("verifies internal demo projects display the explicit CONCEPT label", async () => {
    const pageComponent = await HomePage();
    render(pageComponent);

    const conceptBadges = screen.getAllByText("CONCEPT");
    expect(conceptBadges.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Algorithmic Liquidity & Execution Engine")).toBeInTheDocument();
    expect(screen.getByText("Autonomous Cloud Ops Agent")).toBeInTheDocument();
  });

  describe("ServicesFilter Component", () => {
    const mockServices: Service[] = servicesRegistry.map((s, idx) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      shortDesc: s.shortDescription,
      fullDesc: s.fullDescription,
      icon: s.iconName,
      category: s.category as ServiceCategory,
      deliverables: s.deliverables,
      technologies: s.technologies,
      startingPriceInr: s.startingPriceInr || null,
      currency: "INR",
      isFeatured: s.isFeatured,
      isActive: true,
      orderIndex: idx + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    it("renders all 18 services initially", () => {
      render(<ServicesFilter initialServices={mockServices} />);
      expect(screen.getByRole("tab", { name: "All Services (18)" })).toBeInTheDocument();
      expect(screen.getByText("Website Development")).toBeInTheDocument();
      expect(screen.getByText("Custom Software Solutions")).toBeInTheDocument();
      expect(screen.getByText("UPI & Payment Solutions")).toBeInTheDocument();
    });

    it("filters services by category tab selection", () => {
      render(<ServicesFilter initialServices={mockServices} />);
      
      const mobileTab = screen.getByRole("tab", { name: "Mobile" });
      fireEvent.click(mobileTab);

      expect(screen.getByText("App Development")).toBeInTheDocument();
      expect(screen.queryByText("Website Development")).not.toBeInTheDocument();
    });

    it("filters services dynamically by keyword search", () => {
      render(<ServicesFilter initialServices={mockServices} />);
      
      const searchInput = screen.getByPlaceholderText(/Search capabilities/i);
      fireEvent.change(searchInput, { target: { value: "Telegram" } });

      expect(screen.getByText("Telegram Bots")).toBeInTheDocument();
      expect(screen.queryByText("Website Development")).not.toBeInTheDocument();
    });

    it("shows empty state when no services match search", () => {
      render(<ServicesFilter initialServices={mockServices} />);
      
      const searchInput = screen.getByPlaceholderText(/Search capabilities/i);
      fireEvent.change(searchInput, { target: { value: "NonExistentKeyword999" } });

      expect(screen.getByText("No services match your search.")).toBeInTheDocument();
      
      // Reset filter
      const resetBtn = screen.getByRole("button", { name: "Reset Filters" });
      fireEvent.click(resetBtn);
      expect(screen.getByText("Website Development")).toBeInTheDocument();
    });
  });

  describe("FaqAccordion Component", () => {
    const mockFaqs: FAQ[] = [
      {
        id: "faq-01",
        question: "What is the typical development turnaround time?",
        answer: "Landing pages deploy in 3-5 days; complex web applications take 2-6 weeks.",
        category: "GENERAL",
        orderIndex: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "faq-02",
        question: "Do you build custom solutions or use templates?",
        answer: "Every asset is engineered bespoke using modern frameworks like Next.js and Tailwind.",
        category: "TECHNICAL",
        orderIndex: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it("renders FAQ questions with accessible trigger attributes", () => {
      render(<FaqAccordion faqs={mockFaqs} />);
      
      const firstTrigger = screen.getByRole("button", {
        name: /What is the typical development turnaround time/i,
      });
      expect(firstTrigger).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText(/Landing pages deploy in 3-5 days/i)).toBeInTheDocument();
    });

    it("toggles accordion item when clicked", () => {
      render(<FaqAccordion faqs={mockFaqs} />);
      
      const secondTrigger = screen.getByRole("button", {
        name: /Do you build custom solutions/i,
      });
      expect(secondTrigger).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(secondTrigger);
      expect(secondTrigger).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText(/Every asset is engineered bespoke/i)).toBeInTheDocument();
    });

    it("renders graceful empty state when FAQ list is empty", () => {
      render(<FaqAccordion faqs={[]} />);
      expect(screen.getByText(/Frequently asked questions are being updated/i)).toBeInTheDocument();
    });
  });

  describe("QuickInquiry Component", () => {
    it("renders consultation intake banner with functional CTA navigation", () => {
      render(<QuickInquiry />);
      
      expect(screen.getByText("Have an Idea? Let's Build It.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Explore Services & Capabilities/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Review Pricing Tiers/i })).toBeInTheDocument();
      expect(screen.getByText("Structured Requirements Scoping")).toBeInTheDocument();
      expect(screen.getByText("Full Repository Handover")).toBeInTheDocument();
      expect(screen.getByText("Clear Milestone Pricing")).toBeInTheDocument();
    });
  });

  describe("Header & Footer Shared Navigation", () => {
    it("renders Header brand, 6 section anchor navigation items, and project CTA", () => {
      render(<Header />);
      expect(screen.getByLabelText("VOIDTECH SOLUTION Home")).toBeInTheDocument();
      expect(screen.getByRole("navigation", { name: "Desktop Navigation" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Start Your Project" })).toBeInTheDocument();

      // Verify all 6 navigation links (dedicated pages for About, Pricing, Portfolio & Contact, section anchor for Services)
      const expectedNav = [
        { name: "Home", href: "/" },
        { name: "About", href: "/about" },
        { name: "Services", href: "/#services" },
        { name: "Pricing", href: "/pricing" },
        { name: "Portfolio", href: "/portfolio" },
        { name: "Contact", href: "/contact" },
      ];

      for (const item of expectedNav) {
        const link = screen.getByRole("link", { name: item.name });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", item.href);
      }
    });

    it("renders Footer with valid navigation and capability anchors", () => {
      render(<Footer />);
      expect(screen.getByText("VOIDTECH SOLUTION")).toBeInTheDocument();
      expect(screen.getByRole("list", { name: "Footer Capabilities Links" })).toBeInTheDocument();
      expect(screen.getByText("Build. Launch. Grow Online.")).toBeInTheDocument();
      expect(screen.queryByText("contact@voidtechsolution.com")).not.toBeInTheDocument();
      expect(screen.getByText("voidtechsolutionsupport@gmail.com")).toBeInTheDocument();
    });

    it("verifies that all navigation anchor links map to existing sections on the Homepage", async () => {
      const pageComponent = await HomePage();
      const { container } = render(pageComponent);

      const sectionAnchors = ["about", "services", "pricing", "portfolio", "contact"];
      for (const anchor of sectionAnchors) {
        const el = container.querySelector(`#${anchor}`);
        expect(el).not.toBeNull();
      }
    });

    it("opens and closes mobile navigation drawer with accessible focus and scroll locking", () => {
      render(<Header />);

      // Initially closed
      expect(screen.queryByRole("dialog", { name: "Mobile Navigation Menu" })).not.toBeInTheDocument();

      const openButton = screen.getByRole("button", { name: "Open navigation menu" });
      expect(openButton).toHaveAttribute("aria-expanded", "false");

      // Click to open
      fireEvent.click(openButton);

      // Verify dialog is open and modal
      const drawer = screen.getByRole("dialog", { name: "Mobile Navigation Menu" });
      expect(drawer).toBeInTheDocument();
      expect(drawer).toHaveAttribute("aria-modal", "true");
      expect(openButton).toHaveAttribute("aria-expanded", "true");

      // Verify scroll lock
      expect(document.body.style.overflow).toBe("hidden");

      // Verify close button
      const closeButton = screen.getByRole("button", { name: "Close navigation drawer" });
      expect(closeButton).toBeInTheDocument();

      // Click close button
      fireEvent.click(closeButton);
      expect(screen.queryByRole("dialog", { name: "Mobile Navigation Menu" })).not.toBeInTheDocument();
      expect(document.body.style.overflow).toBe("");
    });

    it("closes mobile navigation drawer on Escape key press", () => {
      render(<Header />);

      const openButton = screen.getByRole("button", { name: "Open navigation menu" });
      fireEvent.click(openButton);
      expect(screen.getByRole("dialog", { name: "Mobile Navigation Menu" })).toBeInTheDocument();

      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("dialog", { name: "Mobile Navigation Menu" })).not.toBeInTheDocument();
      expect(document.body.style.overflow).toBe("");
    });

    it("closes mobile drawer upon selecting a navigation link", () => {
      render(<Header />);

      const openButton = screen.getByRole("button", { name: "Open navigation menu" });
      fireEvent.click(openButton);

      const mobileLinks = screen.getAllByRole("link", { name: "Services" });
      // Mobile link is inside drawer
      const drawerServicesLink = mobileLinks[mobileLinks.length - 1]!;
      fireEvent.click(drawerServicesLink);

      expect(screen.queryByRole("dialog", { name: "Mobile Navigation Menu" })).not.toBeInTheDocument();
      expect(document.body.style.overflow).toBe("");
    });
  });
});
