import { PortableText } from '@portabletext/react';
import { urlFor } from '../../lib/sanity';

interface Props {
	value: any;
}

function CodeBlock({ value }: any) {
	const language = value.language || 'text';
	const filename = value.filename;
	const code = value.code || '';
	return (
		<div className="my-6 rounded-xl overflow-hidden border border-white/5">
			<div className="flex items-center justify-between bg-white/5 px-4 py-2 border-b border-white/5">
				<span className="text-xs text-gray-400 font-mono">{filename || language}</span>
				<span className="text-xs text-gray-600 font-mono uppercase tracking-wider">{language}</span>
			</div>
			<pre className="bg-[#0f1623] p-5 overflow-x-auto m-0">
				<code className={`language-${language} text-sm text-gray-200 font-mono leading-relaxed`}>
					{code}
				</code>
			</pre>
		</div>
	);
}

const portableTextComponents = {
	types: {
		image: ({ value }: any) => {
			if (!value?.asset) return null;
			const src = urlFor(value).auto('format').fit('max').url();
			const alt = value.alt || '';
			const caption = value.caption;
			return (
				<figure className="my-8">
					<img
						src={src}
						alt={alt}
						className="rounded-xl w-full border border-white/5 shadow-xl shadow-black/40"
						loading="lazy"
					/>
					{caption && (
						<figcaption className="text-center text-sm text-gray-400 mt-3 font-mono">
							{caption}
						</figcaption>
					)}
				</figure>
			);
		},
		// handle both common Sanity code-input type names
		code: CodeBlock,
		codeBlock: CodeBlock,
	},
};

export function PortableTextRenderer({ value }: Props) {
	return <PortableText value={value} components={portableTextComponents} />;
}
