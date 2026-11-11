import { PrismaClient, ServiceCategory } from "@prisma/client";
import { servicesRegistry, siteConfig } from "../src/config/site";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting VOIDTECH SOLUTION Database Seeding...");

  // 1. Seed all 18 Registered Business Services
  console.log(`📦 Seeding ${servicesRegistry.length} business services...`);
  for (let i = 0; i < servicesRegistry.length; i++) {
    const srv = servicesRegistry[i];
    if (!srv) continue;

    await prisma.service.upsert({
      where: { slug: srv.slug },
      update: {
        title: srv.title,
        shortDesc: srv.shortDescription,
        fullDesc: srv.fullDescription,
        icon: srv.iconName,
        category: srv.category as ServiceCategory,
        deliverables: srv.deliverables,
        technologies: srv.technologies,
        startingPriceUsd: srv.startingPriceUsd || null,
        isFeatured: srv.isFeatured,
        orderIndex: i + 1,
      },
      create: {
        id: srv.id,
        slug: srv.slug,
        title: srv.title,
        shortDesc: srv.shortDescription,
        fullDesc: srv.fullDescription,
        icon: srv.iconName,
        category: srv.category as ServiceCategory,
        deliverables: srv.deliverables,
        technologies: srv.technologies,
        startingPriceUsd: srv.startingPriceUsd || null,
        isFeatured: srv.isFeatured,
        isActive: true,
        orderIndex: i + 1,
      },
    });
  }
  console.log("✅ All 18 business services successfully seeded.");

  // 2. Seed Baseline System Settings
  console.log("⚙️  Seeding baseline system settings...");
  const defaultSettings = [
    {
      key: "site_name",
      value: siteConfig.name,
      description: "Official agency brand name",
    },
    {
      key: "site_tagline",
      value: siteConfig.tagline,
      description: "Official agency tagline",
    },
    {
      key: "contact_email",
      value: siteConfig.contactEmail,
      description: "Primary commercial intake inbox",
    },
    {
      key: "enquiry_auto_reply",
      value: "true",
      description: "Toggle automated confirmation email to lead prospect",
    },
    {
      key: "maintenance_mode",
      value: "false",
      description: "Global maintenance mode toggle",
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {
        value: setting.value,
        description: setting.description,
      },
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
      },
    });
  }
  console.log("✅ Baseline system settings seeded.");

  // 3. Seed Featured Portfolio Projects
  console.log("📁 Seeding initial portfolio case studies...");
  const initialProjects = [
    {
      id: "proj-seed-01",
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
      isFeatured: true,
      orderIndex: 1,
    },
    {
      id: "proj-seed-02",
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
      isFeatured: true,
      orderIndex: 2,
    },
  ];

  for (const proj of initialProjects) {
    await prisma.portfolioProject.upsert({
      where: { slug: proj.slug },
      update: {
        title: proj.title,
        clientName: proj.clientName,
        industry: proj.industry,
        summary: proj.summary,
        challenge: proj.challenge,
        solution: proj.solution,
        results: proj.results,
        techStack: proj.techStack,
        metrics: proj.metrics,
        isFeatured: proj.isFeatured,
        orderIndex: proj.orderIndex,
      },
      create: {
        id: proj.id,
        slug: proj.slug,
        title: proj.title,
        clientName: proj.clientName,
        industry: proj.industry,
        summary: proj.summary,
        challenge: proj.challenge,
        solution: proj.solution,
        results: proj.results,
        techStack: proj.techStack,
        metrics: proj.metrics,
        isFeatured: proj.isFeatured,
        orderIndex: proj.orderIndex,
      },
    });
  }
  console.log("✅ Initial portfolio case studies seeded.");

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
