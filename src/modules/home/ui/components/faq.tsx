"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqProps {
  heading?: string;
  description?: string;
  items?: FaqItem[];
}

const defaultItems: FaqItem[] = [
  {
    question: "What is Vibe?",
    answer:
      "Vibe is an agentic AI platform that lets you build and deploy autonomous agents for your workflows.",
  },
  {
    question: "How do I get started?",
    answer:
      "Sign up for an account, create a workspace, and connect your first agent in under five minutes.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes, the free plan covers basic usage with limited monthly requests. Paid plans unlock higher limits and priority support.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, you can cancel your subscription at any time from your billing settings with no cancellation fee.",
  },
];

export function Faq({
  heading = "Frequently asked questions",
  description = "Everything you need to know. Can't find the answer you're looking for? Reach out to our team.",
  items = defaultItems,
}: FaqProps) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">{heading}</h2>
          <p className="mt-3 text-muted-foreground">{description}</p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {items.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
