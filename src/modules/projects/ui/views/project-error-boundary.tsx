"use client";

import type { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { ProjectViewError } from "./project-view-error";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

interface Props {
  children: ReactNode;
}

export function ProjectErrorBoundary({ children }: Props) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <ProjectViewError
              error={error}
              resetErrorBoundary={resetErrorBoundary}
            />
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
