import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as navigation from "next/navigation";
import AboutPage from "@/app/about/page";
import PortfolioPage from "@/app/portfolio/page";
import ProjectCaseStudyPage, {
  generateStaticParams,
  generateMetadata,
} from "@/app/portfolio/[slug]/page";
import { PortfolioFilter } from "@/components/sections/portfolio-filter";
import { getAllProjects } from "@/server/repositories/portfolio.repo";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/about",
  notFound: vi.fn(),
}));

describe("Phase 5: Dedicated About Page (/about)", () => {
  it("renders the hero section with approved headline, copy, and portfolio CTA", () => {
    const { container } = render(<AboutPage />);

    expect(screen.getByText(/Engineering Ideas Into/i)).toBeInTheDocument();
    expect(screen.getByText(/Digital Reality\./i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /VOIDTECH SOLUTION builds practical digital products through modern engineering, thoughtful design, and technology-driven problem solving\./i
      )
    ).toBeInTheDocument();

    const portfolioCta = container.querySelector('a[href="/portfolio"]');
    expect(portfolioCta).toBeInTheDocument();
    expect(portfolioCta?.textContent).toContain("Explore Our Work");
  });

  it("renders authentic Who We Are narrative without fabricated stats or fake certifications", () => {
    render(<AboutPage />);

    expect(screen.getByText("WHO WE ARE")).toBeInTheDocument();
    expect(
      screen.getByText(/An Engineering-First Digital Solutions Studio\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/VOIDTECH SOLUTION was created to bridge the divide/i)
    ).toBeInTheDocument();

    // Verify absence of fabricated claims
    expect(screen.queryByText(/500\+ Happy Clients/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ISO 9001 Certified/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Fortune 500 Trusted/i)).not.toBeInTheDocument();
  });

  it("renders exact Mission and Vision statements", () => {
    render(<AboutPage />);

    expect(
      screen.getByText(
        "Transform ideas into reliable, useful and maintainable digital solutions."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Make modern technology more accessible to businesses and innovators through thoughtful software engineering."
      )
    ).toBeInTheDocument();
  });

  it("renders all 6 approved Core Value pillars", () => {
    render(<AboutPage />);

    const values = [
      "Engineering Quality",
      "Transparent Communication",
      "Practical Innovation",
      "Maintainable Architecture",
      "User-Centered Design",
      "Continuous Improvement",
    ];

    for (const val of values) {
      expect(screen.getByText(val)).toBeInTheDocument();
    }
  });

  it("renders all 6 structured Engineering Approach phases", () => {
    render(<AboutPage />);

    const phases = [
      "Understand the requirement",
      "Define the architecture",
      "Design the experience",
      "Develop the solution",
      "Test thoroughly",
      "Deliver and support",
    ];

    for (const phase of phases) {
      expect(screen.getByText(phase)).toBeInTheDocument();
    }
  });

  it("renders categorized Technology Stack matrix without fabricated partnerships", () => {
    render(<AboutPage />);

    expect(screen.getByText("Frontend Engineering")).toBeInTheDocument();
    expect(screen.getByText("Backend & Systems")).toBeInTheDocument();
    expect(screen.getByText("Database & Storage")).toBeInTheDocument();
    expect(screen.getByText("AI & Automation")).toBeInTheDocument();
    expect(screen.getByText("Mobile Platforms")).toBeInTheDocument();
    expect(screen.getByText("Cloud & DevOps")).toBeInTheDocument();
    expect(screen.getByText("Design & User Experience")).toBeInTheDocument();

    // Verify key technologies are listed
    expect(screen.getByText("Next.js (App Router)")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
    expect(screen.getByText("Docker")).toBeInTheDocument();
  });

  it("renders closing collaboration CTA linking to /#contact", () => {
    const { container } = render(<AboutPage />);

    expect(screen.getByText("Have an idea worth building?")).toBeInTheDocument();
    const contactLinks = container.querySelectorAll('a[href="/#contact"]');
    expect(contactLinks.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Phase 5: Dedicated Portfolio Discovery Page (/portfolio)", () => {
  it("renders portfolio hero with approved headline and positioning", async () => {
    const pageComponent = await PortfolioPage();
    render(pageComponent);

    expect(screen.getByText(/Selected Work &/i)).toBeInTheDocument();
    expect(screen.getByText(/Engineering Concepts\./i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Explore software concepts, architecture experiments and digital solutions developed around practical engineering challenges\./i
      )
    ).toBeInTheDocument();
    expect(screen.getByText("AUTHENTIC LAB PROTOTYPES")).toBeInTheDocument();
  });

  it("displays project cards with explicit CONCEPT badges and simulated benchmarks", async () => {
    const pageComponent = await PortfolioPage();
    render(pageComponent);

    const conceptBadges = screen.getAllByText("CONCEPT");
    expect(conceptBadges.length).toBeGreaterThanOrEqual(2);

    expect(
      screen.getByText("Algorithmic Liquidity & Execution Engine")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Autonomous Cloud Ops Agent")
    ).toBeInTheDocument();

    const simulatedBadges = screen.getAllByText("SIMULATED BENCHMARK");
    expect(simulatedBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("allows interactive client-side industry filtering", async () => {
    const allProjects = await getAllProjects();
    render(<PortfolioFilter initialProjects={allProjects} />);

    // Click on FINTECH filter pill
    const fintechPill = screen.getByRole("radio", { name: "FINTECH" });
    fireEvent.click(fintechPill);

    // FINTECH project should be visible
    expect(
      screen.getByText("Algorithmic Liquidity & Execution Engine")
    ).toBeInTheDocument();

    // Non-FINTECH project should not be visible
    expect(
      screen.queryByText("Autonomous Cloud Ops Agent")
    ).not.toBeInTheDocument();

    // Click All Projects pill to restore
    const allPill = screen.getByRole("radio", { name: "All Projects" });
    fireEvent.click(allPill);

    expect(
      screen.getByText("Autonomous Cloud Ops Agent")
    ).toBeInTheDocument();
  });

  it("allows interactive search input filtering", async () => {
    const allProjects = await getAllProjects();
    render(<PortfolioFilter initialProjects={allProjects} />);

    const searchInput = screen.getByLabelText(
      "Search projects by keyword or technology"
    );

    // Search for "LangGraph"
    fireEvent.change(searchInput, { target: { value: "LangGraph" } });

    expect(
      screen.getByText("Autonomous Cloud Ops Agent")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Algorithmic Liquidity & Execution Engine")
    ).not.toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: "" } });
    expect(
      screen.getByText("Algorithmic Liquidity & Execution Engine")
    ).toBeInTheDocument();
  });

  it("renders a friendly empty state when search matches zero projects", async () => {
    const allProjects = await getAllProjects();
    render(<PortfolioFilter initialProjects={allProjects} />);

    const searchInput = screen.getByLabelText(
      "Search projects by keyword or technology"
    );

    fireEvent.change(searchInput, {
      target: { value: "non-existent-quantum-crypto-xyz" },
    });

    expect(
      screen.getByText("No matching projects found")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Clear All Filters")
    ).toBeInTheDocument();

    // Resetting filters restores projects
    fireEvent.click(screen.getByText("Clear All Filters"));
    expect(
      screen.getByText("Algorithmic Liquidity & Execution Engine")
    ).toBeInTheDocument();
  });
});

describe("Phase 5: Dynamic Case Study Route (/portfolio/[slug])", () => {
  it("generates static params for all known projects", async () => {
    const params = await generateStaticParams();
    expect(params.length).toBeGreaterThanOrEqual(2);
    expect(params).toContainEqual({ slug: "algorithmic-liquidity-engine" });
    expect(params).toContainEqual({ slug: "autonomous-ai-ops-agent" });
  });

  it("generates metadata with case study title and summary", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "algorithmic-liquidity-engine" }),
    });

    expect(meta.title).toContain("Algorithmic Liquidity & Execution Engine");
    expect(meta.description).toContain("High-frequency simulated order routing prototype");
  });

  it("renders full case study layout for a valid project slug", async () => {
    const pageComponent = await ProjectCaseStudyPage({
      params: Promise.resolve({ slug: "algorithmic-liquidity-engine" }),
    });
    const { container } = render(pageComponent);

    // Breadcrumb navigation
    expect(screen.getByLabelText("Breadcrumb")).toBeInTheDocument();

    // Hero title & badges
    expect(
      screen.getByRole("heading", {
        name: "Algorithmic Liquidity & Execution Engine",
        level: 1,
      })
    ).toBeInTheDocument();
    expect(screen.getAllByText("FINTECH").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("CONCEPT").length).toBeGreaterThanOrEqual(1);

    // Problem & Solution
    expect(screen.getByText("The Architectural Challenge")).toBeInTheDocument();
    expect(screen.getByText("Problem & Constraints")).toBeInTheDocument();
    expect(screen.getByText("The Engineered Solution")).toBeInTheDocument();
    expect(screen.getByText("Design & Architecture")).toBeInTheDocument();

    // System Architecture Blueprint
    expect(
      screen.getByText("System Architecture Blueprint")
    ).toBeInTheDocument();

    // Simulated benchmark results
    expect(
      screen.getByText("Evaluation & Benchmark Results")
    ).toBeInTheDocument();
    expect(screen.getByText("Simulated Throughput")).toBeInTheDocument();
    expect(screen.getByText("250k req/s")).toBeInTheDocument();

    // Technologies & CTA
    expect(
      screen.getByText("Technologies & Infrastructure")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Facing a similar engineering challenge?")
    ).toBeInTheDocument();

    const ctaLink = container.querySelector('a[href="/#contact"]');
    expect(ctaLink).toBeInTheDocument();
  });

  it("triggers notFound() when project slug does not exist", async () => {
    const notFoundMock = vi.mocked(navigation.notFound);

    try {
      await ProjectCaseStudyPage({
        params: Promise.resolve({ slug: "invalid-nonexistent-project-xyz" }),
      });
    } catch {
      // notFound throws in Next.js environment
    }

    expect(notFoundMock).toHaveBeenCalled();
  });
});
