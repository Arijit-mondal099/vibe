"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export default function Page() {
  const [value, setValue] = useState("");

  const trpc = useTRPC();

  const { data: messages, isLoading } = useQuery(
    trpc.messages.getMany.queryOptions(),
  );

  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        toast.success("Background job started");
      },
    }),
  );

  return (
    <div>
      <Input value={value} onChange={(e) => setValue(e.target.value)} />

      <Button
        disabled={createMessage.isPaused}
        onClick={() => {
          createMessage.mutate({ prompt: value });
        }}
      >
        Code agent run in background
      </Button>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {messages?.map((m) => (
            <p key={m.id}>{JSON.stringify(m)}</p>
          ))}
        </div>
      )}
    </div>
  );
}
