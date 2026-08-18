import { Suspense } from "react";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { db } from "@/lib/db";

import { ProjectView } from "@/modules/projects/ui/views/project-view";
import { ProjectViewSkeleton } from "@/modules/projects/ui/views/project-view-skeleton";
import { ProjectErrorBoundary } from "@/modules/projects/ui/views/project-error-boundary";

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  const { userId } = await auth();

  const project = userId
    ? await db.project.findUnique({
        where: { id: projectId, userId },
        select: { name: true },
      })
    : null;

  return {
    title: project?.name ? project.name : "Project",
  };
}

const Page: React.FC<Props> = async ({ params }) => {
  const { projectId } = await params;
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(
    trpc.messages.getMany.queryOptions({ projectId }),
  );
  void queryClient.prefetchQuery(
    trpc.projects.getOne.queryOptions({ id: projectId }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectErrorBoundary>
        <Suspense fallback={<ProjectViewSkeleton />}>
          <ProjectView projectId={projectId} />
        </Suspense>
      </ProjectErrorBoundary>
    </HydrationBoundary>
  );
};

export default Page;
