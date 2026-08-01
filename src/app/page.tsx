"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function Page() {
  const [value, setValue] = useState("");
  const router = useRouter();

  const trpc = useTRPC();

  const createProject = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: (data) => {
        router.push(`/projects/${data.id}`);
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  return (
    <div>
      <Input value={value} onChange={(e) => setValue(e.target.value)} />

      <Button
        disabled={createProject.isPaused}
        onClick={() => {
          createProject.mutate({ prompt: value });
        }}
      >
        Code agent run in background
      </Button>
    </div>
  );
}
