import { describe, it, expect, vi } from "vitest";

import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { RevisionDiffDialog } from "@/components/admin/cms/revision-diff-dialog";
import { AdminTestimonialsClient } from "@/components/admin/cms/admin-testimonials-client";
import { AdminPageSectionsClient } from "@/components/admin/cms/admin-page-sections-client";
import { AdminMediaClient } from "@/components/admin/cms/admin-media-client";

describe("Phase 10.2: CMS Admin Components & Interactive Workflows", () => {
  describe("RevisionDiffDialog", () => {
    it("renders side-by-side comparison and highlights modified fields", () => {
      const leftData = {
        title: "Original Service Title",
        priceInr: 25000,
        currency: "INR",
      };
      const rightData = {
        title: "Updated Service Title",
        priceInr: 35000,
        currency: "INR", // unchanged
      };

      const onClose = vi.fn();
      const onRestore = vi.fn();

      render(
        <RevisionDiffDialog
          isOpen={true}
          onClose={onClose}
          title="Compare Revisions: v1 vs v2"
          leftTitle="Published v1"
          leftData={leftData}
          rightTitle="Working Draft v2"
          rightData={rightData}
          onRestore={onRestore}
          restoreLabel="Rollback to v1"
        />
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Compare Revisions: v1 vs v2")).toBeInTheDocument();
      expect(screen.getByText("Published v1")).toBeInTheDocument();
      expect(screen.getByText("Working Draft v2")).toBeInTheDocument();

      // Check field values
      expect(screen.getByText("Original Service Title")).toBeInTheDocument();
      expect(screen.getByText("Updated Service Title")).toBeInTheDocument();

      // Check modified tag
      const modifiedBadges = screen.getAllByText("Modified");
      expect(modifiedBadges.length).toBe(2); // title and priceInr

      // Test restore button
      const restoreBtn = screen.getByRole("button", { name: /Rollback to v1/i });
      fireEvent.click(restoreBtn);
      expect(onRestore).toHaveBeenCalled();

      // Test dismiss button
      const dismissBtn = screen.getByRole("button", { name: /Dismiss/i });
      fireEvent.click(dismissBtn);
      expect(onClose).toHaveBeenCalled();
    });

    it("renders nothing when isOpen is false", () => {
      const { container } = render(
        <RevisionDiffDialog
          isOpen={false}
          onClose={vi.fn()}
          title="Closed Dialog"
          leftData={{}}
          rightData={{}}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("AdminTestimonialsClient", () => {
    const mockTestimonials = [
      {
        id: "t_1",
        clientName: "Jane Smith",
        clientRole: "CEO",
        clientCompany: "Innovate Ltd",
        content: "Outstanding software engineering and execution.",
        verificationStatus: "UNVERIFIED",
        clientConsentStatus: "PENDING",
        isActive: false,
      },
      {
        id: "t_2",
        clientName: "John Doe",
        clientRole: "CTO",
        clientCompany: "Scale AI",
        content: "Delivered scalable microservices ahead of schedule.",
        verificationStatus: "VERIFIED",
        clientConsentStatus: "GRANTED",
        isActive: true,
      },
    ];

    it("renders testimonial rows with status badges and action buttons", () => {
      render(
        <AdminTestimonialsClient
          initialTestimonials={mockTestimonials}
          userRole="ADMIN"
        />
      );

      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Innovate Ltd", { exact: false })).toBeInTheDocument();
      expect(screen.getByText("UNVERIFIED")).toBeInTheDocument();
      expect(screen.getByText("PENDING")).toBeInTheDocument();

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("VERIFIED")).toBeInTheDocument();
      expect(screen.getByText("GRANTED")).toBeInTheDocument();

      // Check actions available for ADMIN
      expect(screen.getByRole("button", { name: "Verify" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Record Consent" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Revoke" })).toBeInTheDocument();
    });

    it("disables audit and consent mutation buttons for EDITOR role", () => {
      render(
        <AdminTestimonialsClient
          initialTestimonials={mockTestimonials}
          userRole="EDITOR"
        />
      );

      const verifyBtn = screen.getByRole("button", { name: "Verify" });
      const consentBtn = screen.getByRole("button", { name: "Record Consent" });
      const revokeBtn = screen.getByRole("button", { name: "Revoke" });

      expect(verifyBtn).toBeDisabled();
      expect(consentBtn).toBeDisabled();
      expect(revokeBtn).toBeDisabled();
    });
  });

  describe("AdminPageSectionsClient", () => {
    const mockSections = [
      {
        id: "sec_1",
        contentItemId: null,
        key: "home-hero",
        pageSlug: "home",
        title: "Build. Launch. Grow Online.",
        subtitle: "Enterprise Software Agency",
        content: "High-performance digital engineering.",
        metadata: null,
        mediaUrl: null,
        isActive: true,
        orderIndex: 0,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it("toggles edit mode and updates section copy", () => {
      render(
        <AdminPageSectionsClient
          initialSections={mockSections}
          userRole="ADMIN"
        />
      );

      expect(screen.getByText("Build. Launch. Grow Online.")).toBeInTheDocument();
      expect(screen.getByText("Enterprise Software Agency")).toBeInTheDocument();

      const editBtn = screen.getByRole("button", { name: /Edit Copy/i });
      fireEvent.click(editBtn);

      // Verify form inputs appear
      const titleInput = screen.getByDisplayValue("Build. Launch. Grow Online.");
      fireEvent.change(titleInput, { target: { value: "Engineering Next-Gen Platforms." } });

      const saveBtn = screen.getByRole("button", { name: /Save Changes/i });
      fireEvent.click(saveBtn);

      expect(screen.getByText("Engineering Next-Gen Platforms.")).toBeInTheDocument();
    });
  });

  describe("AdminMediaClient", () => {
    const mockAssets = [
      {
        id: "media_1",
        storageKey: "uploads/2026/11/sample.webp",
        provider: "LOCAL" as const,
        filename: "sample.webp",
        originalName: "hero.png",
        mimeType: "image/webp",
        sizeBytes: 154000,
        width: 1200,
        height: 800,
        sha256Hash: "hash123",
        isSvg: false,
        publicUrl: "/uploads/uploads/2026/11/sample.webp",
        defaultAltText: "Hero banner graphic",
        caption: "Promotional banner",
        uploaderId: "usr_1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it("renders media assets grid with dimensions and copy URL trigger", () => {
      render(
        <AdminMediaClient
          initialAssets={mockAssets}
          userRole="ADMIN"
        />
      );

      expect(screen.getByText("hero.png")).toBeInTheDocument();
      expect(screen.getByText("Alt: Hero banner graphic")).toBeInTheDocument();
      expect(screen.getByText("1200x800")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Copy URL/i })).toBeInTheDocument();
    });

    it("disables asset deletion button for non-SUPER_ADMIN", () => {
      render(
        <AdminMediaClient
          initialAssets={mockAssets}
          userRole="ADMIN"
        />
      );

      const deleteBtn = screen.getByTitle("Only SUPER_ADMIN can delete media");
      expect(deleteBtn).toBeDisabled();
    });
  });
});
