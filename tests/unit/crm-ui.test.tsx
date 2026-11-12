import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import * as React from "react";
import { CrmDashboardKpis, formatInr } from "@/components/admin/crm/crm-dashboard-kpis";
import { CrmLeadCard, type KanbanLeadItem } from "@/components/admin/crm/crm-lead-card";
import { CrmStageColumn } from "@/components/admin/crm/crm-stage-column";
import { CrmLostReasonModal } from "@/components/admin/crm/crm-lost-reason-modal";
import { CrmFilters } from "@/components/admin/crm/crm-filters";
import { CrmFollowupsView } from "@/components/admin/crm/crm-followups-view";
import { AdminNotificationsBell } from "@/components/admin/admin-notifications-bell";
import * as crmActions from "@/server/actions/crm.actions";

// Mock server actions used by UI components
vi.mock("@/server/actions/crm.actions", () => ({
  getFollowUpsViewAction: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: "task_1",
        enquiryId: "enq_1",
        title: "Call prospective client for tech review",
        description: "Review architecture diagram",
        dueAt: new Date("2026-11-20T10:00:00Z"),
        priority: "HIGH",
        isCompleted: false,
        enquiry: {
          id: "enq_1",
          name: "Acme Corp Lead",
          companyName: "Acme Corp",
          status: "CONTACTED",
          serviceCategory: "WEB_DEVELOPMENT",
        },
        assignedTo: {
          id: "adm_1",
          name: "Lead Engineer",
          email: "lead@voidtech.com",
        },
      },
    ],
  }),
  toggleLeadFollowUpAction: vi.fn().mockResolvedValue({ success: true }),
  deleteLeadFollowUpAction: vi.fn().mockResolvedValue({ success: true }),
  getAdminNotificationsAction: vi.fn().mockResolvedValue({
    success: true,
    data: {
      unreadCount: 2,
      items: [
        {
          id: "notif_1",
          recipientId: "adm_1",
          enquiryId: "enq_1",
          type: "NEW_LEAD",
          title: "New High-Value Lead Received",
          message: "Acme Corp requested Web Development",
          isRead: false,
          createdAt: new Date(),
        },
      ],
    },
  }),
  markNotificationReadAction: vi.fn().mockResolvedValue({ success: true }),
  markAllNotificationsReadAction: vi.fn().mockResolvedValue({ success: true, data: 2 }),
}));

describe("Phase 9.2: CRM UI Components & Interactive Workflows", () => {
  describe("CrmDashboardKpis", () => {
    it("formats INR currency accurately with Indian locale grouping", () => {
      expect(formatInr(0)).toBe("₹0");
      expect(formatInr(50000)).toMatch(/₹\s*50,000/);
      expect(formatInr(1250000)).toMatch(/₹\s*12,50,000/);
    });

    it("renders all 6 top KPI cards with labels and values", () => {
      const mockMetrics: crmActions.CrmMetrics = {
        totalLeads: 15,
        newLeads: 4,
        activePipelineValueInr: 750000,
        wonRevenueInr: 1200000,
        winRatePercentage: 67,
        overdueFollowUpsCount: 2,
        stageDistribution: {
          NEW: { count: 4, totalValueInr: 200000 },
          CONTACTED: { count: 3, totalValueInr: 150000 },
          QUALIFIED: { count: 2, totalValueInr: 200000 },
          PROPOSAL_SENT: { count: 1, totalValueInr: 100000 },
          NEGOTIATION: { count: 1, totalValueInr: 100000 },
          WON: { count: 2, totalValueInr: 1200000 },
          LOST: { count: 1, totalValueInr: 150000 },
          ON_HOLD: { count: 1, totalValueInr: 50000 },
        },
      };

      render(<CrmDashboardKpis metrics={mockMetrics} />);

      expect(screen.getByText("Total Leads")).toBeInTheDocument();
      expect(screen.getByText("15")).toBeInTheDocument();

      expect(screen.getByText("New Leads")).toBeInTheDocument();
      expect(screen.getAllByText("4")[0]).toBeInTheDocument();

      expect(screen.getByText("Active Pipeline")).toBeInTheDocument();
      expect(screen.getByText(/7,50,000/)).toBeInTheDocument();

      expect(screen.getByText("Won Revenue")).toBeInTheDocument();
      expect(screen.getAllByText(/12,00,000/)[0]).toBeInTheDocument();

      expect(screen.getByText("Win Rate")).toBeInTheDocument();
      expect(screen.getByText("67%")).toBeInTheDocument();

      expect(screen.getByText("Overdue Follow-ups")).toBeInTheDocument();
      expect(screen.getAllByText("2")[0]).toBeInTheDocument();

      expect(screen.getByText("Pipeline Stage Distribution")).toBeInTheDocument();
    });
  });

  describe("CrmLeadCard", () => {
    const mockLead: KanbanLeadItem = {
      id: "lead_101",
      name: "Saurabh Sharma",
      email: "saurabh@startup.in",
      companyName: "HyperCloud Systems",
      serviceCategory: "CLOUD_HOSTING",
      status: "NEW",
      estimatedValueInr: 250000,
      createdAt: new Date("2026-11-10"),
      updatedAt: new Date("2026-11-12"),
      nextFollowUpAt: new Date("2026-11-25T10:00:00Z"),
      assignedAdmin: {
        id: "adm_1",
        name: "Dev Lead",
        email: "dev@voidtech.com",
        role: "ADMIN",
      },
      _count: {
        notes: 3,
        followUps: 1,
      },
    };

    it("renders client name, company, formatted INR value and category", () => {
      render(
        <CrmLeadCard
          lead={mockLead}
          canUpdateStatus={true}
          onSelect={vi.fn()}
          onStageChange={vi.fn()}
        />
      );

      expect(screen.getByText("Saurabh Sharma")).toBeInTheDocument();
      expect(screen.getByText("HyperCloud Systems")).toBeInTheDocument();
      expect(screen.getByText(/2,50,000/)).toBeInTheDocument();
      expect(screen.getByText("Cloud")).toBeInTheDocument();
      expect(screen.getByText("Dev Lead")).toBeInTheDocument();
    });

    it("triggers onSelect callback when clicking the card", () => {
      const handleSelect = vi.fn();
      render(
        <CrmLeadCard
          lead={mockLead}
          canUpdateStatus={true}
          onSelect={handleSelect}
          onStageChange={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText("Saurabh Sharma"));
      expect(handleSelect).toHaveBeenCalledWith(mockLead);
    });

    it("opens quick stage move dropdown and fires onStageChange", () => {
      const handleStageChange = vi.fn();
      render(
        <CrmLeadCard
          lead={mockLead}
          canUpdateStatus={true}
          onSelect={vi.fn()}
          onStageChange={handleStageChange}
        />
      );

      const menuBtn = screen.getByLabelText("Move stage for Saurabh Sharma");
      fireEvent.click(menuBtn);

      expect(screen.getByText("Move to Stage:")).toBeInTheDocument();
      const contactedBtn = screen.getByRole("menuitem", { name: /CONTACTED/i });
      fireEvent.click(contactedBtn);

      expect(handleStageChange).toHaveBeenCalledWith(mockLead, "CONTACTED");
    });
  });

  describe("CrmStageColumn", () => {
    it("renders column label, count badge, and empty state when 0 leads", () => {
      render(
        <CrmStageColumn
          stage="NEW"
          label="New Leads"
          count={0}
          totalValueInr={0}
          leads={[]}
          canUpdateStatus={true}
          onSelectLead={vi.fn()}
          onStageChange={vi.fn()}
          onDropLead={vi.fn()}
        />
      );

      expect(screen.getByText("New Leads")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
      expect(screen.getByText("No leads in New Leads")).toBeInTheDocument();
    });
  });

  describe("CrmLostReasonModal", () => {
    it("does not render when isOpen is false", () => {
      const { container } = render(
        <CrmLostReasonModal
          isOpen={false}
          leadName="Test Lead"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders modal and prevents submission with empty reason", () => {
      const handleConfirm = vi.fn();
      render(
        <CrmLostReasonModal
          isOpen={true}
          leadName="Test Lead"
          onConfirm={handleConfirm}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText("Mark Lead as Lost")).toBeInTheDocument();
      const submitBtn = screen.getByRole("button", { name: "Confirm Lost" });
      fireEvent.click(submitBtn);

      expect(
        screen.getByText(/A documented reason is mandatory/i)
      ).toBeInTheDocument();
      expect(handleConfirm).not.toHaveBeenCalled();
    });

    it("populates reason from preset button and confirms successfully", () => {
      const handleConfirm = vi.fn();
      render(
        <CrmLostReasonModal
          isOpen={true}
          leadName="Test Lead"
          onConfirm={handleConfirm}
          onCancel={vi.fn()}
        />
      );

      const presetBtn = screen.getByRole("button", {
        name: /Budget constraint/i,
      });
      fireEvent.click(presetBtn);

      const submitBtn = screen.getByRole("button", { name: "Confirm Lost" });
      fireEvent.click(submitBtn);

      expect(handleConfirm).toHaveBeenCalledWith(
        expect.stringContaining("Budget constraint")
      );
    });
  });

  describe("CrmFilters Toolbar", () => {
    it("renders view switcher and triggers search callback", () => {
      const handleSearch = vi.fn();
      const handleViewChange = vi.fn();

      render(
        <CrmFilters
          viewMode="kanban"
          onViewModeChange={handleViewChange}
          searchTerm=""
          onSearchChange={handleSearch}
          selectedCategory="ALL"
          onCategoryChange={vi.fn()}
          selectedAdminId="ALL"
          onAdminChange={vi.fn()}
          overdueOnly={false}
          onOverdueToggle={vi.fn()}
          onResetFilters={vi.fn()}
          onRefresh={vi.fn()}
          activeAdmins={[{ id: "1", name: "Admin 1" }]}
        />
      );

      expect(screen.getByText("Kanban Pipeline")).toBeInTheDocument();
      expect(screen.getByText("Follow-Up Tasks")).toBeInTheDocument();

      const searchInput = screen.getByPlaceholderText(/Search leads/i);
      fireEvent.change(searchInput, { target: { value: "Fintech" } });
      expect(handleSearch).toHaveBeenCalledWith("Fintech");

      const followupsBtn = screen.getByText("Follow-Up Tasks");
      fireEvent.click(followupsBtn);
      expect(handleViewChange).toHaveBeenCalledWith("followups");
    });
  });

  describe("CrmFollowupsView", () => {
    it("renders scheduled follow-up tasks with priority and linked lead", async () => {
      render(
        <CrmFollowupsView
          canUpdateStatus={true}
          onOpenLead={vi.fn()}
        />
      );

      expect(
        await screen.findByText("Call prospective client for tech review")
      ).toBeInTheDocument();
      expect(screen.getByText("HIGH")).toBeInTheDocument();
      expect(screen.getByText(/Lead: Acme Corp Lead/)).toBeInTheDocument();
    });
  });

  describe("AdminNotificationsBell", () => {
    it("renders bell button with unread count badge and opens popover", async () => {
      render(<AdminNotificationsBell />);

      const badge = await screen.findByText("2");
      expect(badge).toBeInTheDocument();

      const bellBtn = screen.getByLabelText("View notifications");
      await act(async () => {
        fireEvent.click(bellBtn);
      });

      expect(screen.getByText("New High-Value Lead Received")).toBeInTheDocument();
      expect(
        screen.getByText("Acme Corp requested Web Development")
      ).toBeInTheDocument();
      expect(screen.getByText("Mark all read")).toBeInTheDocument();
    });
  });
});
