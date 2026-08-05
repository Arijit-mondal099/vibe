"use client";

import React, { Suspense } from "react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { MessagesContainer } from "../components/messages-container";

interface Props {
  projectId: string;
}

export const ProjectView: React.FC<Props> = ({ projectId }) => {
  return (
    <div className="h-screen w-full">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel
          defaultSize="25%"
          minSize="15%"
          className="flex flex-col min-h-0"
        >
          <Suspense fallback={<p>loading...</p>}>
            <MessagesContainer projectId={projectId} />
          </Suspense>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize="75%" minSize="60%">
          <h1>TODO: Review</h1>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
