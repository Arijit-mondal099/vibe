import React from "react";

import Image from "next/image";
import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  AlertTriangle,
  ChevronsUpDown,
  ChevronLeft,
  Monitor,
  MoonIcon,
  SunIcon,
  SunMoonIcon,
  RefreshCcwIcon,
} from "lucide-react";

import { useTRPC } from "@/trpc/client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  projectId: string;
}

export const ProjectHeader: React.FC<Props> = ({ projectId }) => {
  const trpc = useTRPC();
  const { setTheme, theme } = useTheme();
  const { data: project } = useSuspenseQuery(
    trpc.projects.getOne.queryOptions({ id: projectId }),
  );

  return (
    <header className="px-2 py-2.5 border-b flex justify-between items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="focus-visible:ring-0 hover:bg-transparent hover:opacity-75 transition-opacity pl-2!"
          >
            <Image
              src="/logo.svg"
              alt="vibe"
              width={22}
              height={22}
              className="shrink-0"
            />
            <span className="text-base font-medium">{project?.name}</span>
            <ChevronsUpDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="start">
          <DropdownMenuItem asChild>
            <Link href="/">
              <ChevronLeft />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/vibes">
              <ChevronLeft />
              <span>Vibes</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <SunMoonIcon className="size-4 text-muted-foreground" />
              <span>Appearance</span>
            </DropdownMenuSubTrigger>

            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuRadioItem value="light">
                    <SunIcon />
                    <span>Light</span>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    <MoonIcon />
                    <span>Dark</span>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">
                    <Monitor />
                    <span>System</span>
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export function ProjectHeaderSkeleton() {
  return (
    <header className="px-2 py-3.25 border-b flex items-center">
      <div className="flex items-center gap-2 pl-2">
        <Skeleton className="size-5.5 rounded-sm" />
        <Skeleton className="h-5 w-32" />
      </div>
    </header>
  );
}

export function ProjectHeaderError({
  error,
  retryAction,
}: {
  error: unknown;
  retryAction: () => void;
}) {
  const message =
    error instanceof Error ? error.message : "Something went wrong.";

  return (
    <header className="px-3 py-2.5 border-b flex items-center justify-between gap-2 bg-destructive/5">
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="size-4 shrink-0 text-destructive" />
        <span className="text-sm text-destructive truncate">{message}</span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0"
        onClick={retryAction}
      >
        <RefreshCcwIcon />
        Try again
      </Button>
    </header>
  );
}
