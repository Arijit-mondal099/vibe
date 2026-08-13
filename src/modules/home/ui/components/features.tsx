"use client";

import { Card } from "@/components/ui/card";
import { Bot, Workflow, ShieldCheck, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FeaturesProps {
  heading?: string;
  description?: string;
  features?: Feature[];
}

const defaultFeatures: Feature[] = [
  {
    icon: Bot,
    title: "Autonomous agents",
    description:
      "Deploy agents that plan, act, and adapt on their own — no manual babysitting required.",
  },
  {
    icon: Workflow,
    title: "Visual workflows",
    description:
      "Chain tools, prompts, and data sources into workflows you can see and edit in minutes.",
  },
  {
    icon: ShieldCheck,
    title: "Built-in guardrails",
    description:
      "Set permissions and limits so agents stay inside the boundaries you define.",
  },
  {
    icon: Zap,
    title: "Fast by default",
    description:
      "Optimized execution paths keep response times low, even under heavy load.",
  },
];

export function Features({
  heading = "Everything you need to build with AI",
  description = "A focused set of tools that get out of your way and let you ship.",
  features = defaultFeatures,
}: FeaturesProps) {
  return (
    <section className="pb-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-12 max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-semibold tracking-tight">{heading}</h2>
          <p className="mt-3 text-muted-foreground">{description}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Card
                key={i}
                className="border-border/60 p-6 shadow-none transition-colors hover:border-border"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-medium">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
