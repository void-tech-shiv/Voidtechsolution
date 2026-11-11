import { PrismaClient, ServiceCategory } from "@prisma/client";
import { servicesRegistry, siteConfig } from "../src/config/site";
import { approvedPricingPackages } from "../src/config/pricing";

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
        startingPriceInr: srv.startingPriceInr || null,
        currency: srv.currency || "INR",
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
        startingPriceInr: srv.startingPriceInr || null,
        currency: srv.currency || "INR",
        isFeatured: srv.isFeatured,
        isActive: true,
        orderIndex: i + 1,
      },
    });
  }
  console.log("✅ All 18 business services successfully seeded.");

  // 2. Seed Baseline Site Settings
  console.log("⚙️  Seeding baseline site settings...");
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
    await prisma.siteSetting.upsert({
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
  console.log("✅ Baseline site settings seeded.");

  // 3. Seed 10 Approved Pricing Packages (INR ₹)
  console.log(`💰 Seeding ${approvedPricingPackages.length} approved INR pricing packages...`);
  for (const pkg of approvedPricingPackages) {
    await prisma.pricingPackage.upsert({
      where: { slug: pkg.slug },
      update: {
        name: pkg.name,
        category: pkg.category as ServiceCategory,
        priceInr: pkg.priceInr,
        currency: pkg.currency,
        isStartingPrice: pkg.isStartingPrice,
        billingPeriod: pkg.billingPeriod,
        features: pkg.features,
        popular: pkg.popular,
        orderIndex: pkg.orderIndex,
        isActive: true,
      },
      create: {
        slug: pkg.slug,
        name: pkg.name,
        category: pkg.category as ServiceCategory,
        priceInr: pkg.priceInr,
        currency: pkg.currency,
        isStartingPrice: pkg.isStartingPrice,
        billingPeriod: pkg.billingPeriod,
        features: pkg.features,
        popular: pkg.popular,
        orderIndex: pkg.orderIndex,
        isActive: true,
      },
    });
  }
  console.log("✅ All 10 approved INR pricing packages seeded.");

  // 4. Seed Baseline FAQs
  console.log("❓ Seeding baseline FAQs...");
  const initialFaqs = [
    {
      id: "faq-01",
      question: "What is the typical development turnaround time for a project?",
      answer: "Turnaround depends on the tier: static landing pages deploy in 3-5 business days; standard business websites take 7-10 days; while complex custom web applications, SaaS, and AI automations typically span 2-6 weeks with agile milestone delivery.",
      category: "GENERAL",
      orderIndex: 1,
    },
    {
      id: "faq-02",
      question: "Do you build custom solutions or use off-the-shelf templates?",
      answer: "Every VoidTech Solution digital asset is engineered bespoke using modern frameworks like Next.js, React, Tailwind CSS, and Node.js. We never use bloated, slow third-party templates.",
      category: "TECHNICAL",
      orderIndex: 2,
    },
    {
      id: "faq-03",
      question: "Are your prices really starting at ₹999 for static sites?",
      answer: "Yes. Our Basic Static package starts at ₹999 for lightweight, ultra-fast landing pages. For enterprise systems, custom applications, and autonomous AI agents, pricing scales predictably based on specifications and complexity.",
      category: "PRICING",
      orderIndex: 3,
    },
    {
      id: "faq-04",
      question: "How do you handle Indian and international payment gateways?",
      answer: "We engineer frictionless payment checkouts supporting UPI intent flows, QR code generation, Net Banking, credit/debit cards, and global currencies via Razorpay, Cashfree, and Stripe.",
      category: "PAYMENTS",
      orderIndex: 4,
    },
    {
      id: "faq-05",
      question: "Do you offer post-deployment support and maintenance SLAs?",
      answer: "All production packages include dedicated post-launch support windows (ranging from 30 days to ongoing enterprise SLAs) covering security patches, uptime monitoring, and infrastructure optimizations.",
      category: "SUPPORT",
      orderIndex: 5,
    },
  ];

  for (const faq of initialFaqs) {
    await prisma.fAQ.upsert({
      where: { id: faq.id },
      update: {
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        orderIndex: faq.orderIndex,
        isActive: true,
      },
      create: {
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        orderIndex: faq.orderIndex,
        isActive: true,
      },
    });
  }
  console.log("✅ Baseline FAQs seeded.");

  // 5. Seed Featured Portfolio Projects (Concept Lab Architecture Prototypes)
  console.log("📁 Seeding initial portfolio case studies (Internal Architecture Prototypes)...");
  const initialProjects = [
    {
      id: "proj-seed-01",
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
      projectType: "CONCEPT",
      isFeatured: true,
      orderIndex: 1,
    },
    {
      id: "proj-seed-02",
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
      projectType: "CONCEPT",
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
        projectType: proj.projectType,
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
        projectType: proj.projectType,
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
