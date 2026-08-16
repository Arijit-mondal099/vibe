"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Code2Icon, CrownIcon, EyeIcon } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

import { Fragment } from "@/generated/prisma/client";
import { Files } from "@/types";

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
                fallbackRender={({ error, resetErrorBoundary }) => (
                  <ProjectHeaderError
                    error={error}
                    retryAction={resetErrorBoundary}
                  />
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
                fallbackRender={({ error, resetErrorBoundary }) => (
                  <MessagesContainerError
                    error={error}
                    retryAction={resetErrorBoundary}
                  />
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
