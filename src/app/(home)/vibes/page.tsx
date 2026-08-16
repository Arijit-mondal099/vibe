"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

import {
  VibeLists,
  VibesListSkeleton,
  VibesListError,
} from "@/components/vibe-lists";

export function Vibes() {
  return (
    <div className="min-h-dvh flex flex-col max-w-3xl mx-auto w-full">
      <div className="space-y-6 py-[16vh] 2xl:py-48">
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ErrorBoundary
              onReset={reset}
              fallbackRender={({ error, resetErrorBoundary }) => (
                <VibesListError
                  error={error}
                  retryAction={resetErrorBoundary}
                />
              )}
            >
              <Suspense fallback={<VibesListSkeleton />}>
                <VibeLists />
              </Suspense>
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>
      </div>
    </div>
  );
}

export default Vibes;
