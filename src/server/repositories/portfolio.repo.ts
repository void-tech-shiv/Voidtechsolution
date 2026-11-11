import { prisma } from "@/lib/prisma";
import type { PortfolioProject, Prisma } from "@prisma/client";

/**
 * Baseline fallback projects for when the database is offline or unseeded.
 * All projects are explicitly designated as internal DEMO / CONCEPT architecture prototypes.
 * No fabricated client names or unverified production claims.
 */
const fallbackProjects: PortfolioProject[] = [
  {
    id: "proj-01",
    slug: "algorithmic-liquidity-engine",
    title: "Algorithmic Liquidity & Execution Engine",
    clientName: "VoidTech Concept Lab (Architecture Prototype)",
    industry: "FINTECH",
    summary: "High-frequency simulated order routing prototype with sub-millisecond execution and real-time risk dashboards.",
    challenge: "Demonstrating zero-allocation memory routing and mitigating latency spikes during synthetic market bursts.",
    solution: "Engineered a distributed order management prototype with microservice route handlers in Go and Next.js.",
    results: "Simulated test harness achieved 72% latency reduction under synthetic load with 99.99% benchmark uptime.",
    techStack: ["Next.js", "Go", "PostgreSQL", "Kafka", "Docker"],
    metrics: [
      { label: "Simulated Throughput", value: "250k req/s" },
      { label: "Benchmark Latency", value: "< 2ms" },
    ],
    heroImage: null,
    liveUrl: null,
    githubUrl: null,
    projectType: "CONCEPT",
    isFeatured: true,
    orderIndex: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "proj-02",
    slug: "autonomous-ai-ops-agent",
    title: "Autonomous Cloud Ops Agent",
    clientName: "VoidTech Concept Lab (Research Prototype)",
    industry: "DEV_OPS_AI",
    summary: "Autonomous multi-agent system executing self-healing server diagnostics and simulated automated rollbacks.",
    challenge: "Mitigating extended MTTR during complex multi-service infrastructure alert cascades in test environments.",
    solution: "Deployed autonomous cognitive agents with tool-calling across containerized cloud APIs and simulated clusters.",
    results: "Simulated incident response reduced MTTR from 45 minutes down to 90 seconds across benchmark evaluation scenarios.",
    techStack: ["Python", "LangGraph", "FastAPI", "VectorDB", "Kubernetes"],
    metrics: [
      { label: "Benchmark MTTR Reduction", value: "96.7% (Simulated)" },
      { label: "Autonomous Resolution", value: "84% (Test Corpus)" },
    ],
    heroImage: null,
    liveUrl: null,
    githubUrl: null,
    projectType: "CONCEPT",
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
    console.warn(`[portfolio.repo] Failed to fetch project slug '${slug}':`, error);
  }

  return fallbackProjects.find((p) => p.slug === slug) || null;
}

/**
 * Retrieves projects filtered by industry.
 */
export async function getProjectsByIndustry(industry: string): Promise<PortfolioProject[]> {
  try {
    const projects = await prisma.portfolioProject.findMany({
      where: { industry: { equals: industry, mode: "insensitive" } },
      orderBy: { orderIndex: "asc" },
    });

    if (projects.length > 0) return projects;
  } catch (error) {
    console.warn(`[portfolio.repo] Failed to filter projects by industry '${industry}':`, error);
  }

  return fallbackProjects.filter(
    (p) => p.industry.toLowerCase() === industry.toLowerCase()
  );
}

/**
 * Creates or updates a portfolio project (administrative write).
 * Writes strictly throw descriptive errors on failure without leaking credentials.
 */
export async function upsertProject(
  data: Prisma.PortfolioProjectCreateInput
): Promise<PortfolioProject> {
  try {
    return await prisma.portfolioProject.upsert({
      where: { slug: data.slug },
      update: data,
      create: data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[portfolio.repo] Write operation failed:", message);
    throw new Error(`Failed to upsert portfolio project '${data.slug}': Database write operation failed.`);
  }
}
