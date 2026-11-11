import { prisma } from "@/lib/prisma";
import type { PortfolioProject, Prisma } from "@prisma/client";

/**
 * Baseline fallback projects for when the database is offline or unseeded.
 */
const fallbackProjects: PortfolioProject[] = [
  {
    id: "proj-01",
    slug: "algorithmic-liquidity-engine",
    title: "Algorithmic Liquidity & Execution Engine",
    clientName: "Aether Capital",
    industry: "FINTECH",
    summary: "High-frequency order routing platform with sub-millisecond execution and real-time risk dashboards.",
    challenge: "The client struggled with latency spikes and memory fragmentation during volatile market openings.",
    solution: "Engineered a distributed order management system with microservice route handlers in Go and Next.js.",
    results: "Reduced latency by 72% and handled over $50M in daily trading volume with 99.99% uptime.",
    techStack: ["Next.js", "Go", "PostgreSQL", "Kafka", "Docker"],
    metrics: [
      { label: "Throughput", value: "250k req/s" },
      { label: "Execution Latency", value: "< 2ms" },
    ],
    heroImage: null,
    liveUrl: "https://example.com/aether",
    githubUrl: null,
    isFeatured: true,
    orderIndex: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "proj-02",
    slug: "autonomous-ai-ops-agent",
    title: "Autonomous Cloud Ops Agent",
    clientName: "Synthex Networks",
    industry: "DEV_OPS_AI",
    summary: "Autonomous multi-agent system executing self-healing server diagnostics and automated rollbacks.",
    challenge: "Manual triage of multi-cloud alerts caused 45-minute MTTR during critical service outages.",
    solution: "Deployed autonomous cognitive agents with tool-calling across AWS, GCP, and Kubernetes APIs.",
    results: "Reduced Mean Time To Recovery (MTTR) from 45 minutes down to 90 seconds autonomously.",
    techStack: ["Python", "LangGraph", "FastAPI", "VectorDB", "Kubernetes"],
    metrics: [
      { label: "MTTR Reduction", value: "96.7%" },
      { label: "Autonomous Resolution", value: "84%" },
    ],
    heroImage: null,
    liveUrl: "https://example.com/synthex",
    githubUrl: null,
    isFeatured: true,
    orderIndex: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

/**
 * Retrieves all portfolio case studies ordered by orderIndex.
 */
export async function getAllProjects(): Promise<PortfolioProject[]> {
  try {
    const projects = await prisma.portfolioProject.findMany({
      orderBy: { orderIndex: "asc" },
    });

    if (projects.length > 0) return projects;
  } catch (error) {
    console.warn("[portfolio.repo] Database query failed, using fallback:", error);
  }

  return fallbackProjects;
}

/**
 * Retrieves featured projects for the public showcase.
 */
export async function getFeaturedProjects(): Promise<PortfolioProject[]> {
  try {
    const projects = await prisma.portfolioProject.findMany({
      where: { isFeatured: true },
      orderBy: { orderIndex: "asc" },
    });

    if (projects.length > 0) return projects;
  } catch (error) {
    console.warn("[portfolio.repo] Database query failed, using fallback:", error);
  }

  return fallbackProjects.filter((p) => p.isFeatured);
}

/**
 * Retrieves a single project case study by its slug.
 */
export async function getProjectBySlug(slug: string): Promise<PortfolioProject | null> {
  try {
    const project = await prisma.portfolioProject.findUnique({
      where: { slug },
    });

    if (project) return project;
  } catch (error) {
    console.warn(`[portfolio.repo] Database query for slug '${slug}' failed:`, error);
  }

  return fallbackProjects.find((p) => p.slug === slug) || null;
}

/**
 * Retrieves projects filtered by industry.
 */
export async function getProjectsByIndustry(industry: string): Promise<PortfolioProject[]> {
  try {
    return await prisma.portfolioProject.findMany({
      where: { industry: { equals: industry, mode: "insensitive" } },
      orderBy: { orderIndex: "asc" },
    });
  } catch (error) {
    console.warn(`[portfolio.repo] Failed to filter by industry '${industry}':`, error);
    return fallbackProjects.filter(
      (p) => p.industry.toLowerCase() === industry.toLowerCase()
    );
  }
}

/**
 * Creates a new portfolio project case study.
 */
export async function createProject(
  data: Prisma.PortfolioProjectCreateInput
): Promise<PortfolioProject> {
  return await prisma.portfolioProject.create({
    data,
  });
}

/**
 * Updates a portfolio project case study by ID.
 */
export async function updateProject(
  id: string,
  data: Prisma.PortfolioProjectUpdateInput
): Promise<PortfolioProject> {
  return await prisma.portfolioProject.update({
    where: { id },
    data,
  });
}

/**
 * Deletes a portfolio project case study by ID.
 */
export async function deleteProject(id: string): Promise<PortfolioProject> {
  return await prisma.portfolioProject.delete({
    where: { id },
  });
}
