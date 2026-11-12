import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border border-[rgba(70,180,230,0.3)] bg-[#081A2B]/80 shadow-[0_0_30px_rgba(0,212,255,0.25)] backdrop-blur-xl">
        <span className="font-mono text-3xl font-bold text-cyan-400">404</span>
        <div className="absolute -inset-1 rounded-2xl border border-cyan-400/20 blur-sm" />
      </div>

      <h1 className="font-sans text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        Page Not Found
      </h1>

      <p className="mt-3 max-w-md text-sm text-slate-300">
        The destination you are looking for does not exist or has been relocated within the VOIDTECH ecosystem.
      </p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className={buttonVariants({
            variant: "glow",
            size: "md",
            className:
              "gap-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-400 text-white font-semibold shadow-[0_0_16px_rgba(0,212,255,0.4)]",
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
            className: "border-[rgba(70,180,230,0.4)] text-cyan-300 hover:bg-cyan-950/40",
          })}
        >
          Explore Services
        </Link>
      </div>
    </div>
  );
}
