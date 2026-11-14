"use client";

import * as React from "react";
import type { PageSection, UserRole } from "@prisma/client";
import { Edit3, Check } from "lucide-react";
import { GlassCard } from "@/components/ui/card";

interface AdminPageSectionsClientProps {
  initialSections: PageSection[];
  userRole?: UserRole;
}

export function AdminPageSectionsClient({
  initialSections,
}: AdminPageSectionsClientProps) {

  const [sections, setSections] = React.useState(initialSections);
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editSubtitle, setEditSubtitle] = React.useState("");
  const [editContent, setEditContent] = React.useState("");
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const startEdit = (section: PageSection) => {
    setEditingKey(section.key);
    setEditTitle(section.title);
    setEditSubtitle(section.subtitle || "");
    setEditContent(section.content);
    setSaveSuccess(false);
  };

  const handleSave = (key: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.key === key
          ? {
              ...s,
              title: editTitle,
              subtitle: editSubtitle || null,
              content: editContent,
              updatedAt: new Date(),
            }
          : s
      )
    );
    setEditingKey(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>Section copy updated successfully.</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {sections.map((sec) => {
          const isEditing = editingKey === sec.key;

          return (
            <GlassCard
              key={sec.key}
              className="p-6 bg-void-dark/60 border-void-border/80"
            >
              <div className="flex items-center justify-between border-b border-void-border/40 pb-4 mb-4">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-void-black text-void-purple border border-void-border">
                    {sec.key}
                  </span>
                  <span className="ml-2 text-xs text-void-gray">
                    Page: <strong className="text-void-light">{sec.pageSlug}</strong>
                  </span>
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => startEdit(sec)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-void-purple/10 text-void-purple hover:bg-void-purple hover:text-white border border-void-purple/20 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Copy
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-void-gray mb-1">
                      Headline / Title
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-void-black border border-void-border text-sm text-void-light focus:border-void-purple outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-void-gray mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={editSubtitle}
                      onChange={(e) => setEditSubtitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-void-black border border-void-border text-sm text-void-light focus:border-void-purple outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-void-gray mb-1">
                      Markdown Body Content
                    </label>
                    <textarea
                      rows={4}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-void-black border border-void-border text-sm text-void-light focus:border-void-purple outline-none font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingKey(null)}
                      className="px-4 py-2 text-xs font-medium rounded-lg text-void-gray hover:text-void-light transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave(sec.key)}
                      className="px-4 py-2 text-xs font-medium rounded-lg bg-void-purple text-white hover:bg-void-purple/90 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-void-light">
                    {sec.title}
                  </h3>
                  {sec.subtitle && (
                    <p className="text-sm text-void-purple font-medium">
                      {sec.subtitle}
                    </p>
                  )}
                  <p className="text-sm text-void-gray whitespace-pre-wrap">
                    {sec.content}
                  </p>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
