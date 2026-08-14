"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Sparkles, Plus, AlertTriangle } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

import { formatRelativeDate } from "@/lib/utils";
import { DeleteVibe } from "@/components/delete-vibe";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Deterministic gradient per project so each row reads as its own "vibe"
// instead of repeating the same static icon on every card.
const GRADIENTS = [
  "from-violet-500 via-fuchsia-500 to-orange-400",
  "from-sky-500 via-cyan-400 to-emerald-400",
  "from-rose-500 via-orange-400 to-amber-300",
  "from-indigo-500 via-purple-500 to-pink-500",
  "from-emerald-500 via-teal-400 to-sky-400",
];

function gradientFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export const VibeLists = () => {
  const trpc = useTRPC();
  const { user } = useUser();
  const {
    data: projects,
    isLoading,
    isError,
    error,
  } = useQuery(trpc.projects.getMany.queryOptions());

  if (!user) {
    return null;
  }

  return (
    <section className="w-full flex flex-col gap-y-6 sm:gap-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">My Vibes</h2>
        {!!projects?.length && (
          <span className="text-sm text-muted-foreground tabular-nums">
            {projects.length} {projects.length === 1 ? "vibe" : "vibes"}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-lg border p-4"
            >
              <Skeleton className="size-10 rounded-md shrink-0" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p>{error.message}</p>
        </div>
      )}

      {!isLoading && !isError && projects?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-14 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">No vibes yet</p>
            <p className="text-sm text-muted-foreground">
              Start a new project and it&apos;ll show up here.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="mt-1">
            <Link href="/">
              <Plus className="h-4 w-4" />
              New vibe
            </Link>
          </Button>
        </div>
      )}

      {!isLoading && !isError && !!projects?.length && (
        <div className="flex flex-col gap-2">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="group relative flex flex-row items-center justify-between gap-4 rounded-lg border p-3 transition-colors motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 hover:border-foreground/20 hover:bg-accent/40"
            >
              <Link
                href={`/projects/${project.id}`}
                className="flex min-w-0 flex-1 items-center gap-4"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-linear-to-br ${gradientFor(
                    project.id,
                  )} text-sm font-semibold text-white shadow-sm`}
                >
                  {project.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex min-w-0 flex-col">
                  <h3 className="truncate font-medium leading-tight">
                    {project.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formatRelativeDate(project.updatedAt)}
                  </p>
                </div>
              </Link>

              <div className="opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                <DeleteVibe id={project.id} name={project.name} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};
