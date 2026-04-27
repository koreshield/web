import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
	language: string;
	code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		void navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const lang = language || 'text';

	return (
		<div className="relative group my-6">
			<div className="rounded-xl overflow-hidden border border-white/[0.08]">
				{/* Language badge */}
				<div className="flex items-center justify-between bg-[#1a1a1a] px-4 py-2 border-b border-white/[0.08]">
					<span className="text-xs font-mono text-gray-500 uppercase tracking-widest select-none">
						{lang === 'text' ? 'code' : lang}
					</span>
					<button
						onClick={handleCopy}
						className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-200 transition-colors rounded hover:bg-white/10"
						title="Copy code"
					>
						{copied ? (
							<><Check size={12} className="text-green-400" /><span className="text-green-400">Copied</span></>
						) : (
							<><Copy size={12} /><span>Copy</span></>
						)}
					</button>
				</div>

				<SyntaxHighlighter
					language={lang}
					style={vscDarkPlus}
					customStyle={{
						margin: 0,
						padding: '1.25rem 1rem',
						background: '#1e1e1e',
						fontSize: '0.875rem',
						lineHeight: '1.65',
						borderRadius: 0,
					}}
					codeTagProps={{
						style: {
							fontFamily: '"GeistMono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
						},
					}}
					wrapLongLines={false}
				>
					{code}
				</SyntaxHighlighter>
			</div>
		</div>
	);
}
