"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
    <div className="flex items-center justify-center min-h-dvh w-full">
      <Card className="p-2 min-w-sm">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Build project"
        />

        <Button
          disabled={createProject.isPaused}
          onClick={() => {
            createProject.mutate({ prompt: value });
          }}
        >
          Code agent run in background
        </Button>
      </Card>
    </div>
  );
}
