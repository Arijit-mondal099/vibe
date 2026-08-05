import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowUpIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import Image from "next/image";

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

export const MessageForm: React.FC<MessageFormProps> = ({ projectId }) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const showUsage: boolean = false;

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        form.reset();
        queryClient.invalidateQueries(
          trpc.messages.getMany.queryOptions({ projectId }),
        );
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  const onSubmit = async (data: FormType) => {
    await createMessage.mutateAsync({
      prompt: data.prompt,
      projectId,
    });
  };

  const isPending: boolean = createMessage.isPending;
  const isDisable: boolean = createMessage.isPending || form.formState.isValid;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup
        className={cn(
          "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
          isFocused && "shadow-xs ring-2 ring-gray-200",
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
              width={24}
              height={24}
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
