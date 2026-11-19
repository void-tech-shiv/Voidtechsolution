import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

const landingPages = {
  "website-development": {
    title: "Website Development & Web Design Services in India",
    description: "Custom business websites, responsive web design, landing pages and web applications for Indian businesses. Plan a website and request a tailored quote.",
    heading: "Website development for businesses across India",
    introduction: "VOIDTECH SOLUTION designs and develops business websites, landing pages and custom web applications. We begin with your audience, required content, enquiry process and business goals, whether you work locally or online.",
    offerings: [
      ["Business websites", "Mobile-friendly service pages, clear navigation, conversion-focused contact options and maintainable content."],
      ["Landing page design", "Purpose-built pages for product launches, campaigns and enquiries with analytics-ready conversion paths."],
      ["Custom web applications", "Database-backed dashboards, customer portals, role-based interfaces and integrations where a brochure website is not enough."],
      ["Website redesign", "Improve usability, accessibility and technical structure while retaining the information customers need."],
    ],
    faq: [
      ["Can you build websites for businesses outside your city?", "Yes. We can scope and deliver projects remotely across India. We do not claim to operate physical offices in every city."],
      ["Can I edit the website myself?", "We can scope a CMS or admin editing dashboard where you need to manage content without developer assistance."],
      ["How much does a business website cost?", "Cost depends on page count, design, copy, integrations and ongoing support. Review our pricing or request a quote."],
    ],
  },
  "ecommerce-development": {
    title: "Ecommerce Website & Online Store Development India",
    description: "Custom ecommerce website development with product catalogues, checkout, payments and mobile-first storefront design.",
    heading: "Ecommerce website and online store development",
    introduction: "A reliable online store needs clear product discovery, checkout flows and operational processes. We can help plan and build an ecommerce site around your catalogue, fulfilment model and payment requirements.",
    offerings: [
      ["Storefront design", "Responsive product collections, clear product detail pages, useful filters and navigation."],
      ["Checkout integrations", "Compatible Indian and international payment provider integrations with secure status handling."],
      ["Order and inventory workflows", "Product administration, order state tracking and fulfilment integrations where needed."],
      ["Custom ecommerce features", "Quote requests, special pricing, business accounts and integration requirements specific to your store."],
    ],
    faq: [
      ["Can you integrate UPI payments?", "Gateway and UPI integration options depend on the provider, onboarding and approved business use case."],
      ["Can you work with stores outside your city?", "Yes. Requirements, review and delivery can be conducted remotely across India."],
      ["Can you improve an existing ecommerce site?", "We can review and scope work on an existing store based on its platform, access and requirements."],
    ],
  },
  "ai-automation": {
    title: "AI Automation, Chatbots & Business Workflow Development",
    description: "AI automation services for customer enquiries, document workflows, chatbots and custom business tools with human oversight.",
    heading: "AI automation designed for real business workflows",
    introduction: "Useful AI automation starts with understanding the repetitive work, integrations and risks. We help define practical workflows with testing, human review and clear boundaries instead of promising that AI is always correct.",
    offerings: [
      ["Customer enquiry automation", "Assist with recurring support tasks and route unusual or sensitive cases to people."],
      ["Document processing", "Extract, review and organise information from supported business documents."],
      ["Chatbot integration", "Connect approved messaging channels and APIs to specific workflows and knowledge sources."],
      ["Internal AI tools", "Develop assistants for retrieval, summarisation and task support with suitable access controls."],
    ],
    faq: [
      ["Can automation integrate with my current software?", "Often yes when secure APIs or exports are available; feasibility depends on your provider and access."],
      ["Does AI replace all human review?", "No. We recommend human oversight for high-impact and uncertain cases."],
      ["Do you serve clients across India?", "Yes. Project discovery and delivery can be arranged remotely."],
    ],
  },
  "college-project-mentoring": {
    title: "College Project Mentoring for AI, ML & Web Development",
    description: "Ethical college project guidance for AI, ML, Python and web development: topic scoping, code review, debugging and presentation preparation.",
    heading: "College project mentoring and software engineering guidance",
    introduction: "For mini projects, final-year projects and practical coursework, we offer learning-oriented guidance: choosing a feasible scope, understanding architecture, debugging and explaining your own implementation. This is not a done-for-you academic submission service.",
    offerings: [
      ["Project topic and scope", "Break down an idea into feasible features, milestones and learning outcomes."],
      ["Architecture guidance", "Explore frontend, backend, database and AI/ML design trade-offs."],
      ["Debugging and testing mentoring", "Understand errors, test assumptions and improve your own code."],
      ["Demo and documentation coaching", "Explain implementation decisions, evaluation, limitations and results accurately."],
    ],
    faq: [
      ["Will you submit my assignment or project for me?", "No. Students remain responsible for their own work and institutional academic-integrity rules."],
      ["Can you guide AI, ML or Python projects?", "We can review goals and discuss available mentoring for relevant software and AI topics."],
      ["Is remote mentoring available?", "Remote sessions and code reviews can be discussed during enquiry."],
    ],
  },
} as const;

export type Slug = keyof typeof landingPages;
const solutionSlugs = Object.keys(landingPages) as Slug[];

export function solutionMetadata(slug: Slug): Metadata {
  if (!(slug in landingPages)) return {};
  const page = landingPages[slug as Slug];
  const canonical = siteConfig.url + "/solutions/" + slug;
  return {
    title: page.title + " | VOIDTECH SOLUTION",
    description: page.description,
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title: page.title, description: page.description, siteName: siteConfig.name, locale: "en_IN" },
  };
}

export function SolutionLanding({ slug }: { slug: Slug }) {
  const page = landingPages[slug as Slug];
  const url = siteConfig.url + "/solutions/" + slug;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Service", name: page.title, description: page.description, provider: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url }, areaServed: { "@type": "Country", name: "India" } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "Services", item: siteConfig.url + "/services" },
        { "@type": "ListItem", position: 3, name: page.title, item: url },
      ] },
    ],
  };
  return (
    <article className="public-editorial mx-auto max-w-5xl px-4 py-16 text-void-light sm:px-6 sm:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-void-muted"><Link href="/">Home</Link> / <Link href="/services">Services</Link> / {page.title}</nav>
      <p className="font-mono text-sm uppercase tracking-wide text-electric-purple">VOIDTECH SOLUTION · Remote service across India</p>
      <h1 className="mt-4 text-3xl font-bold text-white sm:text-5xl">{page.heading}</h1>
      <p className="mt-6 max-w-3xl text-base leading-8 text-void-muted">{page.introduction}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/contact" className="rounded-lg bg-electric-purple px-6 py-3 font-semibold text-white">Discuss your project</Link>
        <Link href="/pricing" className="rounded-lg border border-void-border px-6 py-3 font-semibold text-white">View pricing</Link>
      </div>
      <section className="mt-20" aria-labelledby="offerings-title">
        <h2 id="offerings-title" className="text-2xl font-bold text-white">What we can help with</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {page.offerings.map(([title, detail]) => <div key={title} className="rounded-xl border border-void-border bg-void-surface/40 p-6"><h3 className="text-lg font-semibold text-white">{title}</h3><p className="mt-3 leading-7 text-void-muted">{detail}</p></div>)}
        </div>
      </section>
      <section className="mt-20" aria-labelledby="faq-title">
        <h2 id="faq-title" className="text-2xl font-bold text-white">Frequently asked questions</h2>
        <div className="mt-6 space-y-6">
          {page.faq.map(([question, answer]) => <div key={question}><h3 className="text-lg font-semibold text-white">{question}</h3><p className="mt-2 leading-7 text-void-muted">{answer}</p></div>)}
        </div>
      </section>
      <section className="mt-20 border-t border-void-border pt-8">
        <h2 className="text-xl font-bold text-white">Explore more services</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          {solutionSlugs.filter((key) => key !== slug).map((key) => <Link key={key} href={"/solutions/" + key} className="text-electric-purple underline underline-offset-4">{landingPages[key].title}</Link>)}
        </div>
        <p className="mt-8 text-void-muted">We can discuss remote projects with clients across India. Location, timeline, availability and commercial terms are confirmed for each engagement.</p>
      </section>
    </article>
  );
}
