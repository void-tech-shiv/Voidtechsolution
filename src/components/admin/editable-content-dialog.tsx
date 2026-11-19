"use client";

import * as React from "react";
import { Loader2, Pencil, Save, X } from "lucide-react";
import type { FAQ, PortfolioProject, PricingPackage, Service } from "@prisma/client";
import {
  saveAdminEditableContentAction,
} from "@/server/actions/admin-edit.actions";

type Props =
  | { kind: "pricing"; row: PricingPackage; onSaved: (row: PricingPackage) => void }
  | { kind: "service"; row: Service; onSaved: (row: Service) => void }
  | { kind: "portfolio"; row: PortfolioProject; onSaved: (row: PortfolioProject) => void }
  | { kind: "faq"; row: FAQ; onSaved: (row: FAQ) => void };

const inputClass =
  "mt-1 w-full rounded-lg border border-white/15 bg-neutral-950 px-3 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30";
const fieldLabel = "block text-xs font-semibold text-neutral-300";

function Input({
  label, name, value, type = "text", required = true, maxLength,
  min, max, placeholder,
}: {
  label: string; name: string; value: string | number;
  type?: string; required?: boolean; maxLength?: number;
  min?: number; max?: number; placeholder?: string;
}) {
  return <label className={fieldLabel}>{label}
    <input className={inputClass} name={name} type={type}
      defaultValue={value} required={required} maxLength={maxLength}
      min={min} max={max} step={type === "number" ? 1 : undefined}
      placeholder={placeholder} />
  </label>;
}

function Textarea({
  label, name, value, maxLength, minLength = 0, rows = 4, hint,
}: {
  label: string; name: string; value: string;
  maxLength: number; minLength?: number; rows?: number; hint?: string;
}) {
  return <label className={fieldLabel}>{label}
    {hint && <span className="mt-1 block text-[11px] font-normal text-neutral-500">{hint}</span>}
    <textarea className={inputClass} name={name} defaultValue={value}
      rows={rows} minLength={minLength} maxLength={maxLength} required />
  </label>;
}

function Check({ label, name, checked }: { label: string; name: string; checked: boolean }) {
  return <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 p-3 text-xs text-neutral-200">
    <input className="h-4 w-4 accent-violet-500" type="checkbox" name={name}
      defaultChecked={checked} />
    {label}
  </label>;
}

export function AdminEditableContentDialog(props: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const dialogRef = React.useRef<HTMLDivElement>(null);

  const close = React.useCallback(() => {
    if (pending) return;
    setOpen(false);
    setError(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, [pending]);

  React.useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = dialogRef.current?.querySelector<HTMLInputElement>(
      'input:not([type="hidden"]):not([type="checkbox"])'
    );
    first?.focus();
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape" && !pending) {
      e.preventDefault();
      close();
    }
    if (e.key === "Tab") {
      const items = dialogRef.current?.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]), textarea, select, button:not(:disabled)'
      );
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await saveAdminEditableContentAction(
        props.kind, new FormData(e.currentTarget)
      );
      if (!result.success || !result.data) {
        setError(result.error || "Changes were not saved.");
        return;
      }
      switch (props.kind) {
        case "pricing":
          props.onSaved(result.data as PricingPackage);
          break;
        case "service":
          props.onSaved(result.data as Service);
          break;
        case "portfolio":
          props.onSaved(result.data as PortfolioProject);
          break;
        case "faq":
          props.onSaved(result.data as FAQ);
          break;
      }
      setOpen(false);
      requestAnimationFrame(() => triggerRef.current?.focus());
    } catch {
      setError("Could not save changes. Refresh the page and retry.");
    } finally {
      setPending(false);
    }
  }

  const row = props.row;
  const heading = props.kind === "pricing" ? (row as PricingPackage).name
    : props.kind === "service" ? (row as Service).title
      : props.kind === "portfolio" ? (row as PortfolioProject).title
        : (row as FAQ).question;

  return <>
    <button type="button" ref={triggerRef}
      onClick={() => { setError(null); setOpen(true); }}
      className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-200 hover:bg-violet-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
      aria-label={`Edit ${heading}`}
    ><Pencil className="h-3.5 w-3.5" /> Edit</button>

    {open && <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-5"
      onKeyDown={handleKeyDown}
    >
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="content-editor-title"
        className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-neutral-900 shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
          <div>
            <h2 id="content-editor-title" className="text-lg font-bold text-white">Edit {props.kind}</h2>
            <p className="mt-1 text-xs text-neutral-400">/{("slug" in row) ? row.slug : "faq"} · Changes are saved directly to the website.</p>
          </div>
          <button type="button" aria-label="Close editor" disabled={pending}
            onClick={close} className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-40">
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="expectedUpdatedAt" value={new Date(row.updatedAt).toISOString()} />
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            {props.kind === "pricing" && <PricingFields row={props.row} />}
            {props.kind === "service" && <ServiceFields row={props.row} />}
            {props.kind === "portfolio" && <PortfolioFields row={props.row} />}
            {props.kind === "faq" && <FaqFields row={props.row} />}
            {error && <div role="alert" className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-xs text-red-200">{error}</div>}
            <p className="text-[11px] text-neutral-500">Public URLs (slugs) remain unchanged. The server verifies permissions, validates values and checks for concurrent edits.</p>
          </div>
          <footer className="flex justify-end gap-3 border-t border-white/10 p-5">
            <button type="button" disabled={pending} onClick={close}
              className="rounded-lg border border-white/15 px-4 py-2.5 text-xs text-neutral-200 hover:bg-neutral-800 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {pending ? "Saving…" : "Save changes"}
            </button>
          </footer>
        </form>
      </div>
    </div>}
  </>;
}

function PricingFields({ row }: { row: PricingPackage }) {
  return <>
    <Input label="Package name" name="name" value={row.name} maxLength={120} />
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="Price (₹ INR)" name="priceInr" value={row.priceInr} type="number" min={1} max={2_000_000_000} />
      <Input label="Display order" name="orderIndex" value={row.orderIndex} type="number" min={0} max={100000} />
    </div>
    <Input label="Billing period (optional)" name="billingPeriod" value={row.billingPeriod || ""} required={false} maxLength={40} placeholder="one-time / monthly" />
    <Textarea label="Included features (one per line)" name="features" value={row.features.join("\n")} rows={7} maxLength={10000}
      hint="Each line becomes one bullet in the public pricing card." />
    <div className="grid gap-2 sm:grid-cols-3">
      <Check label="Starting price (+)" name="isStartingPrice" checked={row.isStartingPrice} />
      <Check label="Highlight popular" name="popular" checked={row.popular} />
      <Check label="Visible on site" name="isActive" checked={row.isActive} />
    </div>
  </>;
}

function ServiceFields({ row }: { row: Service }) {
  return <>
    <Input label="Service title" name="title" value={row.title} maxLength={140} />
    <Textarea label="Short description" name="shortDesc" value={row.shortDesc} maxLength={350} rows={2} />
    <Textarea label="Full description" name="fullDesc" value={row.fullDesc} maxLength={6000} minLength={10} rows={5} />
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="Starting price (₹, blank for custom)" name="startingPriceInr" value={row.startingPriceInr ?? ""} type="number" required={false} min={1} max={2_000_000_000} />
      <Input label="Display order" name="orderIndex" value={row.orderIndex} type="number" min={0} max={100000} />
    </div>
    <Textarea label="Deliverables (one per line)" name="deliverables" value={row.deliverables.join("\n")} maxLength={10000} rows={5} />
    <Textarea label="Technologies (one per line)" name="technologies" value={row.technologies.join("\n")} maxLength={10000} rows={4} />
    <div className="grid gap-2 sm:grid-cols-2">
      <Check label="Featured service" name="isFeatured" checked={row.isFeatured} />
      <Check label="Visible on site" name="isActive" checked={row.isActive} />
    </div>
  </>;
}

function PortfolioFields({ row }: { row: PortfolioProject }) {
  return <>
    <Input label="Project title" name="title" value={row.title} maxLength={160} />
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="Client / project identity" name="clientName" value={row.clientName} maxLength={150} />
      <Input label="Industry" name="industry" value={row.industry} maxLength={100} />
    </div>
    <Textarea label="Summary" name="summary" value={row.summary} maxLength={1200} minLength={10} rows={3} />
    <Textarea label="Challenge" name="challenge" value={row.challenge} maxLength={6000} minLength={10} rows={3} />
    <Textarea label="Solution" name="solution" value={row.solution} maxLength={6000} minLength={10} rows={3} />
    <Textarea label="Results / benchmarks" name="results" value={row.results} maxLength={6000} minLength={10} rows={3} />
    <Textarea label="Tech stack (one per line)" name="techStack" value={row.techStack.join("\n")} maxLength={10000} rows={4} />
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="Live URL (optional)" name="liveUrl" value={row.liveUrl || ""} required={false} maxLength={500} type="url" />
      <Input label="GitHub URL (optional)" name="githubUrl" value={row.githubUrl || ""} required={false} maxLength={500} type="url" />
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className={fieldLabel}>Project type
        <select className={inputClass} name="projectType" defaultValue={row.projectType}>
          <option value="CONCEPT">Concept</option>
          <option value="INTERNAL_PROTOTYPE">Internal prototype</option>
          <option value="PRODUCTION">Production / verified client</option>
        </select>
      </label>
      <Input label="Display order" name="orderIndex" value={row.orderIndex} type="number" min={0} max={100000} />
    </div>
    <Check label="Featured on website" name="isFeatured" checked={row.isFeatured} />
  </>;
}

function FaqFields({ row }: { row: FAQ }) {
  return <>
    <Textarea label="Question" name="question" value={row.question} minLength={8} maxLength={500} rows={2} />
    <Textarea label="Answer" name="answer" value={row.answer} minLength={10} maxLength={5000} rows={5} />
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="Category" name="category" value={row.category} maxLength={40} />
      <Input label="Display order" name="orderIndex" value={row.orderIndex} type="number" min={0} max={100000} />
    </div>
    <Check label="Visible on website" name="isActive" checked={row.isActive} />
  </>;
}
