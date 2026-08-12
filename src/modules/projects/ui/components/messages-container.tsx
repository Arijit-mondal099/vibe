"use client";

import React, { useEffect, useRef } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { Fragment } from "@/generated/prisma/client";

import { MessageCard } from "./message-card";
import { MessageForm } from "./message-form";
import { MessageLoading } from "./message-loading";

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
        // TODO: tem live message update
        refetchInterval: 5000,
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
      <div className="flex-1 min-h-0 overflow-y-auto">
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
        <div ref={scrollRef} />
      </div>

      <div className="relative p-3 pt-1">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-linear-to-b from-transparent to-background pointer-events-none" />
        <MessageForm projectId={projectId} />
      </div>
    </div>
  );
};
