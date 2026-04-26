import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getDocByPath } from '../docs/loader';

export function DocPage() {
	const location = useLocation();
	const navigate = useNavigate();

	// Extract section and doc from URL path
	const pathParts = location.pathname
		.replace(/^\/docs\/?/, '')
		.split('/')
		.filter(Boolean);

	const section = pathParts[0] || '';
	const doc = pathParts[1] || '';

	const docContent = getDocByPath(section, doc);

	if (!docContent) {
		return (
			<div className="prose prose-invert max-w-none">
				<div className="mb-8">
					<button
						onClick={() => navigate(-1)}
						className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to Documentation
					</button>
				</div>
				<div className="text-center py-12">
					<h1 className="text-4xl font-bold text-red-500 mb-4">Page Not Found</h1>
					<p className="text-gray-400">Documentation page not found.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="prose prose-invert max-w-none">
			<div className="mb-8">
				<button
					onClick={() => navigate(-1)}
					className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors"
				>
					<ArrowLeft className="w-4 h-4" />
					Back to Documentation
				</button>
			</div>

			{/* Render markdown-like content */}
			<article className="space-y-6">
				<div>
					<h1 className="text-4xl font-bold mb-4">{docContent.title}</h1>
					<p className="text-xl text-gray-400">{docContent.description}</p>
				</div>

				{/* Simple markdown renderer */}
				<div className="space-y-4 text-gray-300">
					{docContent.content.split('\n\n').map((paragraph, idx) => {
						if (paragraph.startsWith('# ')) {
							return (
								<h1 key={idx} className="text-3xl font-bold mt-8 mb-4">
									{paragraph.slice(2).trim()}
								</h1>
							);
						}
						if (paragraph.startsWith('## ')) {
							return (
								<h2 key={idx} className="text-2xl font-bold mt-6 mb-3">
									{paragraph.slice(3).trim()}
								</h2>
							);
						}
						if (paragraph.startsWith('### ')) {
							return (
								<h3 key={idx} className="text-xl font-bold mt-4 mb-2">
									{paragraph.slice(4).trim()}
								</h3>
							);
						}
						if (paragraph.startsWith('```')) {
							const lines = paragraph.split('\n');
							const lang = lines[0].slice(3);
							const code = lines.slice(1, -1).join('\n');
							return (
								<pre key={idx} className="bg-gray-900 p-4 rounded overflow-x-auto">
									<code className={`language-${lang || 'bash'} text-sm`}>{code}</code>
								</pre>
							);
						}
						if (paragraph.startsWith('- ')) {
							return (
								<ul key={idx} className="list-disc list-inside space-y-1">
									{paragraph.split('\n').map((item, i) => (
										<li key={i}>{item.slice(2).trim()}</li>
									))}
								</ul>
							);
						}
						return (
							<p key={idx} className="leading-relaxed">
								{paragraph}
							</p>
						);
					})}
				</div>
			</article>

			<div className="mt-12">
				<button
					onClick={() => navigate(-1)}
					className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors"
				>
					<ArrowLeft className="w-4 h-4" />
					Back to Documentation
				</button>
			</div>
		</div>
	);
}
