import { SEOMeta } from '../components/SEOMeta';

const RELEASES = [
	{
		version: '0.3.0',
		date: '2026-02-10',
		title: 'Web Platform & Dashboard Launch',
		description: 'Complete web platform with comprehensive monitoring and management capabilities.',
		changes: [
			'Live Threat Monitoring: Real-time threat detection and visualization.',
			'Provider Health Dashboard: Monitor LLM provider status and performance.',
			'API Key Management: Secure key rotation and access control.',
			'Audit Logs: Complete compliance and activity tracking.',
			'Interactive Playground: Test and validate security policies.'
		],
		tag: 'Major'
	},
	{
		version: '0.2.0',
		date: '2025-12-31',
		title: 'Research Paper Preprint Release',
		description: 'Published comprehensive research on LLM security and indirect prompt injection taxonomy.',
		changes: [
			'Released preprint: "LLM Firewall: A Novel Taxonomy of Indirect Prompt Injection Attacks in Enterprise RAG Systems".',
			'Introduced 5-dimensional threat classification framework.',
			'Documented attack vectors and defense mechanisms.',
			'Available on Academia.edu for peer review.'
		],
		tag: 'Major',
		link: 'https://www.academia.edu/145685538/_Preprint_LLM_Firewall_A_Novel_Taxonomy_of_Indirect_Prompt_Injection_Attacks_in_Enterprise_RAG_Systems'
	},
	{
		version: '0.1.0',
		date: '2025-11-15',
		title: 'Initial Release',
		description: 'First public release of KoreShield with core security features.',
		changes: [
			'Multi-provider LLM support (OpenAI, Anthropic, DeepSeek).',
			'Real-time prompt injection detection.',
			'Python and JavaScript SDKs.',
			'Basic RAG context scanning.',
			'Docker-based deployment.'
		],
		tag: 'Major'
	}
];

function ChangelogPage() {
	return (
		<div className="min-h-screen bg-background text-foreground pt-24 pb-20 transition-colors">
			<SEOMeta
				title="Changelog | KoreShield"
				description="Latest updates, releases, and improvements to the KoreShield platform."
			/>

			<div className="max-w-4xl mx-auto px-6">
				<div className="mb-16">
					<h1 className="text-4xl font-bold mb-4 text-foreground">Changelog</h1>
					<p className="text-xl text-muted-foreground">Track the evolution of KoreShield.</p>
				</div>

				<div className="space-y-12 relative border-l border-border ml-3 pl-8 md:ml-4 md:pl-10">
					{RELEASES.map((release, index) => (
						<div key={index} className="relative md:grid md:grid-cols-4 md:gap-8">
							{/* Timeline Date */}
							<div className="hidden md:block text-right pt-1">
								<div className="text-sm font-mono text-muted-foreground">{release.date}</div>
							</div>

							{/* Timeline Dot */}
							<div className="absolute -left-[37px] top-2 w-3.5 h-3.5 rounded-full bg-electric-green ring-[3px] ring-electric-green/25 shadow-md shadow-electric-green/50 transition-colors">
								{index === 0 && <span className="absolute -top-1 -left-1 w-5 h-5 bg-electric-green/20 rounded-full animate-ping"></span>}
							</div>

							<div className="md:col-span-3 pb-8 border-b border-border last:border-0">
								<div className="flex items-center gap-3 mb-2">
									<h2 className="text-2xl font-bold text-foreground list-none">{release.version}</h2>
									<span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${release.tag === 'Major'
										? 'bg-electric-green text-black'
										: 'bg-muted text-muted-foreground'
										}`}>
										{release.tag}
									</span>
									{/* Mobile Date */}
									<span className="md:hidden text-xs font-mono text-muted-foreground ml-auto">{release.date}</span>
								</div>
								<h3 className="text-xl font-semibold text-foreground/90 mb-3">{release.title}</h3>
								<p className="text-muted-foreground mb-6">{release.description}</p>

								<ul className="space-y-2 mb-4 list-none p-0 m-0">
									{release.changes.map((change, i) => (
										<li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
											<span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-electric-green/60 shrink-0"></span>
											{change}
										</li>
									))}
								</ul>
								{release.link && (
									<a
										href={release.link}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-2 text-electric-green hover:text-emerald-bright transition-colors text-sm font-medium"
									>
										Read the full paper
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
										</svg>
									</a>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export default ChangelogPage;
