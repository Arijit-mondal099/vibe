"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  const handleRetry = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative flex w-full max-w-lg flex-col items-center text-center">
        {/* Signature illustration: a stack of cards, the top one cracked */}
        <div className="relative mb-10 h-28 w-28">
          <div
            aria-hidden
            className="absolute inset-x-3 bottom-0 h-20 -rotate-6 rounded-xl border border-border bg-secondary"
          />
          <div
            aria-hidden
            className="absolute inset-x-2 bottom-1 h-20 rotate-3 rounded-xl border border-border bg-muted"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-2 h-20 overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          >
            <svg
              viewBox="0 0 112 80"
              className="h-full w-full text-primary"
              fill="none"
            >
              <path
                d="M46 0L52 20L40 30L58 42L48 80"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.55"
              />
              <circle
                cx="58"
                cy="42"
                r="3"
                fill="currentColor"
                className="origin-center motion-safe:animate-pulse"
              />
            </svg>
          </div>
        </div>

        <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Something went wrong
        </span>

        <h1 className="mt-4 text-2xl font-medium sm:text-3xl">
          This page hit a snag
        </h1>
        <p className="mt-3 max-w-sm text-sm text-muted-foreground sm:text-base">
          The error&apos;s been logged automatically. Try reloading the page, or
          head back to your dashboard.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <Button onClick={handleRetry} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <RefreshCcw />}
            {isPending ? "Retrying…" : "Try again"}
          </Button>
        </div>
      </div>
    </main>
  );
}
