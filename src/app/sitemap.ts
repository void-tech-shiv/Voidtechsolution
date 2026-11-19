import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getAllProjects } from "@/server/repositories/portfolio.repo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  const solutionRoutes = [
    "/solutions/website-development",
    "/solutions/ecommerce-development",
    "/solutions/ai-automation",
    "/solutions/college-project-mentoring",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const coreRoutes = [
    "",
    "/about",
    "/services",
    "/pricing",
    "/portfolio",
    "/contact",
    "/service-areas",
    "/guides/website-development-cost-india",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: (route === "" ? "daily" : "weekly") as "daily" | "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));

  try {
    const projects = await getAllProjects();
    const projectRoutes = projects.map((project) => ({
      url: `${baseUrl}/portfolio/${project.slug}`,
      lastModified: project.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
    return [...coreRoutes, ...solutionRoutes, ...projectRoutes];
  } catch {
    return [...coreRoutes, ...solutionRoutes];
  }
}

