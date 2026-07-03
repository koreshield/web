import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const topics = [
	{
		path: '/solutions/ai-detection-response',
		title: 'Prompt injection detection',
		description: 'Detect, classify, block, and record malicious or unsafe LLM traffic.',
	},
	{
		path: '/solutions/ai-application-protection',
		title: 'AI application protection',
		description: 'Put runtime security between applications and model providers.',
	},
	{
		path: '/solutions/ai-agents-security',
		title: 'AI agent security',
		description: 'Control retrieved context, tool calls, and autonomous actions.',
	},
	{
		path: '/solutions/rag-security',
		title: 'RAG security',
		description: 'Stop indirect prompt injection hidden in retrieved documents.',
	},
	{
		path: '/solutions/ai-usage-control',
		title: 'AI usage control',
		description: 'Enforce scoped policies, limits, logging, and governance.',
	},
	{
		path: '/docs/integrations/deployment/self-hosted',
		title: 'Self-hosted AI security',
		description: 'Deploy Koreshield inside infrastructure you control.',
	},
];

export function RelatedSecurityTopics({ currentPath }: { currentPath: string }) {
	const related = topics.filter((topic) => topic.path !== currentPath).slice(0, 4);

	return (
		<section aria-labelledby="related-security-topics" className="border-t border-border px-4 py-16 sm:px-6 md:py-20">
			<div className="mx-auto max-w-7xl">
				<div className="mb-8 max-w-2xl">
					<p className="text-xs font-bold uppercase tracking-[0.2em] text-electric-green">Related controls</p>
					<h2 id="related-security-topics" className="mt-3 text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">
						Explore the rest of the AI security layer
					</h2>
				</div>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{related.map((topic) => (
						<Link
							key={topic.path}
							to={topic.path}
							className="group rounded-2xl border border-border bg-card/75 p-5 transition-colors hover:border-electric-green/35 hover:bg-muted/70"
						>
							<h3 className="font-bold text-foreground">{topic.title}</h3>
							<p className="mt-2 text-sm leading-relaxed text-muted-foreground">{topic.description}</p>
							<span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-electric-green">
								Learn more <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
							</span>
						</Link>
					))}
				</div>
			</div>
		</section>
	);
}
