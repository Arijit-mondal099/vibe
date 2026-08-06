import { useEffect, useState } from "react";
import Image from "next/image";

const ShimmerMessages = () => {
  const [currentMessageIdx, setCurrentMessageIdx] = useState<number>(0);

  const messages: string[] = [
    "Thinking...",
    "Generating response...",
    "AI is thinking...",
    "Crafting your answer...",
    "Processing your request...",
    "Analyzing your prompt...",
    "Working on it...",
    "One moment...",
    "Preparing your response...",
    "Fetching information...",
    "Building your app...",
    "Sandbox is warming up...",
    "AI agent is coding...",
    "Installing dependencies...",
    "Setting up the environment...",
    "Designing components...",
    "Wiring up the database...",
    "Crafting your UI...",
    "Configuring shadcn components...",
    "Almost ready to launch...",
    "Running your custom Next.js app...",
    "Preparing the live preview...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIdx((prev) => (prev + 1) % messages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground animate-pulse">
        {messages[currentMessageIdx]}
      </span>
    </div>
  );
};

export const MessageLoading = () => {
  return (
    <div className="flex flex-col group px-2 pb-4 mb-40">
      <div className="flex items-center gap-2 pl-2 mb-2">
        <Image
          src={"/logo.svg"}
          width={22}
          height={22}
          alt="vibe"
          className="shrink-0 animate-spin-scale"
        />

        <ShimmerMessages />
      </div>
    </div>
  );
};
