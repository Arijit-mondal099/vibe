"use client";

import React, { useEffect, useRef } from "react";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

import { MessageCard } from "./message-card";
import { MessageForm } from "./message-form";

interface Props {
  projectId: string;
}

export const MessagesContainer: React.FC<Props> = ({ projectId }) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const trpc = useTRPC();
  const { data: messages } = useSuspenseQuery(
    trpc.messages.getMany.queryOptions({ projectId }),
  );

  useEffect(() => {
    const lastAssistantMessage = messages.findLast(
      (msg) => msg.role === "ASSISTANT",
    );

    if (lastAssistantMessage) {
    }
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView();
  }, [messages.length]);

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
              isActiveFragment={false}
              onFragmentClick={() => {}}
              type={msg.type}
            />
          ))}
        </div>

        <div ref={scrollRef} />
      </div>

      <div className="relative p-3 pt-1">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-linear-to-b from-transparent to-background pointer-events-none" />
        <MessageForm projectId={projectId} />
      </div>
    </div>
  );
};
