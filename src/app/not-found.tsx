import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BrandLogo } from "@/components/ui/brand-logo";

export default function NotFound() {
  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center px-4 py-16 text-center relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-void-glow-radial opacity-40"
        aria-hidden="true"
      />

      <BrandLogo variant="emblem" size="md" className="mb-6" />

      <div className="relative mb-6 flex h-20 w-24 items-center justify-center rounded-2xl border border-electric-purple/30 bg-void-card/90 shadow-glow-md backdrop-blur-xl">
        <span className="font-mono text-3xl font-bold text-electric-purple">404</span>
        <div className="absolute -inset-1 rounded-2xl border border-electric-purple/20 blur-sm" />
      </div>

      <h1 className="font-mono text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        Page Not Found
      </h1>

      <p className="mt-3 max-w-md text-sm text-void-light">
        The destination you are looking for does not exist or has been relocated within the VOIDTECH ecosystem.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className={buttonVariants({
            variant: "glow",
            size: "md",
            className: "gap-2",
          })}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Homepage</span>
        </Link>
        <Link
          href="/services"
          className={buttonVariants({
            variant: "outline",
            size: "md",
          })}
        >
          Explore Services
        </Link>
      </div>
    </div>
  );
}

