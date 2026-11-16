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
    contentItemId: null,
    publishedAt: null,
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
      { label: "Test Uptime", value: "99.99%" },
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
    contentItemId: null,
    publishedAt: null,
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
      { label: "Avg Analysis Time", value: "1.8s" },
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
  {
    id: "proj-03",
    contentItemId: null,
    publishedAt: null,
    slug: "distributed-telemetry-data-mesh",
    title: "Distributed Telemetry & Data Mesh Gateway",
    clientName: "VoidTech Concept Lab (Data Systems Prototype)",
    industry: "DATA_ENGINEERING",
    summary: "Event-driven telemetry ingestion engine processing distributed sensory data with dynamic schema evolution.",
    challenge: "Handling massive out-of-order time-series data streams without blocking analytical query pipelines.",
    solution: "Architected a columnar event stream buffer utilizing Apache Arrow memory structures, Rust processing workers, and Redis buffering.",
    results: "Synthetic load testing validated sustained ingestion of 500,000 events/sec with zero dropped packets in test environments.",
    techStack: ["Rust", "Apache Arrow", "Redis", "TypeScript", "PostgreSQL"],
    metrics: [
      { label: "Ingestion Peak", value: "500k events/s" },
      { label: "Packet Loss Rate", value: "0.00% (Simulated)" },
      { label: "Query Latency", value: "14ms" },
    ],
    heroImage: null,
    liveUrl: null,
    githubUrl: null,
    projectType: "CONCEPT",
    isFeatured: true,
    orderIndex: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "proj-04",
    contentItemId: null,
    publishedAt: null,
    slug: "decentralized-identity-vault",
    title: "Decentralized Identity & Zero-Trust Auth Vault",
    clientName: "VoidTech Concept Lab (Security Prototype)",
    industry: "CYBERSECURITY",
    summary: "Cryptographic credential verification gateway supporting verifiable claims, biometric attestation, and zero-knowledge proofs.",
    challenge: "Verifying user authorizations across federated enterprise microservices without sharing plain-text identifiers or session tokens.",
    solution: "Implemented a zero-trust policy engine using asymmetric cryptographic proofs, hardware-backed token rotation, and Ed25519 signing.",
    results: "Achieved sub-5ms verification latency across 10,000 simulated parallel authentication handshakes.",
    techStack: ["TypeScript", "Node.js", "Ed25519", "WebAuthn", "PostgreSQL"],
    metrics: [
      { label: "Verification Latency", value: "< 5ms" },
      { label: "Zero-Knowledge", value: "zk-SNARK Ready" },
      { label: "Simulated Concurrency", value: "10,000" },
    ],
    heroImage: null,
    liveUrl: null,
    githubUrl: null,
    projectType: "CONCEPT",
    isFeatured: false,
    orderIndex: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "proj-05",
    contentItemId: null,
    publishedAt: null,
    slug: "edge-iot-fleet-monitor",
    title: "Edge IoT Fleet Telemetry & Remote Control",
    clientName: "VoidTech Concept Lab (IoT Prototype)",
    industry: "IOT_EMBEDDED",
    summary: "Real-time edge device monitoring dashboard with bidirectional WebSocket command dispatch and anomaly detection.",
    challenge: "Managing low-bandwidth, intermittent cellular connections for remote edge hardware clusters.",
    solution: "Engineered an MQTT-to-WebSocket multiplexer with client-side offline queuing, differential sync, and protobuf compression.",
    results: "Reduced network telemetry payload size by 68% and maintained reliable state sync during synthetic packet drop tests.",
    techStack: ["React", "MQTT", "Go", "WebSockets", "Protobuf"],
    metrics: [
      { label: "Bandwidth Savings", value: "68% (Protobuf)" },
      { label: "Heartbeat Interval", value: "100ms" },
      { label: "Simulated Edge Nodes", value: "1,200" },
    ],
    heroImage: null,
    liveUrl: null,
    githubUrl: null,
    projectType: "CONCEPT",
    isFeatured: false,
    orderIndex: 5,
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
