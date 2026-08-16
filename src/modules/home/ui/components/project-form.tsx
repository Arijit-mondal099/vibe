"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import TextareaAutosize from "react-textarea-autosize";
import { ArrowUpIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";

import { PROJECT_TEMPLATES } from "@/modules/home/constants";

const formSchema = z.object({
  prompt: z
    .string()
    .min(1, { error: "Prompt is required!" })
    .max(10000, { error: "Prompt is too long!" }),
});

type FormType = z.infer<typeof formSchema>;

// Key for the prompt draft handed off to /sign-in so an unauthenticated
// submit doesn't lose the user's request when this component unmounts.
// The draft is intentionally ephemeral: it must not persist long enough
// to leak from one account to another sharing the same browser.
const PROMPT_DRAFT_KEY = "vibe:project-prompt-draft";
const PROMPT_DRAFT_TTL_MS = 5 * 60 * 1000;

interface PromptDraft {
  value: string;
  expiresAt: number;
}

const readPromptDraft = (): string => {
  if (typeof window === "undefined") return "";
  const raw = localStorage.getItem(PROMPT_DRAFT_KEY);
  if (!raw) return "";
  try {
    const draft: PromptDraft = JSON.parse(raw);
    if (typeof draft?.value !== "string") return "";
    if (draft.expiresAt <= Date.now()) {
      localStorage.removeItem(PROMPT_DRAFT_KEY);
      return "";
    }
    return draft.value;
  } catch {
    return "";
  }
};

const writePromptDraft = (prompt: string) => {
  if (typeof window === "undefined") return;
  const draft: PromptDraft = {
    value: prompt,
    expiresAt: Date.now() + PROMPT_DRAFT_TTL_MS,
  };
  localStorage.setItem(PROMPT_DRAFT_KEY, JSON.stringify(draft));
};

export const ProjectForm = () => {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const router = useRouter();

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      prompt: readPromptDraft(),
    },
  });

  const createProject = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
        queryClient.invalidateQueries(trpc.usage.status.queryOptions());
        localStorage.removeItem(PROMPT_DRAFT_KEY);
        router.push(`/projects/${data.id}`);
      },
      onError: (err, variables) => {
        toast.error(err.message);
        if (err.data?.code === "UNAUTHORIZED") {
          writePromptDraft(variables.prompt);
          router.push("/sign-in");
        }
        if (err?.data?.code === "TOO_MANY_REQUESTS") {
          writePromptDraft(variables.prompt);
          router.push("/pricing");
        }
      },
    }),
  );

  const onSubmit = async (data: FormType) => {
    await createProject.mutateAsync({
      prompt: data.prompt,
    });
  };

  const onSelect = (prompt: string): void => {
    form.setValue("prompt", prompt, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });
  };

  const isPending: boolean = createProject.isPending;
  const prompt = useWatch({ control: form.control, name: "prompt" });
  const isDisable: boolean =
    isPending ||
    prompt.trim() === "" ||
    prompt.trim().length > 10000 ||
    !form.formState.isValid;

  useEffect(() => {
    // Clear a stale draft when the user erases the prompt; otherwise the
    // old value would be restored from localStorage on remount.
    if (!prompt.trim()) {
      localStorage.removeItem(PROMPT_DRAFT_KEY);
      return;
    }
    writePromptDraft(prompt);
  }, [prompt]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup
        className={cn(
          "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
          isFocused && "shadow-xs ring-2 ring-gray-200 dark:ring-gray-800",
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

      <div className="flex-wrap justify-center gap-2 hidden md:flex max-w-3xl">
        {PROJECT_TEMPLATES.map((pt) => (
          <Button
            key={pt.title}
            variant="outline"
            className="bg-white dark:bg-sidebar"
            onClick={() => onSelect(pt.prompt)}
          >
            {pt.emoji} {pt.title}
          </Button>
        ))}
      </div>
    </form>
  );
};
