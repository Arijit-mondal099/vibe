"use client";

import { FC, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface Props {
  id: string;
  name: string;
}

export const DeleteVibe: FC<Props> = ({ id, name }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const deleteProject = useMutation(
    trpc.projects.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.projects.getMany.queryKey(),
        });
        setOpen(false);
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  const isMatch = confirmText === name;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setConfirmText("");
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size="icon"
          aria-label={`Delete vibe: ${name}`}
        >
          <Trash2 />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete vibe</DialogTitle>
          <DialogDescription>
            This will permanently delete &quot;{name}&quot;. Type the vibe name
            to confirm.
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel htmlFor="confirm-name">Vibe name</FieldLabel>
          <Input
            id="confirm-name"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={name}
            autoComplete="off"
          />
        </Field>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!isMatch || deleteProject.isPending}
            onClick={() => deleteProject.mutate({ id })}
          >
            {deleteProject.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
