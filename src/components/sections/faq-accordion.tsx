"use client";

import * as React from "react";
import type { FAQ } from "@prisma/client";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface FaqAccordionProps {
  faqs: FAQ[];
}

export function FaqAccordion({ faqs }: FaqAccordionProps) {
  if (!faqs || faqs.length === 0) {
    return (
      <div className="rounded-xl border border-void-border/60 bg-void-surface/30 p-8 text-center">
        <p className="text-sm text-void-muted">
          Frequently asked questions are being updated. Please contact us directly for specific inquiries.
        </p>
      </div>
    );
  }

  return (
    <Accordion type="single" defaultValue={faqs[0]?.id} className="w-full space-y-3">
      {faqs.map((faq) => (
        <AccordionItem key={faq.id} value={faq.id}>
          <AccordionTrigger>
            <div className="flex items-center gap-3 text-left">
              <span className="font-medium text-void-white">{faq.question}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-void-muted leading-relaxed">{faq.answer}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
