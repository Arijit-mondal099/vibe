"use client";

import { Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";

interface Props {
  id: string;
}

export const DeleteVibe: React.FC<Props> = ({ id }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteProject = useMutation(
    trpc.projects.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  return (
    <Button
      variant="destructive"
      size="icon"
      disabled={deleteProject.isPending}
      onClick={() => deleteProject.mutate({ id })}
    >
      <Trash2 />
    </Button>
  );
};
