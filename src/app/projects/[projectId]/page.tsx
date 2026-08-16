import { Suspense } from "react";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { ProjectView } from "@/modules/projects/ui/views/project-view";
import { ProjectViewSkeleton } from "@/modules/projects/ui/views/project-view-skeleton";
import { ProjectErrorBoundary } from "@/modules/projects/ui/views/project-error-boundary";

interface Props {
  params: Promise<{ projectId: string }>;
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
