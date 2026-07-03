import { Box, Cable, Cloud, Code2, Database, Layers, Search, ServerCog, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

interface Integration {
	id: string;
	name: string;
	category: 'CRM' | 'LLM' | 'Framework' | 'Deployment' | 'Infrastructure';
	description: string;
	icon: LucideIcon;
	logo?: string;
	logoTone?: string;
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
		link: '/docs/integrations/crm/salesforce',
		featured: true,
		statusNote: 'Guide available'
	},
	{
		id: 'hubspot',
		name: 'HubSpot',
		category: 'CRM',
		description: 'Protect Chatflows and ticketing workflows.',
		icon: Database,
		link: '/docs/integrations/crm/hubspot',
		featured: true,
		statusNote: 'Guide available'
	},

	// LLM Providers
	{
		id: 'openai',
		name: 'OpenAI',
		category: 'LLM',
		description: 'Proxy support for GPT-5, GPT-4o, and embeddings.',
		icon: Cable,
		logoTone: 'bg-foreground text-background',
		link: '/docs/integrations/models/openai',
		featured: true,
		statusNote: 'Provider supported'
	},
	{
		id: 'anthropic',
		name: 'Anthropic',
		category: 'LLM',
		description: 'Secure Claude 4.5 Sonnet, Claude 4.5 Opus, and Claude 4.6 deployments.',
		icon: Box,
		logoTone: 'bg-[#d97757] text-white',
		link: '/docs/integrations/models/anthropic',
		featured: true,
		statusNote: 'Provider supported'
	},
	{
		id: 'gemini',
		name: 'Google Gemini',
		category: 'LLM',
		description: 'Full support for Gemini Pro and Ultra models.',
		icon: Cable,
		logoTone: 'bg-gradient-to-br from-blue-500 via-violet-500 to-emerald-400 text-white',
		link: '/docs/integrations/models/gemini',
		featured: true,
		statusNote: 'Provider supported'
	},
	{
		id: 'azure-openai',
		name: 'Azure OpenAI',
		category: 'LLM',
		description: 'Enterprise Azure OpenAI Service integration.',
		icon: Cloud,
		logoTone: 'bg-[#0078d4] text-white',
		link: '/docs/integrations/models/azure-openai',
		statusNote: 'Guide available'
	},

	// Frameworks
	{
		id: 'langchain',
		name: 'LangChain',
		category: 'Framework',
		description: 'Drop-in callbacks for chains and agents.',
		icon: Layers,
		logoTone: 'bg-[#1c3c3c] text-white',
		link: '/docs/integrations/frameworks/langchain',
		featured: true,
		statusNote: 'Guide available'
	},
	{
		id: 'llamaindex',
		name: 'LlamaIndex',
		category: 'Framework',
		description: 'Secure RAG query engines and retrievers.',
		icon: Database,
		logoTone: 'bg-[#3b82f6] text-white',
		link: '/docs/integrations/frameworks/llamaindex',
		statusNote: 'Guide available'
	},
	{
		id: 'python',
		name: 'Python SDK',
		category: 'Framework',
		description: 'Async client for FastAPI/Django/Flask apps.',
		icon: Code2,
		logoTone: 'bg-[#3776ab] text-[#ffd43b]',
		link: 'https://github.com/koreshield/python-sdk',
		statusNote: 'SDK repo live'
	},
	{
		id: 'javascript',
		name: 'JS/TS SDK',
		category: 'Framework',
		description: 'Client for Node.js, Next.js, and browser.',
		icon: Code2,
		logoTone: 'bg-[#f7df1e] text-black',
		link: 'https://github.com/koreshield/node-sdk',
		statusNote: 'SDK repo live'
	},

	// Deployment
	{
		id: 'docker',
		name: 'Docker',
		category: 'Deployment',
		description: 'Official Docker images for quick self-hosted deployment.',
		icon: Box,
		logoTone: 'bg-[#2496ed] text-white',
		link: '/docs/integrations/deployment/docker',
		statusNote: 'Deployment guide'
	},
	{
		id: 'aws',
		name: 'AWS',
		category: 'Deployment',
		description: 'Deploy on ECS, EKS, or Lambda with one-click templates.',
		icon: Cloud,
		logo: '/logos/ecosystem/powered-by-aws-white.png',
		link: '/docs/integrations/deployment/aws',
		statusNote: 'Deployment guide'
	},
	{
		id: 'nvidia',
		name: 'NVIDIA',
		category: 'Infrastructure',
		description: 'Run protected AI workloads around NVIDIA-accelerated infrastructure.',
		icon: ServerCog,
		logo: '/logos/ecosystem/nvidia-logo.png',
		link: '/docs/integrations/deployment/gpu-infrastructure',
		statusNote: 'Ecosystem signal'
	},
	{
		id: 'nebius',
		name: 'Nebius',
		category: 'Infrastructure',
		description: 'Deploy Koreshield beside GPU-backed inference and agent workloads.',
		icon: Cloud,
		logo: '/logos/ecosystem/nebius-outline-white.svg',
		link: '/docs/integrations/deployment/gpu-infrastructure',
		statusNote: 'Deployment path'
	},
];

const LOGO_STRIP = [
	{ name: 'OpenAI', initials: 'AI', tone: 'bg-foreground text-background' },
	{ name: 'Anthropic', initials: 'A', tone: 'bg-[#d97757] text-white' },
	{ name: 'Gemini', initials: 'G', tone: 'bg-gradient-to-br from-blue-500 via-violet-500 to-emerald-400 text-white' },
	{ name: 'LangChain', initials: 'LC', tone: 'bg-[#1c3c3c] text-white' },
	{ name: 'AWS', logo: '/logos/ecosystem/powered-by-aws-white.png' },
	{ name: 'NVIDIA', logo: '/logos/ecosystem/nvidia-logo.png' },
	{ name: 'Nebius', logo: '/logos/ecosystem/nebius-outline-white.svg' },
];

const CATEGORIES = ['All', 'CRM', 'LLM', 'Framework', 'Deployment', 'Infrastructure'];

function isExternalLink(link: string) {
	return /^https?:\/\//.test(link);
}

function BrandLogo({ item }: { item: Pick<Integration, 'name' | 'logo' | 'logoTone'> }) {
	if (item.logo) {
		return (
			<div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/70 p-2.5 shadow-inner">
				<img src={item.logo} alt={`${item.name} logo`} className="max-h-7 max-w-8 object-contain" />
			</div>
		);
	}

	const initials = item.name
		.replace('Google ', '')
		.replace('Azure ', '')
		.split(/\s|\//)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0])
		.join('');

	return (
		<div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-black tracking-[-0.04em] shadow-inner ${item.logoTone || 'bg-muted text-foreground'}`}>
			{initials}
		</div>
	);
}

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
				title="Integrations"
				description="Connect Koreshield with your favorite tools, CRMs, and LLM frameworks."
			/>

			<div className="max-w-7xl mx-auto px-6">
				<div className="relative mb-14 overflow-hidden rounded-[2rem] border border-border bg-card/70 p-6 text-center shadow-[0_30px_120px_rgba(0,0,0,0.16)] md:p-10">
					<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(18,194,150,0.16),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_28%)]" />
					<div className="relative">
					<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-electric-green/20 bg-electric-green/5 mb-6">
						<span className="w-1.5 h-1.5 rounded-full bg-electric-green" />
						<span className="text-xs font-semibold text-electric-green tracking-wide uppercase">Integrations</span>
					</div>

					<h1 className="text-4xl md:text-6xl font-black tracking-[-0.06em] mb-5 text-foreground">
						Works with the stack already in production.
					</h1>
					<p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-8 leading-8">
						Route model calls, RAG pipelines, SDK traffic, and deployment workflows through Koreshield without asking teams to rebuild their AI stack.
					</p>

					<div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
						{LOGO_STRIP.map((brand) => (
							<div key={brand.name} className="flex min-h-24 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-background/55 p-4">
								{'logo' in brand && brand.logo ? (
									<img src={brand.logo} alt={`${brand.name} logo`} className="max-h-8 max-w-20 object-contain" />
								) : (
									<div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black ${brand.tone}`}>{brand.initials}</div>
								)}
								<span className="text-xs font-semibold text-muted-foreground">{brand.name}</span>
							</div>
						))}
					</div>

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
				</div>

				{/* Grid */}
				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredIntegrations.map((item) => {
						const cardContent = (
							<>
								<div className="flex items-start justify-between mb-5">
									<div className="flex items-center gap-3">
										<BrandLogo item={item} />
										<div className="rounded-full border border-border bg-background/70 p-2">
											<item.icon className="w-4 h-4 text-muted-foreground group-hover:text-electric-green transition-colors" />
										</div>
									</div>
									{item.featured && (
										<span className="text-[10px] font-bold uppercase tracking-wider bg-electric-green/10 text-electric-green px-2 py-1 rounded-full">
											Popular
										</span>
									)}
								</div>
								<h3 className="text-xl font-black tracking-[-0.04em] mb-2 text-foreground">{item.name}</h3>
								<p className="text-muted-foreground text-sm mb-4 line-clamp-2">{item.description}</p>
								<div className="flex items-center justify-between gap-3">
									<div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest">
										{item.category}
									</div>
									<span className="text-[11px] font-medium text-electric-green">{item.statusNote}</span>
								</div>
							</>
						);

						if (isExternalLink(item.link)) {
							return (
								<a
									key={item.id}
									href={item.link}
									target="_blank"
									rel="noreferrer noopener"
									className="bg-card border border-border rounded-2xl p-6 hover:border-electric-green/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-electric-green/5 transition-all duration-300 group no-underline"
								>
									{cardContent}
								</a>
							);
						}

						return (
							<Link
								key={item.id}
								to={item.link}
								className="bg-card border border-border rounded-2xl p-6 hover:border-electric-green/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-electric-green/5 transition-all duration-300 group no-underline"
							>
								{cardContent}
							</Link>
						);
					})}
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
				<div className="text-center mt-12 rounded-2xl border border-border bg-card/60 px-5 py-6">
					<ShieldCheck className="mx-auto mb-3 h-5 w-5 text-electric-green" />
					<p className="text-muted-foreground text-sm">
						This catalog is checked against the current docs and SDK repos. View the broader integration library in our{' '}
						<Link to="/docs/integrations" className="text-electric-green hover:underline">
							documentation
						</Link>.
					</p>
				</div>
			</div>
		</div>
	);
}

export default IntegrationsPage;
