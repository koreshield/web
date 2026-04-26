import { useState, useRef, useEffect } from 'react';
import { Check, Copy } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

// Import common languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';

interface CodeBlockProps {
    children: any;
    className?: string;
}

export function CodeBlock({ children, className }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const codeRef = useRef<HTMLElement>(null);
    const language = className?.replace(/language-/, '') || 'text';

    useEffect(() => {
        if (codeRef.current) {
            Prism.highlightElement(codeRef.current);
        }
    }, [children, className]);

    const onCopy = () => {
        if (codeRef.current) {
            navigator.clipboard.writeText(codeRef.current.textContent || '');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="relative group rounded-lg overflow-hidden my-6 border border-slate-800 bg-[#1e1e1e]">
            {/* Header / Language Badge */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-slate-800">
                <span className="text-xs font-mono text-gray-400 lowercase">{language}</span>
                <button
                    onClick={onCopy}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                    aria-label="Copy code"
                >
                    {copied ? (
                        <>
                            <Check className="w-3.5 h-3.5 text-electric-green" />
                            <span>Copied</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>

            {/* Code Content */}
            <div className="p-4 overflow-x-auto">
                <pre className={`!bg-transparent !m-0 !p-0 ${className || ''}`}>
                    <code ref={codeRef} className={className || 'language-text'}>
                        {children}
                    </code>
                </pre>
            </div>
        </div>
    );
}

// MDX Wrapper to handle the pre > code structure
export function Pre({ children }: { children: any }) {
    // If children is a code element, pass props down
    if (children?.props?.mdxType === 'code' || children?.type === 'code') {
        return (
            <CodeBlock className={children.props.className}>
                {children.props.children}
            </CodeBlock>
        );
    }
    // Fallback for non-code pre blocks
    return <pre>{children}</pre>;
}
