"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  Sparkles,
  Plus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsInteger, parseAsStringEnum } from "nuqs";

import { useTRPC } from "@/trpc/client";
import { cn, formatRelativeDate } from "@/lib/utils";
import { DeleteVibe } from "@/components/delete-vibe";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Each project owns a deterministic gradient identity. GLOWS mirrors that
// same identity as a solid color, used for the ambient hover aura — so a
// card's "vibe" reads consistently whether it's flat or glowing.
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

// Auth gate: keeps the suspense query from ever firing (or suspending)
// for a logged-out / not-yet-loaded user.
export const VibeLists = () => {
  const { user } = useUser();

  if (!user) {
    return null;
  }

  return <VibeListsContent />;
};

// Pagination
function getPageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  const siblings = 1;
  const left = Math.max(2, current - siblings);
  const right = Math.min(total - 1, current + siblings);

  const pages: (number | "ellipsis")[] = [1];
  if (left > 2) pages.push("ellipsis");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push("ellipsis");
  if (total > 1) pages.push(total);

  return pages;
}

const VibeListsContent = () => {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit] = useQueryState("limit", parseAsInteger.withDefault(5));
  const [order, setOrder] = useQueryState(
    "order",
    parseAsStringEnum(["asc", "desc"]).withDefault("desc"),
  );

  const trpc = useTRPC();
  const { data, isPending, isFetching, isError, refetch } = useQuery(
    trpc.projects.getMany.queryOptions(
      { page, limit, order },
      { placeholderData: keepPreviousData },
    ),
  );

  // First-ever load (no data yet): mirror the old suspense skeleton.
  if (isPending && isFetching) {
    return <VibesListSkeleton />;
  }

  if (isError) {
    return <VibesListError retryAction={refetch} />;
  }

  if (!data) {
    return <VibesListSkeleton />;
  }

  const projects = data.items;

  const ORDER_OPTIONS = [
    { value: "desc", label: "Newest first" },
    { value: "asc", label: "Oldest first" },
  ] as const;

  return (
    <section className="w-full flex flex-col gap-y-6 sm:gap-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">My Vibes</h2>
        <div>
          <Select
            value={order}
            onValueChange={(value) => {
              setOrder(value as "asc" | "desc");
            }}
          >
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {ORDER_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="relative flex flex-col items-center gap-3 overflow-hidden rounded-lg border border-dashed py-14 text-center">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-32 rounded-full bg-linear-to-br from-violet-500/10 via-fuchsia-500/10 to-orange-400/10 blur-2xl" />
          </div>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="relative space-y-1">
            <p className="text-sm font-medium">Nothing here yet</p>
            <p className="text-sm text-muted-foreground">
              Start a project and it&apos;ll show up here.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="relative mt-1">
            <Link href="/">
              <Plus className="h-4 w-4" />
              New vibe
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col space-y-6">
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

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationLink
                  href="#"
                  aria-label="Go to previous page"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) setPage(page - 1);
                  }}
                  className={cn(
                    page <= 1 ? "pointer-events-none opacity-50" : "",
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                </PaginationLink>
              </PaginationItem>

              {getPageNumbers(page, data.totalPages).map((p, i) =>
                p === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={page === p}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(p);
                      }}
                      className="font-mono text-xs"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationLink
                  href="#"
                  aria-label="Go to next page"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < data.totalPages) {
                      setPage(page + 1);
                    }
                  }}
                  className={
                    page >= data.totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </section>
  );
};

// Skeleton mirrors VibeListsContent's shape (header + rows) so there's no
// layout jump between the fallback and the loaded content.
export function VibesListSkeleton() {
  return (
    <section className="w-full flex flex-col gap-y-6 sm:gap-y-4">
      <div className="flex items-baseline justify-between">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg border p-3"
          >
            <Skeleton className="size-10 rounded-md shrink-0" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function VibesListError({ retryAction }: { retryAction: () => void }) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 py-14 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-5 w-5 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Couldn&apos;t load your vibes</p>
        <p className="text-sm text-muted-foreground">
          Something went wrong. Please try again.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="mt-1"
        onClick={retryAction}
      >
        Try again
      </Button>
    </section>
  );
}
