"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export default function Page() {
  const [value, setValue] = useState("");

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
      <Input value={value} onChange={(e) => setValue(e.target.value)} />

      <Button
        disabled={invoke.isPaused}
        onClick={() => {
          invoke.mutate({ text: value });
        }}
      >
        Invoke a background job
      </Button>
    </div>
  );
}
