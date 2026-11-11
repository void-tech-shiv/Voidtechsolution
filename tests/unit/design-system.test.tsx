import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import {
  Button,
  PrimaryButton,
  SecondaryButton,
  OutlineButton,
  GhostButton,
  GlowButton,
} from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BaseCard,
  GlassCard,
  ServiceCard,
  PricingCard,
  ProjectCard,
} from "@/components/ui/card";
import { Input, Textarea, Select, Checkbox, FormLabel } from "@/components/ui/form";
import { LoadingState, EmptyState, ErrorState } from "@/components/feedback";
import { Container, Section, SectionHeading } from "@/components/layout";

describe("Phase 2: Button Components", () => {
  it("renders a standard button with text", () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole("button", { name: "Click Me" });
    expect(button).toBeInTheDocument();
  });

  it("renders PrimaryButton with primary gradient styles", () => {
    render(<PrimaryButton>Primary Action</PrimaryButton>);
    const button = screen.getByRole("button", { name: "Primary Action" });
    expect(button.className).toContain("from-electric-violet");
  });

  it("renders SecondaryButton with charcoal styles", () => {
    render(<SecondaryButton>Secondary Action</SecondaryButton>);
    const button = screen.getByRole("button", { name: "Secondary Action" });
    expect(button.className).toContain("bg-void-charcoal");
  });

  it("renders OutlineButton with electric purple outline", () => {
    render(<OutlineButton>Outline Action</OutlineButton>);
    const button = screen.getByRole("button", { name: "Outline Action" });
    expect(button.className).toContain("text-electric-purple");
  });

  it("renders GhostButton with muted hover styling", () => {
    render(<GhostButton>Ghost Action</GhostButton>);
    const button = screen.getByRole("button", { name: "Ghost Action" });
    expect(button.className).toContain("text-void-muted");
  });

  it("renders GlowButton with glowing border styling", () => {
    render(<GlowButton>Glow Action</GlowButton>);
    const button = screen.getByRole("button", { name: "Glow Action" });
    expect(button.className).toContain("shadow-glow-md");
  });

  it("disables button and shows loading state when isLoading is true", () => {
    render(<Button isLoading>Submit</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("triggers onClick callback when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Action</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Action" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe("Phase 2: Badge Component", () => {
  it("renders semantic badges with correct labels and dot indicators", () => {
    render(<Badge variant="purple" dot>Active Stage</Badge>);
    expect(screen.getByText("Active Stage")).toBeInTheDocument();
  });

  it("supports success, warning, and error badge variants", () => {
    const { rerender } = render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText("Success")).toBeInTheDocument();

    rerender(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText("Warning")).toBeInTheDocument();

    rerender(<Badge variant="error">Error</Badge>);
    expect(screen.getByText("Error")).toBeInTheDocument();
  });
});

describe("Phase 2: Card Architecture", () => {
  it("renders BaseCard and GlassCard cleanly", () => {
    render(
      <div>
        <BaseCard>Base Content</BaseCard>
        <GlassCard>Glass Content</GlassCard>
      </div>
    );
    expect(screen.getByText("Base Content")).toBeInTheDocument();
    expect(screen.getByText("Glass Content")).toBeInTheDocument();
  });

  it("renders ServiceCard with deliverables and category", () => {
    render(
      <ServiceCard
        orderNumber={1}
        category="AI_AUTOMATION"
        title="Autonomous AI Agents"
        description="Multi-agent systems with vector search."
        technologies={["Python", "LangGraph"]}
      />
    );
    expect(screen.getByText("Autonomous AI Agents")).toBeInTheDocument();
    expect(screen.getByText("AI AUTOMATION")).toBeInTheDocument();
    expect(screen.getByText("#01")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
  });

  it("renders PricingCard with popular badge and features", () => {
    render(
      <PricingCard
        isPopular
        tierName="Enterprise Squad"
        tagline="Dedicated engineering squad."
        price="$10,000"
        features={["Full Stack Team", "SLA Guarantee"]}
      />
    );
    expect(screen.getByText("Enterprise Squad")).toBeInTheDocument();
    expect(screen.getByText("Most Popular")).toBeInTheDocument();
    expect(screen.getByText("$10,000")).toBeInTheDocument();
    expect(screen.getByText("Full Stack Team")).toBeInTheDocument();
  });

  it("renders ProjectCard with client and metrics", () => {
    render(
      <ProjectCard
        client="Nova Fintech"
        industry="BANKING"
        title="Instant Settlement Portal"
        summary="Sub-second UPI payment settlement."
        techStack={["Next.js", "PostgreSQL"]}
        metrics={[{ label: "Latency", value: "85ms" }]}
      />
    );
    expect(screen.getByText("Nova Fintech")).toBeInTheDocument();
    expect(screen.getByText("Instant Settlement Portal")).toBeInTheDocument();
    expect(screen.getByText("85ms")).toBeInTheDocument();
    expect(screen.getByText("Latency")).toBeInTheDocument();
  });
});

describe("Phase 2: Form Controls", () => {
  it("renders FormLabel with required indicator", () => {
    render(<FormLabel required>Full Name</FormLabel>);
    expect(screen.getByText("Full Name")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("renders Input with label, placeholder, and helper text", () => {
    render(
      <Input
        label="Business Email"
        placeholder="alex@company.com"
        helperText="We will never share your email."
      />
    );
    expect(screen.getByLabelText("Business Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("alex@company.com")).toBeInTheDocument();
    expect(screen.getByText("We will never share your email.")).toBeInTheDocument();
  });

  it("displays error message on Input when error prop is provided", () => {
    render(<Input label="Email" error="Invalid email address" />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Invalid email address");
  });

  it("renders Textarea with accessible label", () => {
    render(<Textarea label="Project Details" placeholder="Type here..." />);
    expect(screen.getByLabelText("Project Details")).toBeInTheDocument();
  });

  it("renders Select with options", () => {
    render(
      <Select
        label="Service"
        options={[
          { label: "Web", value: "web" },
          { label: "Mobile", value: "mobile" },
        ]}
      />
    );
    expect(screen.getByLabelText("Service")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders Checkbox and handles state changes", () => {
    const handleChange = vi.fn();
    render(<Checkbox label="Agree to terms" onChange={handleChange} />);
    const checkbox = screen.getByLabelText("Agree to terms");
    fireEvent.click(checkbox);
    expect(handleChange).toHaveBeenCalled();
  });
});

describe("Phase 2: Feedback States", () => {
  it("renders LoadingState with message", () => {
    render(<LoadingState message="Processing request..." />);
    expect(screen.getByRole("status")).toHaveTextContent("Processing request...");
  });

  it("renders EmptyState with action button", () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No Results"
        description="Try adjusting your filters."
        action={{ label: "Reset", onClick: handleAction }}
      />
    );
    expect(screen.getByText("No Results")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it("renders ErrorState with retry trigger", () => {
    const handleRetry = vi.fn();
    render(
      <ErrorState
        title="Failed to Load"
        message="Network connection timed out."
        onRetry={handleRetry}
      />
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});

describe("Phase 2: Layout Primitives", () => {
  it("renders Container, Section, and SectionHeading", () => {
    render(
      <Section>
        <Container>
          <SectionHeading
            badge="OVERVIEW"
            title="Design"
            highlightedText="System"
            description="Component architecture."
          />
          <p>Section Body</p>
        </Container>
      </Section>
    );
    expect(screen.getByText("OVERVIEW")).toBeInTheDocument();
    expect(screen.getByText(/Design/)).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
    expect(screen.getByText("Section Body")).toBeInTheDocument();
  });
});
