import { describe, it, expect } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { siteConfig } from "@/config/site";
import { metadata as homeMetadata } from "@/app/page";
import { metadata as aboutMetadata } from "@/app/about/page";
import { metadata as servicesMetadata } from "@/app/services/page";
import { metadata as pricingMetadata } from "@/app/pricing/page";
import { metadata as portfolioMetadata } from "@/app/portfolio/page";
import { metadata as contactMetadata } from "@/app/contact/page";

describe("Phase 8.4: Technical SEO & Canonical Domain Verification", () => {
  it("enforces the approved production canonical domain across siteConfig", () => {
    expect(siteConfig.url).toBe("https://voidtechsolution.codedev.co.in");
    expect(siteConfig.contactEmail).toBe("voidtechsolutionsupport@gmail.com");
  });

  it("generates compliant robots.txt with disallows and sitemap declaration", () => {
    const robotsConfig = robots();
    expect(robotsConfig.rules).toBeDefined();
    
    // Check rules
    const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;
    expect(rules).toBeDefined();
    expect(rules?.allow).toBe("/");
    expect(rules?.disallow).toContain("/admin/");
    expect(rules?.disallow).toContain("/api/");
    expect(robotsConfig.sitemap).toBe("https://voidtechsolution.codedev.co.in/sitemap.xml");
  });

  it("generates XML sitemap containing all 6 core public routes", async () => {
    const entries = await sitemap();
    expect(entries.length).toBeGreaterThanOrEqual(6);

    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain("https://voidtechsolution.codedev.co.in");
    expect(urls).toContain("https://voidtechsolution.codedev.co.in/about");
    expect(urls).toContain("https://voidtechsolution.codedev.co.in/services");
    expect(urls).toContain("https://voidtechsolution.codedev.co.in/pricing");
    expect(urls).toContain("https://voidtechsolution.codedev.co.in/portfolio");
    expect(urls).toContain("https://voidtechsolution.codedev.co.in/contact");

    // Must not contain any legacy domain
    for (const url of urls) {
      expect(url).not.toContain("voidtechsolution.com");
      expect(url).toContain("https://voidtechsolution.codedev.co.in");
    }
  });

  it("verifies canonical link declarations across all 6 core public page metadata", () => {
    expect((homeMetadata as any).alternates?.canonical).toBe(
      "https://voidtechsolution.codedev.co.in"
    );
    expect((aboutMetadata as any).alternates?.canonical).toBe(
      "https://voidtechsolution.codedev.co.in/about"
    );
    expect((servicesMetadata as any).alternates?.canonical).toBe(
      "https://voidtechsolution.codedev.co.in/services"
    );
    expect((pricingMetadata as any).alternates?.canonical).toBe(
      "https://voidtechsolution.codedev.co.in/pricing"
    );
    expect((portfolioMetadata as any).alternates?.canonical).toBe(
      "https://voidtechsolution.codedev.co.in/portfolio"
    );
    expect((contactMetadata as any).alternates?.canonical).toBe(
      "https://voidtechsolution.codedev.co.in/contact"
    );
  });
});

