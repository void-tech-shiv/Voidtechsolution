"use client";

import * as React from "react";
import type { FAQ } from "@prisma/client";
import {
  Search,
  Filter,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { createFaqAction } from "@/server/actions/admin-content.actions";

interface AdminFaqsClientProps {
  initialFaqs: FAQ[];
}

export function AdminFaqsClient({ initialFaqs }: AdminFaqsClientProps) {
  const [faqs, setFaqs] = React.useState<FAQ[]>(initialFaqs);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  // New FAQ form
  const [newQuestion, setNewQuestion] = React.useState("");
  const [newAnswer, setNewAnswer] = React.useState("");
  const [newCategory, setNewCategory] = React.useState("GENERAL");

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    faqs.forEach((f) => set.add(f.category));
    return ["ALL", ...Array.from(set)];
  }, [faqs]);

  const filteredFaqs = React.useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory = selectedCategory === "ALL" || faq.category === selectedCategory;
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [faqs, selectedCategory, searchTerm]);

  const handleCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setFeedback(null);

    try {
      const res = await createFaqAction(
        newQuestion,
        newAnswer,
        newCategory,
        faqs.length + 1
      );

      if (!res.success || !res.data) {
        setFeedback({ type: "error", message: res.error || "Failed to create FAQ." });
        return;
      }

      setFaqs((prev) => [...prev, res.data as FAQ]);
      setFeedback({ type: "success", message: "FAQ added to knowledgebase successfully." });
      setIsAddModalOpen(false);
      setNewQuestion("");
      setNewAnswer("");
      setNewCategory("GENERAL");
    } catch {
      setFeedback({ type: "error", message: "Network error occurred." });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-faqs-page">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Knowledgebase & FAQ Management
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Client-facing answers, policies, warranty definitions, and architectural FAQs.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500"
        >
          <Plus className="h-4 w-4" />
          Add Question
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-neutral-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions or keywords..."
            className="w-full rounded-xl border border-white/10 bg-neutral-950 py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-500" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "All FAQ Categories" : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          data-testid="admin-faqs-feedback"
          className={`flex items-center justify-between rounded-xl border p-4 text-sm ${
            feedback.type === "success"
              ? "border-emerald-500/20 bg-emerald-950/30 text-emerald-300"
              : "border-red-500/20 bg-red-950/30 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* FAQ List */}
      <div className="space-y-3" data-testid="admin-faqs-list">
        {filteredFaqs.map((faq) => {
          const isExpanded = expandedId === faq.id;
          return (
            <div
              key={faq.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 backdrop-blur-md transition-colors"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 rounded bg-neutral-800 px-2 py-0.5 font-mono text-[10px] text-violet-400">
                    {faq.category}
                  </span>
                  <span className="font-medium text-white">{faq.question}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-neutral-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-neutral-400" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-white/5 bg-neutral-950/40 p-5 text-xs text-neutral-300 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add FAQ Modal */}
      {isAddModalOpen && (
        <div
          data-testid="create-faq-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">Add Knowledgebase Entry</h2>
            <form onSubmit={handleCreateFaq} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                >
                  <option value="GENERAL">GENERAL</option>
                  <option value="TECHNICAL">TECHNICAL</option>
                  <option value="PRICING">PRICING</option>
                  <option value="PAYMENTS">PAYMENTS</option>
                  <option value="SUPPORT">SUPPORT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300">Question</label>
                <input
                  type="text"
                  required
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="e.g. Do you support custom ERP integrations?"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300">Answer</label>
                <textarea
                  required
                  rows={4}
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Provide detailed, accurate explanation..."
                  className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
