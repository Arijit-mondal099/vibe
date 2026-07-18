"use client";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export default function Page() {
  const trpc = useTRPC();
  const invoke = useMutation(
    trpc.invoke.mutationOptions({
      onSuccess: () => {
        toast.success("Background job started");
      },
    }),
  );

  return (
    <div>
      <Button
        disabled={invoke.isPaused}
        onClick={() => {
          invoke.mutate({ text: "test" });
        }}
      >
        Invoke a background job
      </Button>
    </div>
  );
}
