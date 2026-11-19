import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Remote Website Development & Software Services Across India | VOIDTECH SOLUTION",
  description: "Explore how VOIDTECH SOLUTION works remotely with businesses in Hyderabad, Vijayawada, Guntur, Bengaluru, Chennai and other Indian cities for websites, ecommerce and AI automation.",
  alternates: { canonical: siteConfig.url + "/service-areas" },
  openGraph: {
    type: "website",
    title: "Software Development Services Across India | VOIDTECH SOLUTION",
    description: "Remote website development, ecommerce and AI automation for Indian businesses, with practical requirements gathering and delivery.",
    url: siteConfig.url + "/service-areas",
    locale: "en_IN",
    siteName: siteConfig.name,
  },
};

const regions = [
  { city: "Hyderabad", detail: "Websites and customer-facing tools for startups, professional services and growing companies." },
  { city: "Vijayawada", detail: "Business websites, enquiry systems and custom web applications for local and regional companies." },
  { city: "Guntur", detail: "Mobile-friendly business websites, online catalogues and digital operations workflows." },
  { city: "Bengaluru", detail: "SaaS interfaces, internal dashboards, ecommerce workflows and AI-assisted software." },
  { city: "Chennai", detail: "Business websites, online stores and integration-heavy web application projects." },
  { city: "Visakhapatnam", detail: "Service-business websites, lead capture and practical custom automation." },
] as const;

const services = [
  { name: "Website design and development", href: "/solutions/website-development", detail: "Responsive business websites, marketing pages and tailored web applications." },
  { name: "Ecommerce website development", href: "/solutions/ecommerce-development", detail: "Online storefronts, product catalogues, checkout and order management." },
  { name: "AI automation and chatbots", href: "/solutions/ai-automation", detail: "Workflow mapping, approved API integrations and human-supervised AI tools." },
  { name: "College project mentoring", href: "/solutions/college-project-mentoring", detail: "Learning-focused architecture reviews, debugging guidance and project mentoring." },
];

export default function ServiceAreasPage() {
  const canonical = siteConfig.url + "/service-areas";
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": canonical + "#remote-services",
    name: "Remote software development and website services across India",
    serviceType: "Software development and web development",
    provider: { "@type": "Organization", "@id": siteConfig.url + "/#organization", name: siteConfig.name, url: siteConfig.url },
    areaServed: { "@type": "Country", name: "India" },
    url: canonical,
  };
  return (
    <article className="public-editorial mx-auto max-w-5xl px-4 py-16 text-void-light sm:px-6 sm:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-void-muted"><Link href="/">Home</Link> / Service areas</nav>
      <p className="font-mono text-sm uppercase tracking-wide text-electric-purple">Remote-first collaboration · India</p>
      <h1 className="mt-4 text-3xl font-bold text-white sm:text-5xl">Website development and software services across India</h1>
      <p className="mt-6 max-w-3xl text-base leading-8 text-void-muted">
        Looking for a website developer or software agency in your city? VOIDTECH SOLUTION works remotely with Indian businesses to scope, design and build digital products. Discovery calls, design reviews, development milestones and handover can happen online, without requiring an office visit.
      </p>
      <section className="mt-16" aria-labelledby="locations-title">
        <h2 id="locations-title" className="text-2xl font-bold text-white">Cities we can discuss remote projects with</h2>
        <p className="mt-3 leading-7 text-void-muted">These are examples of target service markets, not physical office locations or claims of completed client projects. Enquiries are welcome from other Indian cities too.</p>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {regions.map(({ city, detail }) => (
            <div key={city} className="rounded-xl border border-void-border bg-void-surface/40 p-6">
              <h3 className="text-lg font-semibold text-white">{city}</h3>
              <p className="mt-3 leading-7 text-void-muted">{detail}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-16" aria-labelledby="services-title">
        <h2 id="services-title" className="text-2xl font-bold text-white">Choose the service that fits your project</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {services.map(({ name, href, detail }) => (
            <div key={href} className="rounded-xl border border-void-border bg-void-surface/40 p-6">
              <h3 className="text-lg font-semibold"><Link href={href} className="text-electric-purple hover:underline">{name}</Link></h3>
              <p className="mt-3 leading-7 text-void-muted">{detail}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-16" aria-labelledby="process-title">
        <h2 id="process-title" className="text-2xl font-bold text-white">How remote delivery works</h2>
        <ol className="mt-6 list-decimal space-y-3 pl-5 leading-7 text-void-muted">
          <li>Share your city, business type, desired website or application, and timeline.</li>
          <li>Discuss requirements, content ownership, deliverables and any third-party integrations.</li>
          <li>Review a project proposal and agree on implementation milestones before work starts.</li>
          <li>Collaborate through scheduled check-ins, reviews and testing.</li>
          <li>Receive the agreed source code, access and documentation at handover.</li>
        </ol>
      </section>
      <section className="mt-16" aria-labelledby="area-faq-title">
        <h2 id="area-faq-title" className="text-2xl font-bold text-white">Frequently asked questions</h2>
        <div className="mt-6 space-y-6">
          <div><h3 className="text-lg font-semibold text-white">Do you have an office in every listed city?</h3><p className="mt-2 text-void-muted">No. This page describes remote service coverage only, not branch office locations.</p></div>
          <div><h3 className="text-lg font-semibold text-white">Can you work with clients outside these cities?</h3><p className="mt-2 text-void-muted">Yes. Remote projects can be discussed from other Indian locations, subject to project requirements and availability.</p></div>
          <div><h3 className="text-lg font-semibold text-white">Can I get a quote before committing?</h3><p className="mt-2 text-void-muted">Yes. Share your requirements through the enquiry form to begin project scoping. Pricing depends on the deliverables and complexity.</p></div>
        </div>
      </section>
      <Link href="/contact" className="mt-12 inline-block rounded-lg bg-electric-purple px-6 py-3 font-semibold text-white">Request a project quote</Link>
    </article>
  );
}
