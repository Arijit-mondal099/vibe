import React from "react";
import { Fragment, MessageType } from "@/generated/prisma/client";
import { MessageRole } from "@/generated/prisma/enums";
import Image from "next/image";

import { cn, formatRelativeDate } from "@/lib/utils";

import { Card } from "@/components/ui/card";
import { ChevronRightIcon, Code2Icon } from "lucide-react";

/**
 * User message component
 */
interface UserMessageProps {
  content: string;
  createdAt: Date;
}

const UserMessage: React.FC<UserMessageProps> = ({ content, createdAt }) => {
  return (
    <div className="flex justify-end pb-4 pr-2 pl-10 group">
      <div className="flex max-w-[80%] flex-col items-end gap-1">
        <Card className="rounded-2xl rounded-br-sm bg-muted px-4 py-2.5 shadow-nome border-none">
          <p className="text-[15px] leading-relaxed wrap-break-word">
            {content}
          </p>
        </Card>
        <span className="px-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          {formatRelativeDate(createdAt)}
        </span>
      </div>
    </div>
  );
};

/**
 * Fragment card component
 */
interface FragmentCardProps {
  fragment: Fragment;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
}

const FragmentCard: React.FC<FragmentCardProps> = ({
  fragment,
  isActiveFragment,
  onFragmentClick,
}) => {
  return (
    <button
      className={cn(
        "flex items-start text-start gap-2 border rounded-lg bg-muted w-fit p-3 hover:bg-secondary transition-colors",
        isActiveFragment &&
          "bg-primary text-primary-foreground border-primary hover:bg-primary",
      )}
      onClick={() => onFragmentClick(fragment)}
    >
      <Code2Icon className="size-4 mt-0.5" />
      <div className="flex flex-col flex-1">
        <span className="text-sm font-medium line-clamp-1">
          {fragment.title}
        </span>
        <span className="text-sm">Preview</span>
      </div>
      <div className="flex items-center justify-center mt-0.5">
        <ChevronRightIcon className="size-4" />
      </div>
    </button>
  );
};

/**
 * Assistant message component
 */
interface AssistaintMessageProps {
  content: string;
  fragment: Fragment | null;
  createdAt: Date;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  type: MessageType;
}

const AssistaintMessage: React.FC<AssistaintMessageProps> = ({
  content,
  createdAt,
  fragment,
  isActiveFragment,
  onFragmentClick,
  type,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col group px-2 pb-4",
        type === "ERROR" && "text-red-700 dark:text-red-500",
      )}
    >
      <div className="flex items-center gap-2 pl-2 mb-2">
        <Image
          src={"/logo.svg"}
          width={22}
          height={22}
          alt="vibe"
          className="shrink-0"
        />
        <span className="text-sm font-medium">Vibe</span>
      </div>

      <div className="pl-8 flex flex-col gap-y-4">
        <span>{content}</span>
        {/* render fragment */}
        {fragment && type === "RESULT" && (
          <FragmentCard
            fragment={fragment}
            isActiveFragment={isActiveFragment}
            onFragmentClick={onFragmentClick}
          />
        )}

        <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          {formatRelativeDate(createdAt)}
        </span>
      </div>
    </div>
  );
};

interface Props {
  content: string;
  role: MessageRole;
  fragment: Fragment | null;
  createdAt: Date;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  type: MessageType;
}

export const MessageCard: React.FC<Props> = ({
  content,
  role,
  fragment,
  createdAt,
  isActiveFragment,
  onFragmentClick,
  type,
}) => {
  if (role === "ASSISTANT") {
    return (
      <AssistaintMessage
        content={content}
        fragment={fragment}
        type={type}
        isActiveFragment={isActiveFragment}
        onFragmentClick={onFragmentClick}
        createdAt={createdAt}
      />
    );
  }

  return <UserMessage content={content} createdAt={createdAt} />;
};
