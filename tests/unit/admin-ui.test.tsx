import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import * as authActions from "@/server/actions/auth.actions";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === "callbackUrl" ? "/admin/users" : null),
  }),
  usePathname: () => "/admin",
}));

// Mock auth.actions
vi.mock("@/server/actions/auth.actions", () => ({
  loginAction: vi.fn(),
  logoutAction: vi.fn(),
  getCurrentAdmin: vi.fn(),
}));

describe("Milestone 7.4: Admin UI Components & Role-Aware Shell", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error Mocking window.location for jsdom
    delete window.location;
    // @ts-expect-error Mocking window.location for jsdom
    window.location = { ...originalLocation, href: "", assign: vi.fn(), replace: vi.fn() };
  });

  describe("AdminLoginForm", () => {
    it("renders the login form with accessible inputs and security disclaimers", () => {
      render(<AdminLoginForm />);

      expect(screen.getByRole("heading", { name: "Admin Console" })).toBeInTheDocument();
      expect(screen.getByLabelText(/Administrator Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Master Password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Remember session on this device/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Authenticate" })).toBeInTheDocument();
      expect(screen.getByText(/RESTRICTED PORTAL:/i)).toBeInTheDocument();
    });

    it("displays error message when submitted with empty fields", async () => {
      render(<AdminLoginForm />);
      const submitBtn = screen.getByRole("button", { name: "Authenticate" });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Email address is required.");
      });
    });

    it("displays error message when password is shorter than 8 characters", async () => {
      render(<AdminLoginForm />);
      const emailInput = screen.getByLabelText(/Administrator Email/i);
      const passwordInput = screen.getByLabelText(/Master Password/i);
      const submitBtn = screen.getByRole("button", { name: "Authenticate" });

      fireEvent.change(emailInput, { target: { value: "admin@voidtechsolution.com" } });
      fireEvent.change(passwordInput, { target: { value: "short" } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Password must be at least 8 characters.");
      });
    });

    it("displays server error banner when loginAction fails", async () => {
      vi.mocked(authActions.loginAction).mockResolvedValueOnce({
        success: false,
        error: "Invalid email or password.",
      });

      render(<AdminLoginForm />);
      const emailInput = screen.getByLabelText(/Administrator Email/i);
      const passwordInput = screen.getByLabelText(/Master Password/i);
      const submitBtn = screen.getByRole("button", { name: "Authenticate" });

      fireEvent.change(emailInput, { target: { value: "admin@voidtechsolution.com" } });
      fireEvent.change(passwordInput, { target: { value: "wrongpassword123" } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Invalid email or password.");
      });
      expect(authActions.loginAction).toHaveBeenCalledWith({
        email: "admin@voidtechsolution.com",
        password: "wrongpassword123",
        rememberMe: false,
      });
    });

    it("toggles password visibility on reveal button click", () => {
      render(<AdminLoginForm />);
      const passwordInput = screen.getByLabelText(/Master Password/i);
      const toggleBtn = screen.getByLabelText("Show password");

      expect(passwordInput).toHaveAttribute("type", "password");

      fireEvent.click(toggleBtn);
      expect(passwordInput).toHaveAttribute("type", "text");
      expect(screen.getByLabelText("Hide password")).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText("Hide password"));
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  describe("AdminSidebar (Role-Aware Navigation)", () => {
    it("renders full navigation suite for SUPER_ADMIN with exact destination URLs", () => {
      render(<AdminSidebar role="SUPER_ADMIN" />);

      expect(screen.getByRole("link", { name: /Overview/i })).toHaveAttribute("href", "/admin");
      expect(screen.getByRole("link", { name: /Enquiries/i })).toHaveAttribute("href", "/admin/enquiries");
      expect(screen.getByRole("link", { name: /Services/i })).toHaveAttribute("href", "/admin/services");
      expect(screen.getByRole("link", { name: /Pricing Tiers/i })).toHaveAttribute("href", "/admin/pricing");
      expect(screen.getByRole("link", { name: /Portfolio/i })).toHaveAttribute("href", "/admin/portfolio");
      expect(screen.getByRole("link", { name: /Knowledgebase \(FAQ\)/i })).toHaveAttribute("href", "/admin/faqs");
      expect(screen.getByRole("link", { name: /Team & Access/i })).toHaveAttribute("href", "/admin/users");
      expect(screen.getByRole("link", { name: /Audit Trail/i })).toHaveAttribute("href", "/admin/audit-logs");
      expect(screen.getByRole("link", { name: /Platform Settings/i })).toHaveAttribute("href", "/admin/settings");
      expect(screen.getByText("SUPER_ADMIN")).toBeInTheDocument();
    });

    it("hides Team & Access, Audit Trail, and Settings for ADMIN role", () => {
      render(<AdminSidebar role="ADMIN" />);

      expect(screen.getByText("Overview")).toBeInTheDocument();
      expect(screen.getByText("Enquiries")).toBeInTheDocument();
      expect(screen.getByText("Services")).toBeInTheDocument();
      expect(screen.getByText("Pricing Tiers")).toBeInTheDocument();
      expect(screen.getByText("Portfolio")).toBeInTheDocument();
      expect(screen.getByText("Knowledgebase (FAQ)")).toBeInTheDocument();

      // Restricted from ADMIN
      expect(screen.queryByText("Team & Access")).not.toBeInTheDocument();
      expect(screen.queryByText("Audit Trail")).not.toBeInTheDocument();
      expect(screen.queryByText("Platform Settings")).not.toBeInTheDocument();
      expect(screen.getAllByText("ADMIN").length).toBeGreaterThanOrEqual(1);
    });

    it("hides Pricing Tiers, Team & Access, Audit Trail, and Settings for EDITOR role", () => {
      render(<AdminSidebar role="EDITOR" />);

      expect(screen.getByText("Overview")).toBeInTheDocument();
      expect(screen.getByText("Enquiries")).toBeInTheDocument();
      expect(screen.getByText("Services")).toBeInTheDocument();
      expect(screen.getByText("Portfolio")).toBeInTheDocument();
      expect(screen.getByText("Knowledgebase (FAQ)")).toBeInTheDocument();

      // Restricted from EDITOR
      expect(screen.queryByText("Pricing Tiers")).not.toBeInTheDocument();
      expect(screen.queryByText("Team & Access")).not.toBeInTheDocument();
      expect(screen.queryByText("Audit Trail")).not.toBeInTheDocument();
      expect(screen.queryByText("Platform Settings")).not.toBeInTheDocument();
      expect(screen.getByText("EDITOR")).toBeInTheDocument();
    });
  });

  describe("AdminHeader", () => {
    const user = {
      name: "Shivanshu Satyajeet",
      email: "master@voidtechsolution.com",
      role: "SUPER_ADMIN" as const,
    };

    it("renders administrator identity, role badge, and sign out CTA", () => {
      render(<AdminHeader user={user} />);

      expect(screen.getByText("Shivanshu Satyajeet")).toBeInTheDocument();
      expect(screen.getByText("master@voidtechsolution.com")).toBeInTheDocument();
      expect(screen.getByText("SUPER_ADMIN")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Sign Out/i })).toBeInTheDocument();
    });

    it("triggers logoutAction on Sign Out click", async () => {
      vi.mocked(authActions.logoutAction).mockResolvedValueOnce({
        success: true,
        redirectUrl: "/admin/login",
      });

      render(<AdminHeader user={user} />);
      const logoutBtn = screen.getByRole("button", { name: /Sign Out/i });

      fireEvent.click(logoutBtn);

      await waitFor(() => {
        expect(authActions.logoutAction).toHaveBeenCalled();
      });
    });
  });

  describe("AdminLayoutShell", () => {
    const user = {
      name: "Super Admin",
      email: "admin@voidtechsolution.com",
      role: "SUPER_ADMIN" as const,
    };

    it("renders sidebar, header, and child content", () => {
      render(
        <AdminLayoutShell user={user}>
          <div data-testid="dashboard-content">Dashboard Metrics</div>
        </AdminLayoutShell>
      );

      expect(screen.getByTestId("dashboard-content")).toBeInTheDocument();
      expect(screen.getByText("Dashboard Metrics")).toBeInTheDocument();
      expect(screen.getByText("VOIDTECH Administrative Console")).toBeInTheDocument();
    });
  });
});
