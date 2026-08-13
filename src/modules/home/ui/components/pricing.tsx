"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
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
    period: "/mo",
    description: "For trying things out.",
    features: ["1 agent", "100 requests/mo", "Community support"],
    cta: "Get started",
    href: "/sign-up",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For individuals shipping real products.",
    features: [
      "10 agents",
      "10,000 requests/mo",
      "Priority support",
      "Custom workflows",
    ],
    cta: "Start free trial",
    highlighted: true,
    href: "/sign-up",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For teams that need scale and control.",
    features: [
      "Unlimited agents",
      "Unlimited requests",
      "Dedicated support",
      "SSO & audit logs",
    ],
    cta: "Contact sales",
    href: "mailto:hello@vibe.app",
  },
];

export function Pricing({
  heading = "Simple, transparent pricing",
  description = "Pick a plan that fits. Upgrade or cancel anytime.",
  tiers = defaultTiers,
}: PricingProps) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">{heading}</h2>
          <p className="mt-3 text-muted-foreground">{description}</p>
        </div>

        <div className="grid gap-6 pt-3 sm:grid-cols-3">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={cn(
                "relative flex flex-col overflow-visible p-6 pt-8 shadow-none",
                tier.highlighted
                  ? "border-primary/50 bg-primary/3 sm:-my-3 sm:py-9"
                  : "border-border/60",
              )}
            >
              {tier.highlighted && (
                <Badge className="absolute -top-3 left-6 z-10">
                  Most popular
                </Badge>
              )}

              <h3 className="font-medium">{tier.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {tier.description}
              </p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight">
                  {tier.price}
                </span>
                {tier.period && (
                  <span className="text-sm text-muted-foreground">
                    {tier.period}
                  </span>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild={!!tier.href}
                onClick={tier.href ? undefined : tier.onAction}
                className="mt-8 w-full"
                variant={tier.highlighted ? "default" : "outline"}
              >
                {tier.href ? (
                  <Link href={tier.href}>{tier.cta}</Link>
                ) : (
                  tier.cta
                )}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
