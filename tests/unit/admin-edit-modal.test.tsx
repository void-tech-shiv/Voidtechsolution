import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { PricingPackage } from "@prisma/client";
import { AdminEditableContentDialog } from "@/components/admin/editable-content-dialog";
import { saveAdminEditableContentAction } from "@/server/actions/admin-edit.actions";

vi.mock("@/server/actions/admin-edit.actions", () => ({
  saveAdminEditableContentAction: vi.fn(),
}));

const row: PricingPackage = {
  id: "clx-pricing-12345",
  contentItemId: null,
  publishedAt: null,
  slug: "basic-static",
  name: "Basic Static",
  category: "WEB_DEVELOPMENT",
  priceInr: 999,
  currency: "INR",
  isStartingPrice: false,
  billingPeriod: "one-time",
  features: ["Responsive design", "Contact form"],
  popular: false,
  orderIndex: 1,
  isActive: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("Admin pricing editor viewport dialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
  });

  it("renders Edit modal in document.body, not inside overflow-clipped table", () => {
    render(<table><tbody><tr><td>
      <AdminEditableContentDialog kind="pricing" row={row} onSaved={vi.fn()} />
    </td></tr></tbody></table>);

    fireEvent.click(screen.getByRole("button", { name: /Edit Basic Static/ }));
    const dialog = screen.getByRole("dialog", { name: "Edit pricing" });
    expect(dialog.parentElement?.parentElement).toBe(document.body);
    expect(screen.getByRole("spinbutton", { name: "Price (₹ INR)" })).toHaveValue(999);
    expect(screen.getByRole("textbox", { name: /Included features/ })).toHaveValue(
      "Responsive design\nContact form"
    );

    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("saves updated pricing and closes editor after server confirmation", async () => {
    const onSaved = vi.fn();
    vi.mocked(saveAdminEditableContentAction).mockResolvedValue({
      success: true, data: { ...row, priceInr: 3999 },
    });
    render(<AdminEditableContentDialog kind="pricing" row={row} onSaved={onSaved} />);

    fireEvent.click(screen.getByRole("button", { name: /Edit Basic Static/ }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Price (₹ INR)" }), { target: { value: "3999" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ priceInr: 3999 })));
    const [kind, payload] = vi.mocked(saveAdminEditableContentAction).mock.calls[0]!;
    expect(kind).toBe("pricing");
    expect(payload).toBeInstanceOf(FormData);
    expect((payload as FormData).get("priceInr")).toBe("3999");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
