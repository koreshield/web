import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, ExternalLink, FileText, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const featuredResearch = [
	{
		type: 'Preprint',
		title: 'LLM-Firewall: A Novel Taxonomy of Indirect Prompt Injection Attacks in Enterprise RAG Systems',
		date: 'December 2025',
		authors: 'Isaac Emmanuel, Teslim O. Kazeem',
		affiliation: 'National Open University of Nigeria',
		tags: ['Prompt Injection', 'RAG Security', 'Taxonomy', 'Enterprise AI'],
		href: 'https://www.academia.edu/145685538/_Preprint_LLM_Firewall_A_Novel_Taxonomy_of_Indirect_Prompt_Injection_Attacks_in_Enterprise_RAG_Systems',
		paragraphs: [
			'Retrieval-Augmented Generation systems expand what large language models can do by pulling in live, proprietary knowledge at inference time. The cost of that capability is architectural: retrieved content is injected directly into the prompt context, and large language models do not maintain a hard boundary between data and instructions. An adversary who can influence what a RAG pipeline retrieves can therefore influence what the model does, without ever interacting with the application directly. This paper addresses that threat class directly.',
			'The central contribution is a five-dimensional taxonomy for classifying indirect prompt injection (IPI) attacks against enterprise RAG deployments. The five dimensions are: injection vector (the document type or data source carrying the attack, such as emails, wiki articles, knowledge base entries, or tool responses); operational target (whether the attack seeks to alter output content, exfiltrate sensitive data, bypass access controls, or redirect downstream tool calls); persistence mechanism (single-retrieval attacks versus multi-retrieval attacks that accumulate adversarial context across repeated RAG queries); enterprise context (the organisational workflow being targeted, including HR systems, financial data pipelines, customer support flows, and code review environments); and detection complexity (the degree of obfuscation, encoding, or semantic camouflage applied to evade sanitisation).',
			'The paper argues that this taxonomy fills a gap in the existing literature, which has focused disproportionately on direct user-level injection while underweighting the retrieval-layer attack surface. The authors introduce LLM-Firewall as a middleware architecture positioned between the vector database and the inference engine. By intercepting retrieved context before prompt construction, the firewall can inspect and sanitise adversarial instructions at the one point in the pipeline where they are both visible and not yet trusted. The paper sets out the threat model, defines each taxonomy dimension with worked examples, and motivates the proxy-layer positioning that the companion architecture paper implements in full.',
		],
	},
	{
		type: 'Research Paper',
		title: 'LLM-Firewall: A Lightweight Middleware Architecture for Real-Time Detection of Indirect Prompt Injection in Enterprise RAG Systems',
		date: 'January 2026',
		authors: 'Isaac Emmanuel, Teslim O. Kazeem',
		affiliation: 'National Open University of Nigeria',
		tags: ['Middleware Architecture', 'Real-Time Detection', 'Cross-Document Correlation', 'Production AI'],
		href: 'https://www.academia.edu/164690692/LLM_Firewall_A_Lightweight_Middleware_Architecture_for_Real_Time_Detection_of_Indirect_Prompt_Injection_in_Enterprise_RAG_Systems',
		paragraphs: [
			'This paper moves from taxonomy to concrete, deployable architecture. Where the companion preprint establishes the threat landscape and classification framework for indirect prompt injection, this work presents LLM-Firewall as a fully specified, deterministic middleware system built for the performance constraints of enterprise production environments. The core design goal is interception without meaningful latency overhead: core inspection latency is reported at approximately 2.5 milliseconds per request, a figure that enables deployment in high-throughput pipelines where end-to-end LLM response times are closely monitored.',
			'The most novel architectural element is the cross-document correlation engine. Existing inspection systems evaluate retrieved documents or chunks individually. This approach fails against fragmented injection attacks, where an adversary deliberately splits an adversarial instruction across several semantically unrelated documents, each innocuous in isolation. The correlation engine maintains a session-level view of the full retrieval set, identifying instruction patterns that only become adversarial when read in combination. This addresses a meaningful capability gap left open by prior work.',
			'The architecture is deterministic by design. Rather than routing retrieved context through a secondary LLM for semantic judgement (the LLM-as-a-Judge pattern), LLM-Firewall applies fast, structured inspection rules derived from the taxonomy established in the companion paper. This avoids the latency penalty that makes LLM-based inspection impractical at scale, while remaining more resilient than pure keyword blocklists, which fail against paraphrased or encoded attacks. The system occupies a deliberate position between these two extremes in both cost and capability.',
			'Evaluation covers 5,000 adversarial scenarios spanning the five attack dimensions from the taxonomy paper. Baseline comparisons are made against static blocklists and LLM-as-a-Judge inspection. LLM-Firewall achieves strong detection rates across the evaluation set while maintaining production-viable throughput, with the cross-document correlation engine accounting for a material share of the detections that single-document inspection would miss.',
		],
	},
];

const researchNotes = [
	{
		title: 'Jailbreak Technique Drift: How Attack Patterns Evolve Month-Over-Month',
		type: 'Research Note',
		body: 'Jailbreak techniques observed in production LLM deployments do not remain static. Analysis of requests processed through KoreShield over successive months reveals a pattern of iterative adaptation, where attack variants cluster around recently disclosed techniques before drifting toward novel formulations as detection coverage matures. This note characterises the lifecycle of a jailbreak technique and outlines what that lifecycle means for classifiers trained on historical attack distributions.',
	},
	{
		title: 'PII Exfiltration via LLM Output: Common Patterns and Detection Signals',
		type: 'Research Note',
		body: 'A class of prompt injection attacks aims not to alter model behavior but to extract sensitive data present in the model\'s context window. Common patterns include instruction sequences that ask the model to summarise, reformat, or translate content containing personally identifiable information, embedding the exfiltration inside what appears to be a legitimate output transformation. This note documents recurring attack structures observed in production and identifies output-layer signals that correlate reliably with exfiltration intent.',
	},
	{
		title: 'Evaluating Confidence Thresholds for Prompt Injection Classifiers',
		type: 'Research Note',
		body: 'Binary classification of prompt injection attacks requires a threshold decision: at what confidence score should a request be blocked rather than allowed to proceed? This note examines the precision-recall tradeoff across different threshold configurations on a held-out evaluation set, characterising how false positive rate and over-blocking risk vary across deployment contexts with different tolerance profiles for incorrect blocks versus missed attacks.',
	},
	{
		title: 'Bypass Resistance of System-Prompt Hardening Alone',
		type: 'Research Note',
		body: 'Embedding defensive instructions directly in a model\'s system context is a widely recommended mitigation for prompt injection. This note evaluates the bypass resistance of hardened system prompts against a range of injection techniques, including role impersonation, authority override phrasing, and context poisoning. The consistent finding is that instruction-level defenses are bypassed when retrieved context carries adversarial authority signals, making proxy-layer enforcement a necessary complement rather than an alternative.',
	},
	{
		title: 'Multi-Turn Injection: Building Attack Context Across Conversation Rounds',
		type: 'Research Note',
		body: 'Some injection attacks are not self-contained within a single request. This note documents a class of multi-turn attacks where the adversary incrementally establishes context across successive conversation rounds, ultimately steering the model toward a target behavior that would have been blocked if attempted in a single turn. The pattern exploits the limited attention that request-level safety classifiers allocate to historical context, and requires session-aware inspection to detect reliably.',
	},
	{
		title: 'False Positive Rates in Semantic vs. Rule-Based Detectors at Scale',
		type: 'Research Note',
		body: 'Production LLM deployments handle a significant volume of legitimate requests that superficially resemble injection attempts. This note benchmarks false positive rates for semantic embedding-based detectors against rule-based pattern-matching classifiers across a large set of production requests. Semantic classifiers achieve lower false positive rates on paraphrased and obfuscated content; rule-based systems outperform on structured attack signatures. Hybrid approaches, combining both methods in a layered pipeline, reduce false positives across both categories.',
	},
];

const researchAreas = [
	{
		icon: <Shield className="h-6 w-6 text-electric-green" />,
		title: 'Prompt Injection',
		body: 'Direct and indirect injection techniques, bypass methods, detection efficacy across model families, and the structural vulnerability created when data and instruction boundaries are not enforced at the architecture level.',
	},
	{
		icon: <FileText className="h-6 w-6 text-electric-green" />,
		title: 'RAG Pipeline Security',
		body: 'Document poisoning, context hijacking, cross-document fragmentation attacks, and the challenge of inspecting retrieved content before model inference without introducing latency that degrades production usability.',
	},
	{
		icon: <BookOpen className="h-6 w-6 text-electric-green" />,
		title: 'Agentic Threat Modelling',
		body: 'Tool call abuse, orchestration manipulation, and multi-step attack patterns unique to autonomous AI systems, where a single injection can redirect an entire pipeline rather than just a single response.',
	},
];

export default function ResearchPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="Research | KoreShield"
				description="KoreShield's AI security research: published papers, technical notes, and ongoing work on indirect prompt injection, RAG pipeline security, and enterprise LLM attack taxonomy."
			/>

			{/* Hero */}
			<section className="relative px-6 py-24 overflow-hidden ambient-glow">
				<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
				<div className="relative mx-auto max-w-4xl text-center">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
						<span className="inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-electric-green mb-6">
							<span className="h-1.5 w-1.5 rounded-full bg-electric-green animate-pulse" />
							Research
						</span>
						<h1 className="text-5xl font-bold tracking-tight md:text-6xl">
							We study the attacks. So you don't have to.
						</h1>
						<p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
							KoreShield publishes ongoing research into LLM attack techniques, the security properties of enterprise RAG pipelines, and the threat landscape facing agentic AI systems in production.
						</p>
					</motion.div>
				</div>
			</section>

			{/* Research areas */}
			<section className="px-6 py-16 border-t border-border">
				<div className="mx-auto max-w-5xl">
					<div className="grid gap-6 md:grid-cols-3">
						{researchAreas.map((area, i) => (
							<motion.div
								key={area.title}
								initial={{ opacity: 0, y: 16 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.4, delay: i * 0.07 }}
								className="flex gap-4 rounded-2xl border border-border bg-card p-6"
							>
								<div className="mt-0.5 flex-shrink-0 rounded-xl border border-electric-green/20 bg-electric-green/10 p-2.5">
									{area.icon}
								</div>
								<div>
									<p className="font-semibold">{area.title}</p>
									<p className="mt-1 text-sm text-muted-foreground leading-relaxed">{area.body}</p>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Published papers */}
			<section className="px-6 py-20 border-t border-border">
				<div className="mx-auto max-w-5xl">
					<h2 className="text-3xl font-bold tracking-tight mb-3">Published papers</h2>
					<p className="text-muted-foreground mb-12 max-w-xl">
						Full research papers from the KoreShield team, available on Academia.edu.
					</p>

					<div className="space-y-10">
						{featuredResearch.map((item, i) => (
							<motion.div
								key={item.title}
								initial={{ opacity: 0, y: 16 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.4, delay: i * 0.07 }}
								className="rounded-2xl border border-border bg-card p-8"
							>
								<div className="flex flex-wrap items-center gap-3 mb-4">
									<span className="rounded-full border border-electric-green/30 bg-electric-green/10 px-2.5 py-1 text-xs font-semibold text-electric-green">
										{item.type}
									</span>
									<span className="text-xs text-muted-foreground">{item.date}</span>
								</div>

								<h3 className="text-xl font-bold leading-snug">{item.title}</h3>

								<p className="mt-2 text-sm text-muted-foreground">
									{item.authors} &middot; {item.affiliation}
								</p>

								<div className="mt-5 space-y-4">
									{item.paragraphs.map((para, j) => (
										<p key={j} className="text-sm text-muted-foreground leading-relaxed">
											{para}
										</p>
									))}
								</div>

								<div className="mt-6 flex flex-wrap items-center gap-3">
									<div className="flex flex-wrap gap-2">
										{item.tags.map((tag) => (
											<span
												key={tag}
												className="rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
											>
												{tag}
											</span>
										))}
									</div>
									<a
										href={item.href}
										target="_blank"
										rel="noreferrer noopener"
										className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-electric-green hover:underline"
									>
										Read on Academia.edu <ExternalLink className="h-3.5 w-3.5" />
									</a>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Research notes */}
			<section className="bg-muted/30 px-6 py-20 border-t border-border">
				<div className="mx-auto max-w-5xl">
					<h2 className="text-3xl font-bold tracking-tight mb-3">Research notes</h2>
					<p className="text-muted-foreground mb-10 max-w-xl">
						Shorter observations, analysis, and findings from ongoing work across the LLM security landscape.
					</p>

					<div className="grid gap-6 md:grid-cols-2">
						{researchNotes.map((item, i) => (
							<motion.div
								key={item.title}
								initial={{ opacity: 0, y: 12 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.35, delay: i * 0.05 }}
								className="rounded-2xl border border-border bg-card p-6"
							>
								<div className="flex items-start gap-4 mb-4">
									<div className="flex-shrink-0 mt-0.5 h-8 w-8 rounded-lg bg-electric-green/10 border border-electric-green/20 flex items-center justify-center">
										<FileText className="h-4 w-4 text-electric-green" />
									</div>
									<div className="min-w-0">
										<p className="text-sm font-semibold leading-snug">{item.title}</p>
										<span className="mt-1 inline-block text-xs text-electric-green/80 font-medium">{item.type}</span>
									</div>
								</div>
								<p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Responsible disclosure + Stay updated */}
			<section className="px-6 py-20 border-t border-border">
				<div className="mx-auto max-w-4xl">
					<div className="grid gap-12 md:grid-cols-2 md:items-center">
						<div>
							<h2 className="text-3xl font-bold tracking-tight">Responsible disclosure</h2>
							<p className="mt-4 text-muted-foreground leading-relaxed">
								We follow coordinated disclosure for any vulnerabilities discovered in third-party systems during our research. If you have found a security issue related to LLM infrastructure or RAG pipeline security, we are happy to collaborate on a responsible path to remediation.
							</p>
							<a
								href="mailto:security@koreshield.com"
								className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-electric-green hover:underline"
							>
								Contact security@koreshield.com <ArrowRight className="h-4 w-4" />
							</a>
						</div>
						<div className="rounded-2xl border border-border bg-card p-8">
							<h3 className="text-lg font-bold">Stay updated</h3>
							<p className="mt-2 text-sm text-muted-foreground">
								New papers, research notes, and dataset releases are announced via our blog and GitHub.
							</p>
							<div className="mt-6 flex flex-col gap-3">
								<a
									href="https://blog.koreshield.com"
									target="_blank"
									rel="noreferrer noopener"
									className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted"
								>
									<BookOpen className="h-4 w-4" /> Read the blog
								</a>
								<a
									href="https://github.com/koreshield/"
									target="_blank"
									rel="noreferrer noopener"
									className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted"
								>
									<ExternalLink className="h-4 w-4" /> GitHub
								</a>
								<Link
									to="/contact"
									className="inline-flex items-center gap-2 rounded-xl bg-electric-green px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
								>
									Get in touch <ArrowRight className="h-4 w-4" />
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
