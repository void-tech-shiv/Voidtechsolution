import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ServicesPage from "@/app/services/page";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactEnquiryForm } from "@/components/sections/contact-enquiry-form";
import { ServicesFilter } from "@/components/sections/services-filter";
import { servicesRegistry } from "@/config/site";
import type { Service, ServiceCategory } from "@prisma/client";

// Mock next/navigation
let currentPathname = "/services";
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
  useSearchParams: () => mockSearchParams,
}));

describe("Public Website Multi-Page Architecture", () => {
  beforeEach(() => {
    currentPathname = "/services";
    mockSearchParams = new URLSearchParams();
  });

  describe("Dedicated /services Page", () => {
    it("renders the Services page hero with approved headlines and positioning", async () => {
      const pageComponent = await ServicesPage();
      render(pageComponent);

      expect(
        screen.getByRole("heading", { level: 1 })
      ).toHaveTextContent("Engineering Scalable Software Across 18 Core Tracks.");

      expect(
        screen.getByText(/CAPABILITY CATALOG • 18 SPECIALIZED DISCIPLINES/i)
      ).toBeInTheDocument();

      expect(screen.getByText("18")).toBeInTheDocument();
      expect(screen.getByText("Core Disciplines")).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(screen.getByText("Repo Handover")).toBeInTheDocument();
      expect(screen.getByText("From ₹999")).toBeInTheDocument();
      expect(screen.getByText("Transparent INR")).toBeInTheDocument();
      expect(screen.getByText("30-Day")).toBeInTheDocument();
      expect(screen.getByText("Bug-Fix Warranty")).toBeInTheDocument();
    });

    it("renders engineering delivery commitments and standards", async () => {
      const pageComponent = await ServicesPage();
      render(pageComponent);

      expect(screen.getByText("How We Deliver Technical Quality")).toBeInTheDocument();
      expect(screen.getByText("Test-Driven Code")).toBeInTheDocument();
      expect(screen.getByText("Full IP Handover")).toBeInTheDocument();
      expect(screen.getByText("Milestone 50/50 Terms")).toBeInTheDocument();
      expect(screen.getByText("30-Day Warranty")).toBeInTheDocument();
    });

    it("renders service and delivery FAQ section", async () => {
      const pageComponent = await ServicesPage();
      render(pageComponent);

      expect(screen.getByText("Service & Delivery Questions")).toBeInTheDocument();
      expect(
        screen.getByText(/How do we determine the best technical architecture/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/What does the full repository handover include/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Can VOIDTECH integrate with our existing APIs/i)
      ).toBeInTheDocument();
    });

    it("renders hero action CTAs linking to /contact and /pricing", async () => {
      const pageComponent = await ServicesPage();
      const { container } = render(pageComponent);

      const contactLink = container.querySelector('a[href="/contact"]');
      expect(contactLink).toBeInTheDocument();

      const pricingLink = container.querySelector('a[href="/pricing"]');
      expect(pricingLink).toBeInTheDocument();
    });
  });

  describe("Header Multi-Page Navigation & Active State", () => {
    it("renders all 6 dedicated public page routes in Header navigation", () => {
      currentPathname = "/services";
      render(<Header />);

      const desktopNav = screen.getByRole("navigation", { name: "Desktop Navigation" });
      const links = desktopNav.querySelectorAll("a");
      expect(links).toHaveLength(6);

      const expectedHrefs = ["/", "/about", "/services", "/pricing", "/portfolio", "/contact"];
      links.forEach((link, idx) => {
        expect(link).toHaveAttribute("href", expectedHrefs[idx]);
      });
    });

    it("highlights the active page link based on current pathname", () => {
      currentPathname = "/services";
      const { rerender } = render(<Header />);

      let servicesLink = screen.getByRole("link", { name: "Services" });
      expect(servicesLink).toHaveClass("text-electric-purple");

      // Switch to /pricing
      currentPathname = "/pricing";
      rerender(<Header />);
      const pricingLink = screen.getByRole("link", { name: "Pricing" });
      expect(pricingLink).toHaveClass("text-electric-purple");

      // Switch to /portfolio
      currentPathname = "/portfolio";
      rerender(<Header />);
      const portfolioLink = screen.getByRole("link", { name: "Portfolio" });
      expect(portfolioLink).toHaveClass("text-electric-purple");
    });

    it("renders mobile drawer with all 6 dedicated routes and close on link click", () => {
      currentPathname = "/services";
      render(<Header />);

      const openButton = screen.getByRole("button", { name: "Open navigation menu" });
      fireEvent.click(openButton);

      const drawer = screen.getByRole("dialog", { name: "Mobile Navigation Menu" });
      expect(drawer).toBeInTheDocument();

      const drawerServicesLink = screen.getAllByRole("link", { name: "Services" }).pop();
      expect(drawerServicesLink).toHaveAttribute("href", "/services");

      fireEvent.click(drawerServicesLink!);
      expect(screen.queryByRole("dialog", { name: "Mobile Navigation Menu" })).not.toBeInTheDocument();
    });
  });

  describe("Services Catalog CTAs & Contact Pre-filling", () => {
    const mockServices: Service[] = servicesRegistry.slice(0, 3).map((s, idx) => ({
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

    it("generates direct inquiry links to /contact with encoded service query param", () => {
      render(<ServicesFilter initialServices={mockServices} />);

      const firstService = mockServices[0]!;
      const link = screen.getByRole("link", { name: new RegExp(`Inquire for ${firstService.title}`, "i") });
      expect(link).toHaveAttribute(
        "href",
        `/contact?service=${encodeURIComponent(firstService.title)}`
      );
    });

    it("pre-fills contact form category and message when service query param is provided", () => {
      mockSearchParams = new URLSearchParams("service=Website Development");
      const { container } = render(<ContactEnquiryForm />);

      // Inquiry focus banner should be visible
      expect(screen.getByText("Website Development")).toBeInTheDocument();
      expect(screen.getByText(/Inquiry Focus:/i)).toBeInTheDocument();

      // Proceed to Step 2 to check message pre-fill
      const continueBtn = screen.getByRole("button", { name: /Continue: Technical Specs/i });
      fireEvent.click(continueBtn);

      const messageTextarea = container.querySelector("#projectBrief") as HTMLTextAreaElement;
      expect(messageTextarea).not.toBeNull();
      expect(messageTextarea.value).toContain("I would like to discuss requirements for Website Development.");
    });

    it("auto-maps mobile app service query param to MOBILE_DEVELOPMENT category", () => {
      mockSearchParams = new URLSearchParams("service=App Development");
      render(<ContactEnquiryForm />);

      expect(screen.getByText("App Development")).toBeInTheDocument();

      // Check Mobile Apps category card is selected
      const mobileButton = screen.getByRole("button", { name: /Mobile Apps/i });
      expect(mobileButton).toHaveClass("border-electric-purple");
      expect(mobileButton).toHaveClass("bg-electric-purple/15");
    });
  });

  describe("Footer Navigation", () => {
    it("renders all 6 dedicated public page routes in Footer navigation", () => {
      render(<Footer />);

      const footerNav = screen.getByRole("list", { name: "Footer Navigation Links" });
      const links = footerNav.querySelectorAll("a");
      expect(links).toHaveLength(6);

      const expectedHrefs = ["/", "/about", "/services", "/pricing", "/portfolio", "/contact"];
      links.forEach((link, idx) => {
        expect(link).toHaveAttribute("href", expectedHrefs[idx]);
      });
    });

    it("links featured services to /services catalog", () => {
      render(<Footer />);

      const capabilitiesList = screen.getByRole("list", { name: "Footer Capabilities Links" });
      const links = capabilitiesList.querySelectorAll("a");
      expect(links.length).toBeGreaterThanOrEqual(6);

      links.forEach((link) => {
        expect(link).toHaveAttribute("href", "/services");
      });
    });
  });
});
