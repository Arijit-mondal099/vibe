"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Code2Icon, CrownIcon, DownloadIcon, EyeIcon, Loader2 } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { zipSync } from "fflate";

import { Fragment } from "@/generated/prisma/client";
import { Files } from "@/types";
import { useTRPC } from "@/trpc/client";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  MessagesContainer,
  MessagesContainerSkeleton,
  MessagesContainerError,
} from "../components/messages-container";
import {
  ProjectHeader,
  ProjectHeaderSkeleton,
  ProjectHeaderError,
} from "../components/project-header";
import { FragmentWeb } from "../components/fragment-web";
import { FileExplorer } from "@/components/file-explorer";
import { UserControl } from "@/components/user-control";

interface Props {
  projectId: string;
}

export const ProjectView: React.FC<Props> = ({ projectId }) => {
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
  const [tabState, setTabState] = useState<"preview" | "code">("preview");
  const { has } = useAuth();
  const hasProAccess = has({ plan: "pro" });

  // The code-agent response is complete once the last assistant message has a
  // fragment — MessagesContainer sets `activeFragment` to that fragment, so its
  // presence is the signal the project is ready to export. Hide (not merely
  // disable) the Export button while the agent is still generating.
  const isReady = !!activeFragment;

  const trpc = useTRPC();
  const exportProject = useMutation(
    trpc.projects.getExport.mutationOptions({
      onSuccess: (data) => {
        if (data.mode === "url") {
          // Trigger a browser download via the signed URL WITHOUT fetch()/blob(),
          // which would fail CORS against the private B2 bucket. The signed URL
          // carries ResponseContentDisposition: attachment, so a navigation into a
          // hidden iframe downloads the ZIP while the user stays on the page.
          const iframe = document.createElement("iframe");
          iframe.style.display = "none";
          iframe.src = data.url;
          document.body.appendChild(iframe);
          setTimeout(() => iframe.remove(), 5000);
          return;
        }

        // DB fragment fallback: build the ZIP client-side from tracked files.
        const encoder = new TextEncoder();
        const zipInput: Record<string, Uint8Array> = {};
        for (const [path, content] of Object.entries(data.files)) {
          zipInput[path] = encoder.encode(content);
        }
        const blob = new Blob([zipSync(zipInput)], { type: "application/zip" });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${data.name ?? "project"}.zip`;
        a.click();
        URL.revokeObjectURL(downloadUrl);
      },
      onError: (err) => {
        const msg = err?.message ?? "";
        // tRPC surfaces HTTP/parse failures as "Failed to fetch"; map those to
        // an actionable message while echoing real server errors verbatim.
        const isNetworkError = /fetch|network|json/i.test(msg);
        toast.error(
          isNetworkError || !msg
            ? "Failed to export project. Please try again."
            : msg,
        );
      },
    }),
  );

  return (
    <div className="h-screen w-full">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel
          defaultSize="25%"
          minSize="15%"
          className="flex flex-col min-h-0"
        >
          <QueryErrorResetBoundary>
            {({ reset }) => (
              <ErrorBoundary
                onReset={reset}
                fallbackRender={({ resetErrorBoundary }) => (
                  <ProjectHeaderError retryAction={resetErrorBoundary} />
                )}
              >
                <Suspense fallback={<ProjectHeaderSkeleton />}>
                  <ProjectHeader projectId={projectId} />
                </Suspense>
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>

          <QueryErrorResetBoundary>
            {({ reset }) => (
              <ErrorBoundary
                onReset={reset}
                fallbackRender={({ resetErrorBoundary }) => (
                  <MessagesContainerError retryAction={resetErrorBoundary} />
                )}
              >
                <Suspense fallback={<MessagesContainerSkeleton />}>
                  <MessagesContainer
                    projectId={projectId}
                    activeFragment={activeFragment}
                    setActiveFragment={setActiveFragment}
                  />
                </Suspense>
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize="75%" minSize="60%">
          <Tabs
            className="h-full gap-y-0"
            defaultValue="preview"
            value={tabState}
            onValueChange={(value) => setTabState(value as "preview" | "code")}
          >
            <div className="w-full flex items-center p-2 border-b gap-x-2">
              <TabsList className="h-8 p-0 border rounded-md">
                <TabsTrigger value="preview" className="rounded-md">
                  <EyeIcon />
                  <span>Demo</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="rounded-md">
                  <Code2Icon />
                  <span>Code</span>
                </TabsTrigger>
              </TabsList>

              <div className="ml-auto flex items-center gap-x-2">
                {!hasProAccess && (
                  <Button asChild size="sm" variant="pricing">
                    <Link href="/pricing">
                      <CrownIcon /> Upgrade
                    </Link>
                  </Button>
                )}

                {isReady && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportProject.mutate({ id: projectId })}
                    disabled={exportProject.isPending}
                  >
                    {exportProject.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <DownloadIcon className="h-4 w-4" />
                    )}
                    {exportProject.isPending ? "Exporting…" : "Export"}
                  </Button>
                )}

                <UserControl />
              </div>
            </div>

            <TabsContent value="preview">
              {!!activeFragment && <FragmentWeb data={activeFragment} />}
            </TabsContent>
            <TabsContent value="code" className="min-h-0">
              {activeFragment && !!activeFragment.files && (
                <FileExplorer files={activeFragment.files as Files} />
              )}
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
