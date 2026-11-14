"use client";

import * as React from "react";
import type { MediaAsset, UserRole } from "@prisma/client";
import {
  UploadCloud,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
} from "lucide-react";

import { uploadMediaAction, deleteMediaAction } from "@/server/actions/cms/media.actions";

interface AdminMediaClientProps {
  initialAssets: MediaAsset[];
  userRole: UserRole;
}

export function AdminMediaClient({ initialAssets, userRole }: AdminMediaClientProps) {
  const [assets, setAssets] = React.useState(initialAssets);
  const [isUploading, setIsUploading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [altText, setAltText] = React.useState("");
  const [caption, setCaption] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const isSuperAdmin = userRole === "SUPER_ADMIN";

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      setErrorMsg("Please select an image file to upload.");
      return;
    }

    const file = files[0];
    if (!file) return;

    if (!altText || altText.trim().length < 3) {
      setErrorMsg("Accessible alt text of at least 3 characters is mandatory.");
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("defaultAltText", altText.trim());
    if (caption) formData.append("caption", caption.trim());

    const res = await uploadMediaAction(formData);

    if (res.success && res.data) {
      setAssets((prev) => [res.data as MediaAsset, ...prev]);
      setSuccessMsg(`File "${file.name}" processed into WebP and uploaded.`);
      setAltText("");
      setCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setErrorMsg(res.error?.message || "Upload failed.");
    }

    setIsUploading(false);
  };

  const handleDelete = async (id: string, filename: string) => {
    if (!isSuperAdmin) {
      setErrorMsg("Permanent deletion of media assets is restricted to SUPER_ADMIN.");
      return;
    }

    if (!confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await deleteMediaAction(id);
    if (res.success) {
      setAssets((prev) => prev.filter((a) => a.id !== id));
      setSuccessMsg(`Asset "${filename}" deleted.`);
    } else {
      setErrorMsg(res.error?.message || "Failed to delete asset.");
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setSuccessMsg("Public URL copied to clipboard.");
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Messages */}
      {errorMsg && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3 animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3 animate-in fade-in"
        >
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Upload Box */}
      <form
        onSubmit={handleUpload}
        className="p-6 rounded-xl border border-void-border/80 bg-void-dark/60 space-y-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <UploadCloud className="w-5 h-5 text-void-purple" />
          <h2 className="text-sm font-semibold text-void-light">
            Upload New Media Asset
          </h2>
          <span className="text-xs text-void-gray">
            (JPEG, PNG, WebP — Max 5.0 MB; Auto-WebP conversion)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-void-gray mb-1">
              Select Image File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="w-full text-xs text-void-gray file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-void-purple/20 file:text-void-purple hover:file:bg-void-purple/30 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-void-gray mb-1">
              Accessible Alt Text <span className="text-void-purple">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Agency engineering team diagram"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-void-black border border-void-border text-xs text-void-light focus:border-void-purple outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-void-gray mb-1">
              Caption (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Distributed system architecture"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-void-black border border-void-border text-xs text-void-light focus:border-void-purple outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-void-purple text-white text-xs font-semibold hover:bg-void-purple/90 transition-colors disabled:opacity-40"
          >
            <UploadCloud className="w-4 h-4" />
            {isUploading ? "Processing & Converting..." : "Upload & Transcode"}
          </button>
        </div>
      </form>

      {/* Asset Grid */}
      <div>
        <h3 className="text-base font-semibold text-void-light mb-4 flex items-center justify-between">
          <span>Registered Assets ({assets.length})</span>
          <span className="text-xs text-void-gray font-mono">WebP Optimized</span>
        </h3>

        {assets.length === 0 ? (
          <div className="text-center py-16 border border-void-border/60 rounded-xl bg-void-dark/30 text-void-gray text-xs">
            No media assets uploaded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="group border border-void-border/80 rounded-xl bg-void-dark/50 overflow-hidden hover:border-void-purple/50 transition-all flex flex-col"
              >
                {/* Preview Thumbnail */}
                <div className="relative aspect-video bg-void-black flex items-center justify-center overflow-hidden border-b border-void-border/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.publicUrl}
                    alt={asset.defaultAltText}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/80 text-void-gray">

                    {asset.width ? `${asset.width}x${asset.height}` : "WebP"}
                  </span>
                </div>

                {/* Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="font-semibold text-xs text-void-light truncate" title={asset.originalName}>
                      {asset.originalName}
                    </div>
                    <div className="text-[11px] text-void-gray mt-0.5 truncate" title={asset.defaultAltText}>
                      Alt: {asset.defaultAltText}
                    </div>
                    <div className="text-[10px] font-mono text-void-gray mt-1">
                      {(asset.sizeBytes / 1024).toFixed(1)} KB • {asset.mimeType}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-void-border/40">
                    <button
                      type="button"
                      onClick={() => copyUrl(asset.publicUrl)}
                      className="inline-flex items-center gap-1 text-[11px] text-void-purple hover:underline"
                    >
                      <Copy className="w-3 h-3" />
                      Copy URL
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(asset.id, asset.originalName)}
                      disabled={!isSuperAdmin}
                      title={isSuperAdmin ? "Delete asset" : "Only SUPER_ADMIN can delete media"}
                      className="p-1 rounded text-void-gray hover:text-red-400 disabled:opacity-30 disabled:hover:text-void-gray transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
