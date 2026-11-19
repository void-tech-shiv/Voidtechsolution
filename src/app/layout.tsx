import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FloatingWhatsApp } from "@/components/layout/floating-whatsapp";
import { DraftModeHudBanner } from "@/components/layout/draft-mode-hud-banner";
import { draftMode } from "next/headers";
import { siteConfig } from "@/config/site";

import "./globals.css";

const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  fallback: ["monospace"],
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: "%s",
  },
  description: siteConfig.description,
  keywords: [
    "Software Development Agency",
    "Next.js Development",
    "AI Automation",
    "AI Agents",
    "Custom API Development",
    "Mobile Apps",
    "SaaS Development",
    "PostgreSQL",
    "VOIDTECH SOLUTION",
  ],
  authors: [{ name: "VOIDTECH SOLUTION Team" }],
  creator: "VOIDTECH SOLUTION",
  metadataBase: new URL(siteConfig.url),
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/voidtech-symbol.webp", type: "image/webp" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "VOIDTECH SOLUTION — Build. Launch. Grow Online.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#050507",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let isDraftMode = false;
  try {
    const draft = await draftMode();
    isDraftMode = draft.isEnabled;
  } catch {
    // Draft mode helper safe fallback
  }

  const siteIdentity = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": siteConfig.url + "/#organization",
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        logo: siteConfig.url + "/brand/voidtech-symbol.webp",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          email: siteConfig.contactEmail,
          availableLanguage: ["English", "Hindi"],
        },
      },
      {
        "@type": "WebSite",
        "@id": siteConfig.url + "/#website",
        name: siteConfig.name,
        url: siteConfig.url,
        inLanguage: "en-IN",
        publisher: { "@id": siteConfig.url + "/#organization" },
      },
    ],
  };

  return (
    <html
      lang="en"
      className={`dark ${sansFont.variable} ${monoFont.variable}`}
    >
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteIdentity).replace(/</g, "\\u003c") }} />
        {isDraftMode && (
          <meta name="robots" content="noindex, nofollow" />
        )}
      </head>
      <body className="min-h-screen bg-void-black font-sans text-void-light antialiased selection:bg-electric-purple selection:text-white">
        {isDraftMode && <DraftModeHudBanner />}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-electric-purple focus:px-4 focus:py-2.5 focus:text-white focus:shadow-glow-md focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to main content
        </a>
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
          <FloatingWhatsApp />
        </div>
      </body>
    </html>
  );
}

