"use client";

import Link from "next/link";
import Image from "next/image";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

export const ProjectLists = () => {
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

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (isError) {
    return <p>{error.message}</p>;
  }

  return (
    <section className="w-full bg-white dark:bg-sidebar p-8 border flex flex-col gap-y-6 sm:gap-y-4 rounded-sm">
      <h2 className="text-2xl font-semibold">{user?.fullName}&apos;s Vibes</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {projects?.length == 0 && (
          <div className="col-span-full text-center">
            <p className="text-sm text-muted-foreground">
              Oops no vibes found!
            </p>
          </div>
        )}

        {projects?.map((project) => (
          <Button
            key={project.id}
            variant="outline"
            className="font-normal h-auto justify-start w-full text-start p-4"
            asChild
          >
            <Link href={`/projects/${project.id}`}>
              <div className="flex items-center gap-x-4">
                <Image
                  src="/logo.svg"
                  alt="Vibe"
                  height={32}
                  width={32}
                  className="object-contain"
                />

                <div className="flex flex-col">
                  <h3 className="truncate font-medium">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatRelativeDate(project.updatedAt)}
                  </p>
                </div>
              </div>
            </Link>
          </Button>
        ))}
      </div>
    </section>
  );
};
