import { useState, useMemo, useCallback, Fragment } from "react";
import { CopyCheckIcon, CopyIcon } from "lucide-react";

import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";
import { CodeView } from "@/components/code-view";
import { FilesTreeView } from "@/components/files-tree-view";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { Files } from "@/types";
import { convertIntoTree } from "@/lib/utils";

const getFileExtension = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension || "text";
};

interface Props {
  files: Files;
}

interface FileBreadcrumbProps {
  filePath: string;
}

const FileBreadcrumb: React.FC<FileBreadcrumbProps> = ({ filePath }) => {
  const pathSegments = filePath.split("/");
  const MAX_SEGMENTS = 4;

  const renderBreadcrumbItems = () => {
    if (pathSegments.length <= MAX_SEGMENTS) {
      // Show all segments if 4 or less
      return pathSegments.map((segment, index) => {
        const isLast = index === pathSegments.length - 1;

        return (
          <Fragment key={index}>
            <BreadcrumbItem>
              {isLast ? (
                <BreadcrumbPage className="font-medium">
                  {segment}
                </BreadcrumbPage>
              ) : (
                <span className="text-muted-foreground">{segment}</span>
              )}
            </BreadcrumbItem>
            {!isLast && <BreadcrumbSeparator />}
          </Fragment>
        );
      });
    } else {
      const firstSegment = pathSegments[0];
      const lastSegment = pathSegments[pathSegments.length - 1];

      return (
        <>
          <BreadcrumbItem>
            <span className="text-muted-foreground">{firstSegment}</span>
            <BreadcrumbSeparator />
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium">
              {lastSegment}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </>
      );
    }
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>{renderBreadcrumbItems()}</BreadcrumbList>
    </Breadcrumb>
  );
};

export const FileExplorer: React.FC<Props> = ({ files }) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(() => {
    const fileKyes = Object.keys(files);
    return fileKyes.length > 0 ? fileKyes[0] : null;
  });
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // convert files into tree structure
  const treeData = useMemo(() => convertIntoTree(files), [files]);

  const handleSelectFile = useCallback((filePath: string) => {
    if (filePath) {
      setSelectedFile(filePath);
    }
  }, []);

  const handleCopyFileContent = useCallback(() => {
    if (selectedFile) {
      navigator.clipboard.writeText(files[selectedFile]);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [files, selectedFile]);

  return (
    <ResizablePanelGroup orientation="horizontal">
      <ResizablePanel defaultSize="25%" minSize="15%" className="bg-sidebar">
        <FilesTreeView
          data={treeData}
          select={selectedFile}
          onSelect={handleSelectFile}
        />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize="75%" minSize="60%">
        {selectedFile && files[selectedFile] ? (
          <div className="h-full w-full flex flex-col">
            <div className="border-b bg-sidebar px-4 py-2 flex justify-between items-center gap-x-2">
              <FileBreadcrumb filePath={selectedFile} />

              <Hint text="Copy to clipboard">
                <Button
                  variant="outline"
                  size="icon"
                  className="ml-auto"
                  onClick={handleCopyFileContent}
                  disabled={isCopied}
                >
                  {isCopied ? <CopyCheckIcon /> : <CopyIcon />}
                </Button>
              </Hint>
            </div>

            <div className="flex-1 overflow-auto">
              <CodeView
                lang={getFileExtension(selectedFile)}
                code={files[selectedFile]}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>Select a file to view is&apos;s content</p>
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
