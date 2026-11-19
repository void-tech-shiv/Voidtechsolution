import { beforeEach, describe, expect, it, vi } from "vitest";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { validateRequestOrigin } from "@/server/security/origin";
import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/server/security/audit";
import { saveAdminEditableContentAction } from "@/server/actions/admin-edit.actions";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/actions/auth.actions", () => ({ getCurrentAdmin: vi.fn() }));
vi.mock("@/server/security/origin", () => ({ validateRequestOrigin: vi.fn() }));
vi.mock("@/server/security/audit", () => ({ recordAuditEvent: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: vi.fn() } }));

const updatedAt = new Date("2026-11-19T12:00:00.000Z");
const saved = {
  id: "clwvalidrecord12345",
  slug: "standard-business",
  name: "Standard Business Website",
  priceInr: 3999,
  features: ["Responsive design"],
  popular: false,
  isStartingPrice: true,
  billingPeriod: "one-time",
  orderIndex: 2,
  isActive: true,
  contentItemId: null,
  updatedAt,
};

function pricingForm(price = "3999") {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    id: saved.id,
    expectedUpdatedAt: updatedAt.toISOString(),
    name: saved.name,
    priceInr: price,
    features: "Responsive design\nContact form",
    billingPeriod: "one-time",
    orderIndex: "2",
  })) form.set(key, value);
  form.set("isStartingPrice", "on");
  form.set("isActive", "on");
  return form;
}

const tx = {
  pricingPackage: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  },
};

describe("Admin content save action: authorization and concurrency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(headers).mockResolvedValue(new Headers({ host: "localhost:3000", origin: "http://localhost:3000" }) as never);
    vi.mocked(getCurrentAdmin).mockResolvedValue({
      user: { id: "admin-01", email: "admin@example.test", role: "ADMIN", isActive: true },
    } as never);
    vi.mocked(validateRequestOrigin).mockReturnValue(true);
    vi.mocked(prisma.$transaction).mockImplementation((callback: any) => callback(tx));
    tx.pricingPackage.findUnique.mockResolvedValue({ contentItemId: null });
    tx.pricingPackage.updateMany.mockResolvedValue({ count: 1 });
    tx.pricingPackage.findUniqueOrThrow.mockResolvedValue(saved);
    vi.mocked(recordAuditEvent).mockResolvedValue({} as never);
  });

  it("rejects forged cross-origin edits before checking the database", async () => {
    vi.mocked(validateRequestOrigin).mockReturnValue(false);
    expect((await saveAdminEditableContentAction("pricing", pricingForm())).success).toBe(false);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects an inactive session or an EDITOR trying to change pricing", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ user: {
      id: "editor-01", email: "editor@example.test", role: "EDITOR", isActive: true,
    } } as never);
    const response = await saveAdminEditableContentAction("pricing", pricingForm());
    expect(response.success).toBe(false);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects invalid values even for authorized administrators", async () => {
    const response = await saveAdminEditableContentAction("pricing", pricingForm("-200"));
    expect(response.success).toBe(false);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("does not overwrite a record with a stale updatedAt timestamp", async () => {
    tx.pricingPackage.updateMany.mockResolvedValue({ count: 0 });
    const response = await saveAdminEditableContentAction("pricing", pricingForm());
    expect(response).toMatchObject({ success: false });
    expect(response.error).toMatch(/someone else changed/i);
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it("refuses direct edits to CMS-managed records", async () => {
    tx.pricingPackage.findUnique.mockResolvedValue({ contentItemId: "linked-cms-id" });
    const response = await saveAdminEditableContentAction("pricing", pricingForm());
    expect(response.success).toBe(false);
    expect(response.error).toMatch(/CMS-managed/i);
    expect(tx.pricingPackage.updateMany).not.toHaveBeenCalled();
  });

  it("saves and audits valid pricing changes then invalidates public caches", async () => {
    const response = await saveAdminEditableContentAction("pricing", pricingForm());
    expect(response.success).toBe(true);
    expect(response.data).toEqual(saved);
    expect(tx.pricingPackage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: saved.id, updatedAt },
        data: expect.objectContaining({ priceInr: 3999, isActive: true, features: ["Responsive design", "Contact form"] }),
      })
    );
    expect(recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      action: "ADMIN_CONTENT_EDITED", entity: "PricingPackage", entityId: saved.id,
    }), tx);
    expect(revalidatePath).toHaveBeenCalledWith("/pricing");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });
});
