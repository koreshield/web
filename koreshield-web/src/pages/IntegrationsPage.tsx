import { useState, useMemo } from 'react';
import { Search, Database, Cloud, Box, Globe, Cpu, Layers, Terminal, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

interface Integration {
	id: string;
	name: string;
	category: 'CRM' | 'LLM' | 'Framework' | 'Deployment';
	description: string;
	icon: any;
	link: string;
	featured?: boolean;
}

const INTEGRATIONS: Integration[] = [
	// CRM
	{
		id: 'salesforce',
		name: 'Salesforce',
		category: 'CRM',
		description: 'Secure Einstein Bots and Email RAG pipelines.',
		icon: Cloud,
		link: 'https://docs.koreshield.com/integrations/salesforce',
		featured: true
	},
	{
		id: 'hubspot',
		name: 'HubSpot',
		category: 'CRM',
		description: 'Protect Chatflows and ticketing workflows.',
		icon: Database,
		link: 'https://docs.koreshield.com/integrations/hubspot',
		featured: true
	},
	{
		id: 'zendesk',
		name: 'Zendesk',
		category: 'CRM',
		description: 'Guard Answer Bot and help center articles.',
		icon: Globe,
		link: 'https://docs.koreshield.com/integrations/zendesk'
	},

	// LLM Providers
	{
		id: 'openai',
		name: 'OpenAI',
		category: 'LLM',
		description: 'Proxy support for GPT-3.5, GPT-4, and embeddings.',
		icon: Cpu,
		link: 'https://docs.koreshield.com/reference/protocols'
	},
	{
		id: 'anthropic',
		name: 'Anthropic',
		category: 'LLM',
		description: 'Secure Claude 2 and Claude 3 deployments.',
		icon: Box,
		link: 'https://docs.koreshield.com/reference/protocols'
	},
	{
		id: 'deepseek',
		name: 'DeepSeek',
		category: 'LLM',
		description: 'Optimized support for DeepSeek Coder and Chat.',
		icon: Terminal,
		link: 'https://docs.koreshield.com/reference/protocols'
	},

	// Frameworks
	{
		id: 'langchain',
		name: 'LangChain',
		category: 'Framework',
		description: 'Drop-in callbacks for chains and agents.',
		icon: Layers,
		link: 'https://docs.koreshield.com/integrations/langchain',
		featured: true
	},
	{
		id: 'llamaindex',
		name: 'LlamaIndex',
		category: 'Framework',
		description: 'Secure RAG query engines and retrievers.',
		icon: Database,
		link: 'https://docs.koreshield.com/integrations/llamaindex'
	},
	{
		id: 'python',
		name: 'Python SDK',
		category: 'Framework',
		description: 'Async client for FastAPI/Django/Flask apps.',
		icon: Code2,
		link: 'https://docs.koreshield.com/reference/python-sdk'
	},
	{
		id: 'javascript',
		name: 'JS/TS SDK',
		category: 'Framework',
		description: 'Client for Node.js, Next.js, and browser.',
		icon: Code2,
		link: 'https://docs.koreshield.com/reference/javascript-sdk'
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
		<div className="min-h-screen bg-black text-white pt-24 pb-20">
			<SEOMeta
				title="Integrations Catalog | KoreShield"
				description="Connect KoreShield with your favorite tools, CRMs, and LLM frameworks."
			/>

			<div className="max-w-7xl mx-auto px-6">
				<div className="text-center mb-16">
					<h1 className="text-4xl md:text-6xl font-bold mb-6">
						Connect Your <span className="text-electric-green">Stack</span>
					</h1>
					<p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
						Secure your AI infrastructure with drop-in integrations for major providers, frameworks, and enterprise platforms.
					</p>

					{/* Search & Filter */}
					<div className="flex flex-col md:flex-row gap-4 justify-center items-center max-w-3xl mx-auto">
						<div className="relative w-full md:w-96">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
							<input
								type="text"
								placeholder="Search integrations..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="w-full bg-slate-900 border border-slate-800 rounded-full py-3 pl-10 pr-6 focus:outline-none focus:border-electric-green transition-colors text-sm"
							/>
						</div>
						<div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
							{CATEGORIES.map(cat => (
								<button
									key={cat}
									onClick={() => setActiveCategory(cat)}
									className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat
										? 'bg-electric-green text-black'
										: 'bg-slate-900 text-gray-400 hover:text-white hover:bg-slate-800'
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
						<Link
							key={item.id}
							to={item.link}
							className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-electric-green transition-all duration-300 group no-underline"
						>
							<div className="flex items-start justify-between mb-4">
								<div className="p-3 bg-slate-950 rounded-lg group-hover:bg-electric-green/10 transition-colors">
									<item.icon className="w-6 h-6 text-gray-400 group-hover:text-electric-green transition-colors" />
								</div>
								{item.featured && (
									<span className="text-[10px] font-bold uppercase tracking-wider bg-electric-green/10 text-electric-green px-2 py-1 rounded-full">
										Popular
									</span>
								)}
							</div>
							<h3 className="text-xl font-bold mb-2 text-white">{item.name}</h3>
							<p className="text-gray-400 text-sm mb-4 line-clamp-2">{item.description}</p>
							<div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-widest">
								{item.category}
							</div>
						</Link>
					))}
				</div>

				{filteredIntegrations.length === 0 && (
					<div className="text-center py-20 text-gray-500">
						<Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
						<p>No integrations found matching your search.</p>
						<button
							onClick={() => { setSearch(''); setActiveCategory('All'); }}
							className="text-electric-green hover:underline mt-2 text-sm"
						>
							Clear filters
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

export default IntegrationsPage; // Default export for lazy loading compatibility
