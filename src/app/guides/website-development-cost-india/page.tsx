import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { PricingRepo } from "@/server/repositories";

const canonical = siteConfig.url + "/guides/website-development-cost-india";

export const metadata: Metadata = {
  title: "Website Development Cost in India: Scope, Pricing & Hiring Guide | VOIDTECH SOLUTION",
  description: "Compare business website types, what affects website development cost in India, practical quote questions and VOIDTECH SOLUTION's current editable website pricing packages.",
  alternates: { canonical },
  openGraph: {
    title: "Website Development Cost in India: A Practical Buyer Guide",
    description: "Understand website pricing, what affects quotes and how to choose the right development scope for your business.",
    url: canonical,
    type: "article",
    locale: "en_IN",
    siteName: siteConfig.name,
  },
};

const costFactors = [
  {
    title: "Number of pages and content",
    text: "A focused landing page usually needs less design, content and testing than a multi-page business site. Decide who supplies the copy, photos, service details, translations and brand assets before comparing quotes.",
  },
  {
    title: "Website versus web application",
    text: "A public information site has different requirements from a customer portal with accounts, permissions, dashboards or a database. Ask for a clear feature list and separate estimates for extras.",
  },
  {
    title: "Design and revision scope",
    text: "A template-based design, a tailored visual system and extensive interactive behaviour require different amounts of design effort. Agree on review milestones and the number of revisions in writing.",
  },
  {
    title: "Integrations and ongoing costs",
    text: "Forms, email delivery, payments, analytics, CMS, hosting, domain registration and third-party APIs can introduce implementation costs or recurring vendor charges. Ask which services are included and which you pay separately.",
  },
  {
    title: "Quality requirements",
    text: "Responsive layouts, accessibility, search-friendly HTML, secure handling of forms, performance tests, backups and handover documentation should be discussed explicitly rather than assumed.",
  },
];

const comparison = [
  {
    type: "Landing page",
    ideal: "One product, campaign, event or lead-generation offer",
    features: "Clear message, call to action, contact or enquiry flow",
    ask: "Who provides copy and images? How will conversions be measured?",
  },
  {
    type: "Business website",
    ideal: "Professional services, agencies, local businesses and organisations",
    features: "Home, service pages, about, contact, mobile navigation",
    ask: "How many service pages? Is content editing included?",
  },
  {
    type: "Ecommerce website",
    ideal: "Businesses selling products or services online",
    features: "Catalogue, cart or checkout, order handling and payments",
    ask: "Which payment provider, fulfilment process and product inventory?",
  },
  {
    type: "Custom web application",
    ideal: "Businesses with unique operational workflows",
    features: "Logins, database, integrations, roles and custom dashboards",
    ask: "What user roles, audit controls and technical support are needed?",
  },
];

const buyingChecklist = [
  "List the purpose of the website and its main audience.",
  "Define the pages, required languages and who writes the content.",
  "Separate must-have features from optional future improvements.",
  "Confirm the ownership of code, accounts, hosting and domain.",
  "Ask for mobile testing, accessibility and basic on-page SEO deliverables.",
  "Document milestone approvals, revisions and warranty or support terms.",
  "Identify any third-party subscription, API or payment fees.",
  "Request an itemised written quote before paying a deposit.",
];

export default async function WebsiteCostGuide() {
  const allPackages = await PricingRepo.getActivePricingPackages();
  const websitePackages = allPackages.filter((pkg) => pkg.category === "WEB_DEVELOPMENT");
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": canonical + "#article",
        headline: "Website Development Cost in India: A Practical Buyer Guide",
        description: metadata.description,
        mainEntityOfPage: canonical,
        inLanguage: "en-IN",
        author: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
        publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "Website development", item: siteConfig.url + "/solutions/website-development" },
          { "@type": "ListItem", position: 3, name: "Website cost guide", item: canonical },
        ],
      },
    ],
  };

  return (
    <article className="public-editorial mx-auto max-w-5xl px-4 py-16 text-void-light sm:px-6 sm:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="text-sm text-void-muted">
        <Link className="hover:text-electric-purple" href="/">Home</Link> / <Link className="hover:text-electric-purple" href="/solutions/website-development">Website development</Link> / Cost guide
      </nav>
      <p className="mt-10 font-mono text-xs uppercase tracking-widest text-electric-purple">Business website planning guide · India</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">How much does website development cost in India?</h1>
      <p className="mt-6 max-w-3xl text-base leading-8 text-void-muted">
        There is no single accurate price for every website. A one-page landing page, a small business website, an online shop and a software dashboard all involve different scope. This guide explains how to compare quotes, what to ask an agency and how to identify the services your business actually needs.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link href="/pricing" className="rounded-lg bg-electric-purple px-6 py-3 font-semibold text-white">See current agency pricing</Link>
        <Link href="/contact" className="rounded-lg border border-void-border px-6 py-3 font-semibold text-white">Request a tailored estimate</Link>
      </div>

      <section className="mt-16" aria-labelledby="website-types-title">
        <h2 id="website-types-title" className="text-2xl font-bold text-white">Start by choosing the right website type</h2>
        <p className="mt-3 leading-7 text-void-muted">The right scope is usually more useful than the largest feature list. These common categories help make a quote comparable.</p>
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          {comparison.map((item) => (
            <div key={item.type} className="rounded-xl border border-void-border bg-void-surface/40 p-6">
              <h3 className="text-lg font-semibold text-white">{item.type}</h3>
              <p className="mt-3 leading-7 text-void-muted"><strong className="text-white">Best fit:</strong> {item.ideal}</p>
              <p className="mt-2 leading-7 text-void-muted"><strong className="text-white">Typical scope:</strong> {item.features}</p>
              <p className="mt-2 leading-7 text-void-muted"><strong className="text-white">Ask:</strong> {item.ask}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16" aria-labelledby="cost-drivers-title">
        <h2 id="cost-drivers-title" className="text-2xl font-bold text-white">What affects a website development quote?</h2>
        <div className="mt-6 space-y-6">
          {costFactors.map((factor, index) => (
            <div key={factor.title}>
              <h3 className="text-lg font-semibold text-white">{index + 1}. {factor.title}</h3>
              <p className="mt-2 leading-7 text-void-muted">{factor.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16" aria-labelledby="agency-prices-title">
        <h2 id="agency-prices-title" className="text-2xl font-bold text-white">Current VOIDTECH SOLUTION website packages</h2>
        <p className="mt-3 leading-7 text-void-muted">
          These prices come from our currently active agency pricing catalogue, not a claim about the average price charged by developers in India. Package details can change through our admin dashboard. Final scope, availability, third-party fees and deliverables must be confirmed in writing.
        </p>
        {websitePackages.length > 0 ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            {websitePackages.map((pkg) => (
              <div key={pkg.id} className="rounded-xl border border-void-border bg-void-surface/40 p-6">
                <h3 className="text-lg font-semibold text-white">{pkg.name}</h3>
                <p className="mt-3 text-2xl font-bold text-electric-purple">
                  ₹{pkg.priceInr.toLocaleString("en-IN")}{pkg.isStartingPrice ? "+" : ""}
                </p>
                <p className="mt-2 text-xs text-void-muted">{pkg.isStartingPrice ? "Starting price; final scope affects quote" : "Listed package price; confirm what is included"}</p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-void-muted">
                  {pkg.features.slice(0, 4).map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-lg border border-void-border p-5 text-void-muted">No standard website packages are currently displayed. You can still request a project-specific quote.</p>
        )}
        <Link className="mt-6 inline-block text-electric-purple underline underline-offset-4" href="/pricing">Compare all packages and use our project calculator</Link>
      </section>

      <section className="mt-16" aria-labelledby="quote-checklist-title">
        <h2 id="quote-checklist-title" className="text-2xl font-bold text-white">Website agency quote checklist</h2>
        <p className="mt-3 leading-7 text-void-muted">Take these questions to any developer or agency. Use the same requirements when comparing proposals.</p>
        <ul className="mt-6 list-disc space-y-3 pl-5 leading-7 text-void-muted">
          {buyingChecklist.map((point) => <li key={point}>{point}</li>)}
        </ul>
      </section>

      <section className="mt-16" aria-labelledby="choosing-title">
        <h2 id="choosing-title" className="text-2xl font-bold text-white">How to compare website developers in your city</h2>
        <p className="mt-3 leading-7 text-void-muted">
          Whether you are searching in Hyderabad, Vijayawada, Guntur, Chennai or elsewhere, request examples relevant to your project and verify what the developer actually built. Ask who maintains your domain, where your data is hosted and what happens after launch. A remote team can be suitable when communication and delivery processes are clear; do not assume every agency has an office in your city.
        </p>
        <p className="mt-4 leading-7 text-void-muted">
          Review our <Link className="text-electric-purple underline" href="/portfolio">portfolio and engineering concepts</Link> to see the types of systems discussed on this website. Projects marked as concepts or lab work should not be interpreted as paying client results.
        </p>
        <Link className="mt-5 inline-block text-electric-purple underline underline-offset-4" href="/service-areas">See how remote service delivery works across India</Link>
      </section>

      <section className="mt-16 border-t border-void-border pt-8">
        <h2 className="text-2xl font-bold text-white">Ready to discuss a business website?</h2>
        <p className="mt-3 leading-7 text-void-muted">Share your website type, target customers, pages and required integrations. We can help define an appropriate scope and quote.</p>
        <Link href="/contact" className="mt-6 inline-block rounded-lg bg-electric-purple px-6 py-3 font-semibold text-white">Request website development quote</Link>
      </section>
    </article>
  );
}
