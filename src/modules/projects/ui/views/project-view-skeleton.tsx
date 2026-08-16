import { Skeleton } from "@/components/ui/skeleton";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Code2Icon, EyeIcon } from "lucide-react";

export function ProjectViewSkeleton() {
  return (
    <div className="h-screen w-full">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel
          defaultSize="25%"
          minSize="15%"
          className="flex flex-col min-h-0"
        >
          <header className="px-2 py-2.5 border-b flex items-center">
            <div className="flex items-center gap-2 pl-2">
              <Skeleton className="size-5.5 rounded-sm" />
              <Skeleton className="h-4 w-32" />
            </div>
          </header>

          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto pb-48">
              <div className="flex flex-col gap-6 px-4 pt-6">
                <div className="flex flex-col items-end gap-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
            <div className="relative p-3 pt-1">
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize="75%" minSize="60%">
          <div className="h-full gap-y-0 flex flex-col">
            <div className="w-full flex items-center p-2 border-b gap-x-2">
              <div className="h-8 p-0 border rounded-md flex items-center gap-1 px-1">
                <div className="h-6 px-3 rounded-sm flex items-center gap-1.5 text-muted-foreground/40">
                  <EyeIcon className="size-3.5" />
                </div>
                <div className="h-6 px-3 rounded-sm flex items-center gap-1.5 text-muted-foreground/40">
                  <Code2Icon className="size-3.5" />
                </div>
              </div>
              <div className="ml-auto flex items-center gap-x-2">
                <Skeleton className="size-8 rounded-full" />
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
