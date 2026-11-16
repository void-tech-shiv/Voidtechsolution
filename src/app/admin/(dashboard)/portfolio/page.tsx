import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { hasPermission } from "@/server/security/rbac";
import { getAllProjects } from "@/server/repositories/portfolio.repo";
import { AdminPortfolioClient } from "@/components/admin/portfolio/admin-portfolio-client";
import { AdminAccessDenied } from "@/components/admin/admin-access-denied";

export const metadata = {
  title: "Portfolio Management | VOIDTECH SOLUTION",
  description: "Architecture prototype case studies and demonstrator projects",
};

export default async function AdminPortfolioPage() {
  const current = await getCurrentAdmin();
  if (!current || !current.user.isActive) {
    redirect("/admin/login");
  }

  // RBAC: Requires portfolio:manage (SUPER_ADMIN, ADMIN, EDITOR)
  if (!hasPermission(current.user.role, "portfolio:manage")) {
    return (
      <AdminAccessDenied
        requiredPermission="portfolio:manage"
        role={current.user.role}
        title="Access Restricted"
        description="Managing portfolio case studies requires the portfolio:manage permission."
      />
    );
  }

  const projects = await getAllProjects();

  return <AdminPortfolioClient initialProjects={projects} />;
}

