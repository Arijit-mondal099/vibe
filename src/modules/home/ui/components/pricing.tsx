"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  /** Destination for link-based CTAs (e.g. "/sign-up", mailto:) */
  href?: string;
  /** Callback for button-based CTAs when no destination applies */
  onAction?: () => void;
}

interface PricingProps {
  heading?: string;
  description?: string;
  tiers?: PricingTier[];
}

const defaultTiers: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    period: "Always free",
    description: "For getting started",
    features: [
      "5 monthly credits",
      "Public vibes",
      "Community support",
      "Basic templates",
    ],
    cta: "Get started",
    href: "/sign-up",
  },
  {
    name: "Pro",
    price: "$30",
    period: "/mo",
    description: "For more vibes and usage — Yearly available: $25/mo",
    features: [
      "100 credits monthly",
      "Public vibes",
      "Private vibes",
      "Priority support",
      "Advanced analytics",
      "Custom workflows",
      "Early access",
      "Higher credit limits",
    ],
    cta: "Get Pro",
    highlighted: true,
    href: "/pricing",
  },
];

export function Pricing({
  heading = "Simple, transparent pricing",
  description = "Pick a plan that fits. Upgrade or cancel anytime.",
  tiers = defaultTiers,
}: PricingProps) {
  return (
    <section className="relative overflow-hidden py-24">
      {/* ambient background accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, hsl(var(--primary) / 0.08), transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-14 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {heading}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-balance text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 sm:items-stretch">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative rounded-[1.75rem]",
                tier.highlighted &&
                  "bg-linear-to-b from-primary/60 via-primary/20 to-transparent p-px shadow-[0_0_0_1px_hsl(var(--primary)/0.15),0_20px_50px_-20px_hsl(var(--primary)/0.35)]",
              )}
            >
              <Card
                className={cn(
                  "relative flex h-full flex-col overflow-hidden rounded-[1.75rem] p-8 shadow-sm transition-shadow",
                  tier.highlighted
                    ? "border-0 bg-card"
                    : "border-border/60 bg-card/60 hover:shadow-md",
                )}
              >
                {tier.highlighted && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
                  />
                )}

                {tier.highlighted && (
                  <Badge className="absolute right-6 top-6 gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide shadow-sm">
                    <Sparkles className="h-3 w-3" />
                    Most popular
                  </Badge>
                )}

                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {tier.name}
                </h3>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-5xl font-semibold tabular-nums tracking-tight">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-sm font-medium text-muted-foreground">
                      {tier.period}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {tier.description}
                </p>

                <div className="my-6 h-px w-full bg-border/60" />

                <ul className="flex-1 space-y-3.5">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                          tier.highlighted
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild={!!tier.href}
                  onClick={tier.href ? undefined : tier.onAction}
                  size="lg"
                  className={cn(
                    "mt-8 w-full rounded-xl text-sm font-medium",
                    tier.highlighted &&
                      "shadow-[0_8px_20px_-6px_hsl(var(--primary)/0.5)]",
                  )}
                  variant={tier.highlighted ? "default" : "outline"}
                >
                  {!!tier.href ? (
                    <Link href={tier.href}>{tier.cta}</Link>
                  ) : (
                    tier.cta
                  )}
                </Button>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
