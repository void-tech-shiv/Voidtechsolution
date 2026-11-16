import { PrismaClient, ServiceCategory } from "@prisma/client";
import { servicesRegistry, siteConfig } from "../src/config/site";
import { approvedPricingPackages } from "../src/config/pricing";

const prisma = new PrismaClient();

async function main() {
  const forceOverwrite = process.env.SEED_FORCE_OVERWRITE === "true";

  console.log("🌱 Starting VOIDTECH SOLUTION Database Seeding...");
  console.log(`📋 Strategy: ${forceOverwrite ? "CONTROLLED SYNCHRONIZATION (SEED_FORCE_OVERWRITE=true)" : "SAFE INITIAL SEED (Preserve Existing Records)"}`);

  let createdServices = 0;
  let preservedServices = 0;
  let updatedServices = 0;

  let createdSettings = 0;
  let preservedSettings = 0;
  let updatedSettings = 0;

  let createdPackages = 0;
  let preservedPackages = 0;
  let updatedPackages = 0;

  let createdFaqs = 0;
  let preservedFaqs = 0;
  let updatedFaqs = 0;

  let createdProjects = 0;
  let preservedProjects = 0;
  let updatedProjects = 0;

  // ----------------------------------------------------------------------------
  // 1. Seed all 18 Registered Business Services
  // ----------------------------------------------------------------------------
  console.log(`\n📦 Processing ${servicesRegistry.length} business services...`);
  for (let i = 0; i < servicesRegistry.length; i++) {
    const srv = servicesRegistry[i];
    if (!srv) continue;

    const existing = await prisma.service.findUnique({
      where: { slug: srv.slug },
    });

    if (!existing) {
      await prisma.service.create({
        data: {
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
      createdServices++;
    } else if (forceOverwrite) {
      await prisma.service.update({
        where: { slug: srv.slug },
        data: {
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
      });
      updatedServices++;
    } else {
      preservedServices++;
    }
  }
  console.log(`✅ Services processed: ${createdServices} created, ${preservedServices} preserved, ${updatedServices} updated.`);

  // ----------------------------------------------------------------------------
  // 2. Seed Baseline Site Settings
  // ----------------------------------------------------------------------------
  console.log("\n⚙️  Processing baseline site settings...");
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
    const existing = await prisma.siteSetting.findUnique({
      where: { key: setting.key },
    });

    if (!existing) {
      await prisma.siteSetting.create({
        data: {
          key: setting.key,
          value: setting.value,
          description: setting.description,
        },
      });
      createdSettings++;
    } else if (forceOverwrite) {
      await prisma.siteSetting.update({
        where: { key: setting.key },
        data: {
          value: setting.value,
          description: setting.description,
        },
      });
      updatedSettings++;
    } else {
      preservedSettings++;
    }
  }
  console.log(`✅ Site settings processed: ${createdSettings} created, ${preservedSettings} preserved, ${updatedSettings} updated.`);

  // ----------------------------------------------------------------------------
  // 3. Seed 10 Approved Pricing Packages (INR ₹)
  // ----------------------------------------------------------------------------
  console.log(`\n💰 Processing ${approvedPricingPackages.length} approved INR pricing packages...`);
  for (const pkg of approvedPricingPackages) {
    const existing = await prisma.pricingPackage.findUnique({
      where: { slug: pkg.slug },
    });

    if (!existing) {
      await prisma.pricingPackage.create({
        data: {
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
      createdPackages++;
    } else if (forceOverwrite) {
      await prisma.pricingPackage.update({
        where: { slug: pkg.slug },
        data: {
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
      updatedPackages++;
    } else {
      preservedPackages++;
    }
  }
  console.log(`✅ Pricing packages processed: ${createdPackages} created, ${preservedPackages} preserved, ${updatedPackages} updated.`);

  // ----------------------------------------------------------------------------
  // 4. Seed Baseline FAQs
  // ----------------------------------------------------------------------------
  console.log("\n❓ Processing baseline FAQs...");
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
      question: "What warranty or post-deployment support do you provide?",
      answer: "All deliverables include a limited 30-day bug-fix warranty following final handover, covering defects in functionality explicitly within agreed project scope. New features, scope changes, client-side modifications, third-party service failures, and external infrastructure issues are excluded. Ongoing maintenance agreements are available upon request.",
      category: "SUPPORT",
      orderIndex: 5,
    },
  ];

  for (const faq of initialFaqs) {
    const existing = await prisma.fAQ.findUnique({
      where: { id: faq.id },
    });

    if (!existing) {
      await prisma.fAQ.create({
        data: {
          id: faq.id,
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          orderIndex: faq.orderIndex,
          isActive: true,
        },
      });
      createdFaqs++;
    } else if (forceOverwrite) {
      await prisma.fAQ.update({
        where: { id: faq.id },
        data: {
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          orderIndex: faq.orderIndex,
          isActive: true,
        },
      });
      updatedFaqs++;
    } else {
      preservedFaqs++;
    }
  }
  console.log(`✅ FAQs processed: ${createdFaqs} created, ${preservedFaqs} preserved, ${updatedFaqs} updated.`);

  // ----------------------------------------------------------------------------
  // 5. Seed Featured Portfolio Projects (Concept Lab Architecture Prototypes)
  // ----------------------------------------------------------------------------
  console.log("\n📁 Processing initial portfolio case studies (Internal Architecture Prototypes)...");
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
    const existing = await prisma.portfolioProject.findUnique({
      where: { slug: proj.slug },
    });

    if (!existing) {
      await prisma.portfolioProject.create({
        data: {
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
      createdProjects++;
    } else if (forceOverwrite) {
      await prisma.portfolioProject.update({
        where: { slug: proj.slug },
        data: {
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
      updatedProjects++;
    } else {
      preservedProjects++;
    }
  }
  console.log(`✅ Portfolio case studies processed: ${createdProjects} created, ${preservedProjects} preserved, ${updatedProjects} updated.`);

  // ----------------------------------------------------------------------------
  // 6. Security Boundaries (Zero Modification of Enquiries & Administrator Records)
  // ----------------------------------------------------------------------------
  console.log("\n🛡️  Security Boundaries:");
  console.log("  • Customer Enquiries: ZERO modifications (all inbound customer records preserved).");
  console.log("  • Administrator Accounts: ZERO modifications (strictly isolated to Phase 7).");
  console.log("  • Audit Logs & OTP Records: ZERO modifications (live security records preserved).");

  console.log("\n================ SEED EXECUTION SUMMARY ================");
  console.log(`Mode:              ${forceOverwrite ? "CONTROLLED SYNCHRONIZATION (OVERWRITE)" : "SAFE INITIAL SEED (PRESERVE EXISTING)"}`);
  console.log(`Services:          ${createdServices} created | ${preservedServices} preserved | ${updatedServices} updated`);
  console.log(`Site Settings:     ${createdSettings} created | ${preservedSettings} preserved | ${updatedSettings} updated`);
  console.log(`Pricing Packages:  ${createdPackages} created | ${preservedPackages} preserved | ${updatedPackages} updated`);
  console.log(`FAQs:              ${createdFaqs} created | ${preservedFaqs} preserved | ${updatedFaqs} updated`);
  console.log(`Portfolio Concept: ${createdProjects} created | ${preservedProjects} preserved | ${updatedProjects} updated`);
  console.log("========================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
