import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/actions/auth.actions";
import { prisma } from "@/lib/prisma";
import { AdminMediaClient } from "@/components/admin/cms/admin-media-client";

export const metadata = {
  title: "Media Asset Library | VOIDTECH SOLUTION",
  description: "Secure raster image uploads, WebP conversion, and digital asset management",
};

export default async function AdminMediaPage() {
  const current = await getCurrentAdmin();
  if (!current || !current.user.isActive) {
    redirect("/admin/login");
  }

  const assets = await prisma.mediaAsset
    .findMany({
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-void-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-void-purple/10 text-void-purple border border-void-purple/20">
              SAFEGUARD 5
            </span>
            <span className="text-xs text-void-gray">
              Hardened WebP Raster Pipeline (SVGs Disabled)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-void-light">
            Media Asset Library
          </h1>
          <p className="text-sm text-void-gray mt-1">
            Raster image optimization, EXIF stripping, and accessible alt-text management.
          </p>
        </div>
      </div>

      <AdminMediaClient
        initialAssets={assets}
        userRole={current.user.role}
      />
    </div>
  );
}
