import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  children: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
}

export function CodeBlock({
  children,
  language = 'typescript',
  filename,
  showLineNumbers = false,
  highlightLines = [],
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = children.split('\n');

  return (
    <div className="my-6 rounded-lg overflow-hidden border border-border bg-muted/30">
      {(filename || language) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2">
            {filename && (
              <span className="text-sm font-mono text-foreground">{filename}</span>
            )}
            {language && !filename && (
              <span className="text-xs font-mono text-muted-foreground uppercase">
                {language}
              </span>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      )}
      <div className="relative">
        <pre className="p-4 overflow-x-auto">
          <code className={`language-${language} text-sm`}>
            {showLineNumbers ? (
              <table className="w-full border-collapse">
                <tbody>
                  {lines.map((line, index) => (
                    <tr
                      key={index}
                      className={
                        highlightLines.includes(index + 1)
                          ? 'bg-yellow-500/10'
                          : ''
                      }
                    >
                      <td className="pr-4 text-right text-muted-foreground select-none w-8">
                        {index + 1}
                      </td>
                      <td>{line}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              children
            )}
          </code>
        </pre>
        {!filename && !language && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-2 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted/50"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
