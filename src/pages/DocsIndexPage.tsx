import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Code, Zap, Shield, Database } from 'lucide-react';

export function DocsIndexPage() {
	const navigate = useNavigate();

	const sections = [
		{
			icon: BookOpen,
			title: 'Getting Started',
			description: 'Learn the basics and get KoreShield up and running',
			links: [
				{ label: 'Quick Start', path: '/docs/getting-started/quick-start' },
				{ label: 'Installation', path: '/docs/getting-started/installation' },
			],
		},
		{
			icon: Code,
			title: 'Client Integration',
			description: 'Integrate KoreShield into your applications',
			links: [
				{ label: 'Integration Guide', path: '/docs/client-integration' },
				{ label: 'SDKs & REST API', path: '/docs/client-integration' },
			],
		},
		{
			icon: Zap,
			title: 'API Reference',
			description: 'Explore all endpoints and API documentation',
			links: [
				{ label: 'REST API', path: '/docs/api/rest-api' },
				{ label: 'WebSocket', path: '/docs/api/websocket' },
			],
		},
		{
			icon: Shield,
			title: 'Features & Security',
			description: 'Understand KoreShield capabilities and security features',
			links: [
				{ label: 'Attack Detection', path: '/docs/features/attack-detection' },
				{ label: 'Security', path: '/docs/features/security' },
				{ label: 'RAG Defense', path: '/docs/features/rag-defense' },
			],
		},
		{
			icon: Database,
			title: 'Configuration',
			description: 'Configure policies, settings, and production deployment',
			links: [
				{ label: 'Settings & Policies', path: '/docs/configuration/settings' },
				{ label: 'Production Checklist', path: '/docs/configuration/production-checklist' },
			],
		},
	];

	return (
		<div className="space-y-12">
			{/* Hero Section */}
			<section className="text-center space-y-4 mb-12">
				<h1 className="text-4xl md:text-5xl font-bold text-foreground">Documentation</h1>
				<p className="text-xl text-foreground/70 max-w-2xl mx-auto">
					Learn how to integrate and use KoreShield to protect your LLM applications from prompt injection and security threats.
				</p>
			</section>

			{/* Quick Links Grid */}
			<section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{sections.map((section, idx) => {
					const Icon = section.icon;
					return (
						<div key={idx} className="group border border-border/30 rounded-lg p-6 hover:border-primary/50 transition-all hover:bg-card/50">
							<div className="flex items-start gap-3 mb-4">
								<Icon size={24} className="text-primary mt-1 flex-shrink-0" />
								<div>
									<h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
									<p className="text-sm text-foreground/60 mt-1">{section.description}</p>
								</div>
							</div>

							<nav className="space-y-2 mt-4">
								{section.links.map((link, linkIdx) => (
									<button
										key={linkIdx}
										onClick={() => navigate(link.path)}
										className="w-full text-left flex items-center gap-2 text-sm text-foreground/70 hover:text-primary transition-colors group/link"
									>
										<span className="flex-1">{link.label}</span>
										<ArrowRight size={16} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
									</button>
								))}
							</nav>
						</div>
					);
				})}
			</section>

			{/* Featured Topics */}
			<section className="space-y-4">
				<h2 className="text-2xl font-bold text-foreground">Popular Topics</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<button
						onClick={() => navigate('/docs/getting-started/quick-start')}
						className="p-6 border border-border/30 rounded-lg hover:border-primary/50 transition-all text-left group hover:bg-card/50"
					>
						<h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">Quick Start</h3>
						<p className="text-sm text-foreground/60">Get up and running with KoreShield in minutes</p>
					</button>

					<button
						onClick={() => navigate('/docs/features/attack-detection')}
						className="p-6 border border-border/30 rounded-lg hover:border-primary/50 transition-all text-left group hover:bg-card/50"
					>
						<h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">Attack Detection</h3>
						<p className="text-sm text-foreground/60">Learn how KoreShield detects and blocks attacks</p>
					</button>

					<button
						onClick={() => navigate('/docs/configuration/production-checklist')}
						className="p-6 border border-border/30 rounded-lg hover:border-primary/50 transition-all text-left group hover:bg-card/50"
					>
						<h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">Production Deployment</h3>
						<p className="text-sm text-foreground/60">Checklist for deploying to production</p>
					</button>

					<button
						onClick={() => navigate('/docs/compliance/gdpr')}
						className="p-6 border border-border/30 rounded-lg hover:border-primary/50 transition-all text-left group hover:bg-card/50"
					>
						<h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">Compliance</h3>
						<p className="text-sm text-foreground/60">GDPR, HIPAA, and other compliance documentation</p>
					</button>
				</div>
			</section>
		</div>
	);
}
