"use client";

import Link from "next/link";
import { ChevronLeft, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  error: unknown;
  resetErrorBoundary: () => void;
}

export function ProjectViewError({ error, resetErrorBoundary }: Props) {
  const digest =
    error instanceof Error && "digest" in error
      ? (error as Error & { digest?: string }).digest
      : undefined;

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-6">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        {/* Signature illustration: a folder that's slipped out from behind its neighbor */}
        <div className="relative mb-8 h-20 w-24">
          <div
            className="absolute inset-0 rounded-xl border border-border bg-secondary"
            style={{ transform: "rotate(-8deg) translateX(-6px)" }}
          />
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl border border-border bg-card shadow-sm"
            style={{ transform: "rotate(5deg) translateX(4px)" }}
          >
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              className="text-primary"
            >
              <path
                d="M3 6.5C3 5.67 3.67 5 4.5 5h4.4c.34 0 .67.12.94.33l1.4 1.13c.27.21.6.33.94.33H19.5c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5h-15C3.67 19 3 18.33 3 17.5v-11Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M9.5 12.5l2 2 3.5-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0"
              />
            </svg>
          </div>
        </div>

        <h2
          className="text-xl text-foreground"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          This project won&apos;t open
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Something went wrong. Please try again.
        </p>

        <div className="mt-8 flex w-full items-center gap-2.5">
          <Button className="flex-1" onClick={resetErrorBoundary}>
            <RefreshCcw />
            Try again
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/">
              <ChevronLeft />
              Dashboard
            </Link>
          </Button>
        </div>

        {digest ? (
          <div className="mt-7 flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1">
            <span className="text-[11px] text-muted-foreground">Ref</span>
            <span className="font-mono text-[11px] text-secondary-foreground">
              {digest}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
