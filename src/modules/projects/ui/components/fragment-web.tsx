import { useState } from "react";

import { Fragment } from "@/generated/prisma/client";
import { ExternalLinkIcon, RefreshCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";

interface Props {
  data: Fragment;
}

export const FragmentWeb: React.FC<Props> = ({ data }) => {
  const [fragmentKey, setFragmentKey] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const handleRefresh = () => {
    setFragmentKey((prev) => prev + 1);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(data.sandBoxUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="p-2 border-b bg-sidebar flex items-center gap-x-2">
        <Hint text="Refresh" side="bottom" align="start">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCcwIcon />
          </Button>
        </Hint>

        <Hint text="Click to copy">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!data.sandBoxUrl || copied}
            className="flex-1 justify-start text-start font-normal"
          >
            <span className="truncate">{data.sandBoxUrl}</span>
          </Button>
        </Hint>

        <Hint text="Open in a new tab" side="bottom" align="start">
          <Button
            variant="outline"
            size="sm"
            disabled={!data.sandBoxUrl}
            onClick={() => {
              if (!data.sandBoxUrl) return;
              window.open(data.sandBoxUrl, "_blank");
            }}
          >
            <ExternalLinkIcon />
          </Button>
        </Hint>
      </div>

      <iframe
        key={fragmentKey}
        className="w-full h-full"
        sandbox="allow-forms allow-scripts allow-same-origin"
        loading="lazy"
        src={data.sandBoxUrl}
      />
    </div>
  );
};
