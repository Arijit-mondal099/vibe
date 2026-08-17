"use client";

import React, { useEffect, useRef } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle, RefreshCcwIcon } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { Fragment } from "@/generated/prisma/client";

import { MessageCard } from "./message-card";
import { MessageForm } from "./message-form";
import { MessageLoading } from "./message-loading";
import Image from "next/image";
import { Hint } from "@/components/hint";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface Props {
  projectId: string;
  activeFragment: Fragment | null;
  setActiveFragment: (fragment: Fragment | null) => void;
}

export const MessagesContainer: React.FC<Props> = ({
  projectId,
  activeFragment,
  setActiveFragment,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastAssiMsgIdRef = useRef<string | null>(null);

  const trpc = useTRPC();
  const { data: messages } = useSuspenseQuery(
    trpc.messages.getMany.queryOptions(
      { projectId },
      {
        refetchInterval: (query) => {
          const data = query.state.data;
          const lastMessage = data?.[data.length - 1];
          return lastMessage?.role === "USER" ? 2000 : false;
        },
      },
    ),
  );

  /**
   * Set last assistant message fragment
   * also user can change the message fragment
   */
  useEffect(() => {
    const lastAssiMsg = messages.findLast((msg) => msg.role === "ASSISTANT");

    if (lastAssiMsg?.fragment && lastAssiMsg.id !== lastAssiMsgIdRef.current) {
      setActiveFragment(lastAssiMsg.fragment);
      lastAssiMsgIdRef.current = lastAssiMsg.id;
    }
  }, [messages, setActiveFragment]);

  /**
   * Use effect to scroll last message
   */
  useEffect(() => {
    scrollRef.current?.scrollIntoView();
  }, [messages.length]);

  const lastMessage = messages[messages.length - 1];
  const isLastMessageUser = lastMessage?.role === "USER";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto pb-48">
        <div className="pt-2 pr-1">
          {messages.map((msg) => (
            <MessageCard
              key={msg.id}
              content={msg.content}
              role={msg.role}
              fragment={msg.fragment}
              createdAt={msg.createdAt}
              isActiveFragment={activeFragment?.id === msg.fragment?.id}
              onFragmentClick={() => setActiveFragment(msg.fragment)}
              type={msg.type}
            />
          ))}
        </div>

        {isLastMessageUser && <MessageLoading />}
        {!isLastMessageUser && (
          <Hint text="Hi, I'm Vibe. How can I help you today?" side="right">
            <Image
              src={"/logo.svg"}
              width={32}
              height={32}
              alt="vibe"
              className="shrink-0 ml-4"
            />
          </Hint>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="relative p-3 pt-1">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-linear-to-b from-transparent to-background pointer-events-none" />
        <MessageForm projectId={projectId} />
      </div>
    </div>
  );
};

export function MessagesContainerSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto pb-48">
        <div className="flex flex-col gap-6 px-4 pt-6">
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-5 w-28" />
          </div>
        </div>
      </div>
      <div className="relative p-3 pt-1">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-linear-to-b from-transparent to-background pointer-events-none" />
        <Skeleton className="h-26 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function MessagesContainerError({
  retryAction,
}: {
  retryAction: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <AlertTriangle className="size-6 text-destructive" />
      <div className="space-y-1">
        <p className="text-sm font-medium">Couldn&apos;t load messages</p>
        <p className="text-sm text-muted-foreground">
          Something went wrong. Please try again.
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={retryAction}>
        <RefreshCcwIcon />
        Try again
      </Button>
    </div>
  );
}
