"use client";

import React, { Suspense, useState } from "react";
import { Fragment } from "@/generated/prisma/client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { MessagesContainer } from "../components/messages-container";
import { ProjectHeader } from "../components/project-header";
import { FragmentWeb } from "../components/fragment-web";

interface Props {
  projectId: string;
}

export const ProjectView: React.FC<Props> = ({ projectId }) => {
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);

  return (
    <div className="h-screen w-full">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel
          defaultSize="25%"
          minSize="15%"
          className="flex flex-col min-h-0"
        >
          <Suspense fallback={<p>Loading project...</p>}>
            <ProjectHeader projectId={projectId} />
          </Suspense>

          <Suspense fallback={<p>loading...</p>}>
            <MessagesContainer
              projectId={projectId}
              activeFragment={activeFragment}
              setActiveFragment={setActiveFragment}
            />
          </Suspense>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize="75%" minSize="60%">
          {!!activeFragment && (<FragmentWeb data={activeFragment} />)}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
