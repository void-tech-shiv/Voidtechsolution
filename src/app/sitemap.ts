import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getAllProjects } from "@/server/repositories/portfolio.repo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  const now = new Date();

  const solutionRoutes = [
    "/solutions/website-development",
    "/solutions/ecommerce-development",
    "/solutions/ai-automation",
    "/solutions/college-project-mentoring",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
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
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: (route === "" ? "daily" : "weekly") as "daily" | "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));

  try {
    const projects = await getAllProjects();
    const projectRoutes = projects.map((project) => ({
      url: `${baseUrl}/portfolio/${project.slug}`,
      lastModified: project.updatedAt || now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
    return [...coreRoutes, ...solutionRoutes, ...projectRoutes];
  } catch {
    return [...coreRoutes, ...solutionRoutes];
  }
}

