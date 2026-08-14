"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowUpIcon } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Usage } from "./usage";

const formSchema = z.object({
  prompt: z
    .string()
    .min(1, { error: "Prompt is required!" })
    .max(10000, { error: "Prompt is too long!" }),
});

type FormType = z.infer<typeof formSchema>;

interface MessageFormProps {
  projectId: string;
}

const getDraftKey = (userId: string, projectId: string) =>
  `vibe:message-prompt-draft:${userId}:${projectId}`;

const peekMessageDraft = (userId: string, projectId: string): string => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(getDraftKey(userId, projectId)) ?? "";
};

export const MessageForm: React.FC<MessageFormProps> = ({ projectId }) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const router = useRouter();

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { userId } = useAuth();
  // Tracks the authenticated identity across renders so draft cleanup can
  // react to sign-out / account switches.
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      prompt: userId ? peekMessageDraft(userId, projectId) : "",
    },
  });

  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        form.reset();
        queryClient.invalidateQueries(
          trpc.messages.getMany.queryOptions({ projectId }),
        );
        queryClient.invalidateQueries(trpc.usage.status.queryOptions());
      },
      onError: (err) => {
        toast.error(err.message);
        if (err.data?.code === "TOO_MANY_REQUESTS") {
          router.push("/pricing");
        }
      },
    }),
  );

  const onSubmit = async (data: FormType) => {
    await createMessage.mutateAsync({
      prompt: data.prompt,
      projectId,
    });
  };

  const { data: usage } = useQuery(trpc.usage.status.queryOptions());

  const isPending: boolean = createMessage.isPending;
  const prompt = useWatch({ control: form.control, name: "prompt" });
  const isDisable: boolean =
    isPending ||
    prompt.trim() === "" ||
    prompt.trim().length > 10000 ||
    !form.formState.isValid;
  const showUsage: boolean = !!usage;

  // Persist the in-progress draft on every change, so a reload or
  // closing the app doesn't lose it. Scoped per user + project so drafts
  // never cross authenticated accounts.
  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(getDraftKey(userId, projectId), prompt);
  }, [prompt, projectId, userId]);

  // At the authentication boundary (sign-out or account switch), drop the
  // previous user's drafts so they can't be resurrected by the next session.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prev = prevUserIdRef.current;
    if (prev && prev !== userId) {
      const prefix = `vibe:message-prompt-draft:${prev}:`;
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("vibe:message-prompt-draft:") && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }
    prevUserIdRef.current = userId;
  }, [userId]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {showUsage && usage && (
        <Usage
          points={usage?.remainingPoints}
          msBeforeNext={usage.msBeforeNext}
        />
      )}
      <FieldGroup
        className={cn(
          "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
          isFocused && "shadow-xs ring-2 ring-gray-200 dark:ring-gray-800",
          showUsage && "rounded-t-none",
        )}
      >
        <Field>
          <TextareaAutosize
            {...form.register("prompt")}
            disabled={isPending}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            minRows={2}
            maxRows={8}
            className="pt-4 resize-none border-none outline-none bg-transparent w-full"
            placeholder="What would you like to build"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                form.handleSubmit(onSubmit)(e);
              }
            }}
          />
        </Field>

        <div className="flex gap-x-2 items-end justify-between pt-2">
          <div className="text-xs text-muted-foreground font-mono">
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono font-medium text-[10px] text-muted-foreground">
              <span>&#8984;</span>Enter
            </kbd>
            &nbsp;to submit
          </div>

          {isPending ? (
            <Image
              src={"/logo.svg"}
              width={22}
              height={22}
              alt="vibe"
              className="shrink-0 animate-spin-scale"
            />
          ) : (
            <Button disabled={isDisable} className="size-8 rounded-full">
              <ArrowUpIcon />
            </Button>
          )}
        </div>
      </FieldGroup>
    </form>
  );
};
