import { Box, Cloud, Code2, Cpu, Database, Layers, Search, type LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SEOMeta } from '../components/SEOMeta';

interface Integration {
	id: string;
	name: string;
	category: 'CRM' | 'LLM' | 'Framework' | 'Deployment';
	description: string;
	icon: LucideIcon;
	link: string;
	featured?: boolean;
	statusNote: string;
}

const INTEGRATIONS: Integration[] = [
	// CRM
	{
		id: 'salesforce',
		name: 'Salesforce',
		category: 'CRM',
		description: 'Secure Einstein Bots and Email RAG pipelines.',
		icon: Cloud,
		link: 'https://docs.koreshield.com/docs/integrations/crm/salesforce/',
		featured: true,
		statusNote: 'Guide available'
	},
	{
		id: 'hubspot',
		name: 'HubSpot',
		category: 'CRM',
		description: 'Protect Chatflows and ticketing workflows.',
		icon: Database,
		link: 'https://docs.koreshield.com/docs/integrations/crm/hubspot/',
		featured: true,
		statusNote: 'Guide available'
	},

	// LLM Providers
	{
		id: 'openai',
		name: 'OpenAI',
		category: 'LLM',
		description: 'Proxy support for GPT-5, GPT-4o, and embeddings.',
		icon: Cpu,
		link: 'https://docs.koreshield.com/docs/integrations/models/openai/',
		featured: true,
		statusNote: 'Provider supported'
	},
	{
		id: 'anthropic',
		name: 'Anthropic',
		category: 'LLM',
		description: 'Secure Claude 4.5 Sonnet, Claude 4.5 Opus, and Claude 4.6 deployments.',
		icon: Box,
		link: 'https://docs.koreshield.com/docs/integrations/models/anthropic/',
		featured: true,
		statusNote: 'Provider supported'
	},
	{
		id: 'gemini',
		name: 'Google Gemini',
		category: 'LLM',
		description: 'Full support for Gemini Pro and Ultra models.',
		icon: Cpu,
		link: 'https://docs.koreshield.com/docs/integrations/models/gemini/',
		featured: true,
		statusNote: 'Provider supported'
	},
	{
		id: 'azure-openai',
		name: 'Azure OpenAI',
		category: 'LLM',
		description: 'Enterprise Azure OpenAI Service integration.',
		icon: Cloud,
		link: 'https://docs.koreshield.com/docs/integrations/models/azure-openai/',
		statusNote: 'Guide available'
	},

	// Frameworks
	{
		id: 'langchain',
		name: 'LangChain',
		category: 'Framework',
		description: 'Drop-in callbacks for chains and agents.',
		icon: Layers,
		link: 'https://docs.koreshield.com/docs/integrations/frameworks/langchain/',
		featured: true,
		statusNote: 'Guide available'
	},
	{
		id: 'llamaindex',
		name: 'LlamaIndex',
		category: 'Framework',
		description: 'Secure RAG query engines and retrievers.',
		icon: Database,
		link: 'https://docs.koreshield.com/docs/integrations/frameworks/llamaindex/',
		statusNote: 'Guide available'
	},
	{
		id: 'python',
		name: 'Python SDK',
		category: 'Framework',
		description: 'Async client for FastAPI/Django/Flask apps.',
		icon: Code2,
		link: 'https://github.com/koreshield/koreshield-python-sdk',
		statusNote: 'SDK repo live'
	},
	{
		id: 'javascript',
		name: 'JS/TS SDK',
		category: 'Framework',
		description: 'Client for Node.js, Next.js, and browser.',
		icon: Code2,
		link: 'https://github.com/koreshield/koreshield-js-sdk',
		statusNote: 'SDK repo live'
	},

	// Deployment
	{
		id: 'docker',
		name: 'Docker',
		category: 'Deployment',
		description: 'Official Docker images for quick self-hosted deployment.',
		icon: Box,
		link: 'https://docs.koreshield.com/docs/integrations/deployment/docker/',
		statusNote: 'Deployment guide'
	},
	{
		id: 'aws',
		name: 'AWS',
		category: 'Deployment',
		description: 'Deploy on ECS, EKS, or Lambda with one-click templates.',
		icon: Cloud,
		link: 'https://docs.koreshield.com/docs/integrations/deployment/aws/',
		statusNote: 'Deployment guide'
	},
];

const CATEGORIES = ['All', 'CRM', 'LLM', 'Framework', 'Deployment'];

function IntegrationsPage() {
	const [search, setSearch] = useState('');
	const [activeCategory, setActiveCategory] = useState('All');

	const filteredIntegrations = useMemo(() => {
		return INTEGRATIONS.filter(item => {
			const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
				item.description.toLowerCase().includes(search.toLowerCase());
			const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
			return matchesSearch && matchesCategory;
		});
	}, [search, activeCategory]);

	return (
		<div className="min-h-screen bg-background text-foreground pt-24 pb-20">
			<SEOMeta
				title="Integrations Catalog | KoreShield"
				description="Connect KoreShield with your favorite tools, CRMs, and LLM frameworks."
			/>

			<div className="max-w-7xl mx-auto px-6">
				<div className="text-center mb-16">
					{/* Badge */}
					<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-electric-green/20 bg-electric-green/5 mb-6">
						<span className="w-1.5 h-1.5 rounded-full bg-electric-green animate-pulse" />
						<span className="text-xs font-semibold text-electric-green tracking-wide uppercase">Integrations</span>
					</div>

					<h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
						Connect Your <span className="text-electric-green">Stack</span>
					</h1>
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
						Secure your AI infrastructure with the integrations, guides, and SDKs KoreShield supports today.
					</p>

					{/* Search & Filter */}
					<div className="flex flex-col md:flex-row gap-4 justify-center items-center max-w-3xl mx-auto">
						<div className="relative w-full md:w-96">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
							<input
								type="text"
								placeholder="Search integrations..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="w-full bg-card border border-border rounded-full py-3 pl-10 pr-6 focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-sm text-foreground placeholder:text-muted-foreground"
							/>
						</div>
						<div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
							{CATEGORIES.map(cat => (
								<button
									key={cat}
									type="button"
									onClick={() => setActiveCategory(cat)}
									className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat
										? 'bg-electric-green text-black'
										: 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-electric-green/40'
										}`}
								>
									{cat}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Grid */}
				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredIntegrations.map((item) => (
						<a
							key={item.id}
							href={item.link}
							target="_blank"
							rel="noreferrer noopener"
							className="bg-card border border-border rounded-xl p-6 hover:border-electric-green/50 hover:shadow-lg hover:shadow-electric-green/5 transition-all duration-300 group no-underline"
						>
							<div className="flex items-start justify-between mb-4">
								<div className="p-3 bg-background rounded-lg border border-border group-hover:bg-electric-green/10 group-hover:border-electric-green/20 transition-colors">
									<item.icon className="w-6 h-6 text-muted-foreground group-hover:text-electric-green transition-colors" />
								</div>
								{item.featured && (
									<span className="text-[10px] font-bold uppercase tracking-wider bg-electric-green/10 text-electric-green px-2 py-1 rounded-full">
										Popular
									</span>
								)}
							</div>
							<h3 className="text-lg font-bold mb-2 text-foreground">{item.name}</h3>
							<p className="text-muted-foreground text-sm mb-4 line-clamp-2">{item.description}</p>
							<div className="flex items-center justify-between gap-3">
								<div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest">
								{item.category}
								</div>
								<span className="text-[11px] font-medium text-electric-green">{item.statusNote}</span>
							</div>
						</a>
					))}
				</div>

				{filteredIntegrations.length === 0 && (
					<div className="text-center py-20 text-muted-foreground">
						<Database className="w-12 h-12 mx-auto mb-4 opacity-40" />
						<p className="mb-2">No integrations found matching your search.</p>
						<button
							type="button"
							onClick={() => { setSearch(''); setActiveCategory('All'); }}
							className="text-electric-green hover:underline text-sm"
						>
							Clear filters
						</button>
					</div>
				)}

				{/* Partial list note */}
				<div className="text-center mt-12 py-8 border-t border-border">
					<p className="text-muted-foreground text-sm">
						This catalog is checked against the current docs and SDK repos. View the broader integration library in our{' '}
						<a
							href="https://docs.koreshield.com/docs/integrations/"
							target="_blank"
							rel="noreferrer noopener"
							className="text-electric-green hover:underline"
						>
							documentation
						</a>.
					</p>
				</div>
			</div>
		</div>
	);
}

export default IntegrationsPage;
