import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";

export const metadata: Metadata = {
  title: "Admin Dashboard | VOIDTECH SOLUTION",
  description: "Administrative console and management operations for VOIDTECH SOLUTION",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authoritative Server-Side Validation: Verify PostgreSQL session record, idle timeout, and active status
  const current = await getCurrentAdmin();

  if (!current || !current.user.isActive) {
    redirect("/admin/login");
  }

  return (
    <AdminLayoutShell
      user={{
        name: current.user.name,
        email: current.user.email,
        role: current.user.role,
      }}
    >
      {children}
    </AdminLayoutShell>
  );
}

