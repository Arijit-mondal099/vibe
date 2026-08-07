import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-typescript";
import { useEffect } from "react";

import "./code-theme.css";

interface Props {
  code: string;
  lang: string;
}

export const CodeView: React.FC<Props> = ({ code, lang }) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [code]);
  return (
    <pre className="p-2 bg-transparent border-none m-0 text-xs">
      <code className={`language-${lang}`}>{code}</code>
    </pre>
  );
};
