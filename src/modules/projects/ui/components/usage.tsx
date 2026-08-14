"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { CrownIcon } from "lucide-react";

import { formatTimeUntil } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props {
  points: number;
  msBeforeNext: number;
}

export const Usage: React.FC<Props> = ({ points, msBeforeNext }) => {
  const { has } = useAuth();
  const hasProAccess = has({ plan: "pro" });

  return (
    <div className="bg-background rounded-t-xl border border-b-0 p-2">
      <div className="flex items-center justify-between gap-x-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium shimmer">
            {points} {hasProAccess ? "" : "free"} credits remaining
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            Resets in {formatTimeUntil(msBeforeNext)}
          </p>
        </div>

        {!hasProAccess && (
          <Button variant="pricing" size="sm" asChild>
            <Link href="/pricing">
              <CrownIcon data-icon="inline-start" />
              Upgrade
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};
