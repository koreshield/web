import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, ExternalLink, FileText, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

// Papers with external publication links (Academia.edu)
const publishedPapers = [
	{
		type: 'Research Paper',
		title: 'LLM-Firewall: A Lightweight Middleware Architecture for Real-Time Detection of Indirect Prompt Injection in Enterprise RAG Systems',
		date: 'January 2026',
		authors: 'Isaac Emmanuel, Teslim O. Kazeem',
		affiliation: 'National Open University of Nigeria',
		tags: ['Middleware Architecture', 'Real-Time Detection', 'Cross-Document Correlation', 'Production AI'],
		href: 'https://www.academia.edu/164690692/LLM_Firewall_A_Lightweight_Middleware_Architecture_for_Real_Time_Detection_of_Indirect_Prompt_Injection_in_Enterprise_RAG_Systems',
		abstract: 'This paper presents LLM-Firewall, a deterministic middleware architecture for real-time detection of indirect prompt injection in enterprise Retrieval-Augmented Generation systems. The system is positioned between the vector database and the LLM inference engine, intercepting retrieved context before prompt construction at a core inspection latency of approximately 2.5 milliseconds per request. The key architectural contribution is a cross-document correlation engine that identifies fragmented injection attacks distributed across multiple retrieval chunks: a category of attack that single-document inspection approaches cannot detect. The system is evaluated against 5,000 adversarial scenarios spanning five attack dimensions and compared against static blocklist and LLM-as-a-Judge baselines, achieving strong detection rates at production-viable throughput without the latency overhead that makes secondary-LLM inspection impractical at scale.',
	},
	{
		type: 'Preprint',
		title: 'LLM-Firewall: A Novel Taxonomy of Indirect Prompt Injection Attacks in Enterprise RAG Systems',
		date: 'December 2025',
		authors: 'Isaac Emmanuel, Teslim O. Kazeem',
		affiliation: 'National Open University of Nigeria',
		tags: ['Prompt Injection', 'RAG Security', 'Taxonomy', 'Enterprise AI'],
		href: 'https://www.academia.edu/145685538/_Preprint_LLM_Firewall_A_Novel_Taxonomy_of_Indirect_Prompt_Injection_Attacks_in_Enterprise_RAG_Systems',
		abstract: 'This preprint introduces a five-dimensional taxonomy for classifying indirect prompt injection attacks against enterprise RAG deployments, addressing a gap in existing research that has focused disproportionately on direct user-level injection while underweighting the retrieval-layer attack surface. The five dimensions classify attacks by injection vector, operational target, persistence mechanism, enterprise context, and detection complexity, and together provide a structured framework for reasoning about a threat class in which adversarial instructions embedded in retrieved documents can influence model behavior without any direct interaction with the application. The paper proposes LLM-Firewall as a middleware architecture positioned at the retrieval-to-inference boundary and establishes the threat model and positioning rationale that the companion architecture paper implements in full.',
	},
];

// Reports and advisories (internal publications, attributed to Isaac Emmanuel)
const reportsAndAdvisories = [
	{
		type: 'Threat Report',
		title: 'The State of Prompt Injection in Production LLM Systems',
		date: 'April 2025',
		authors: 'Isaac Emmanuel',
		affiliation: 'KoreShield',
		tags: ['Prompt Injection', 'RAG', 'Production Data', 'Threat Intelligence'],
		abstract: 'This threat report presents an analysis of prompt injection activity observed across production LLM deployments integrated with KoreShield during Q1 2025. Drawing on a corpus of over two million intercepted requests, the report characterises the most prevalent attack patterns by frequency, detection rate, and target model type, and documents a significant shift in the threat landscape: indirect injection through Retrieval-Augmented Generation pipelines has overtaken direct user-input injection as the dominant attack vector in enterprise deployments. The report attributes this shift to the rapid adoption of RAG architectures for enterprise knowledge retrieval, which introduces a document-layer attack surface that is absent from most deployed defences. Detection rates by attack class, evasion patterns most frequently observed at the model level, and recommendations for layered defence postures are included.',
	},
	{
		type: 'Technical Paper',
		title: 'Indirect Prompt Injection via Retrieved Documents: Attack Taxonomy and Mitigations',
		date: 'March 2025',
		authors: 'Isaac Emmanuel',
		affiliation: 'KoreShield',
		tags: ['RAG Security', 'Taxonomy', 'Mitigations', 'Indirect Injection'],
		abstract: 'This paper introduces a structured taxonomy of indirect prompt injection attacks targeting RAG pipelines, organising observed attack patterns into four classes: instruction embedding (adversarial directives inserted directly into document text), role impersonation (injections that claim authority by presenting themselves as system or administrator instructions), context poisoning (content that manipulates the model\'s understanding of its task without containing explicit directives), and cross-document chaining (attacks where no single retrieved document contains a complete adversarial payload, requiring the model to synthesise the instruction from fragments across multiple documents). For each class, the paper evaluates detection efficacy across a representative set of attack instances, finding that static blocklist approaches perform adequately against instruction embedding but degrade significantly against role impersonation and context poisoning. The paper proposes a proxy-layer mitigation architecture positioned at the retrieval boundary as the most tractable point for consistent cross-class defence.',
	},
	{
		type: 'Security Advisory',
		title: 'Tool Call Hijacking in Agentic Pipelines: A Practical Demonstration',
		date: 'February 2025',
		authors: 'Isaac Emmanuel',
		affiliation: 'KoreShield',
		tags: ['AI Agents', 'Tool Abuse', 'Agentic Security', 'Proof of Concept'],
		abstract: 'This advisory demonstrates a class of attack in which malicious instructions embedded in tool outputs redirect an autonomous LLM agent to execute actions outside its intended scope. Agentic systems that invoke tools and act on the results are structurally vulnerable to this pattern because the agent treats tool responses as trusted context; an attacker who can influence a tool response (through a compromised API, a document returned by a retrieval tool, or a web page accessed by a browsing agent) can redirect the agent\'s subsequent actions without any direct user-level access to the system. Proof-of-concept scenarios are documented across LangChain, AutoGen, and Claude Tools, demonstrating that the vulnerability is not specific to a particular orchestration library but is an intrinsic property of the architectural pattern. The advisory concludes with a discussion of proxy-layer enforcement as a defence mechanism, covering how interception of tool call inputs and outputs before the agent acts on them can contain the blast radius of a successful injection.',
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
		body: 'A class of prompt injection attacks aims not to alter model behaviour but to extract sensitive data present in the model\'s context window. Common patterns include instruction sequences that ask the model to summarise, reformat, or translate content containing personally identifiable information, embedding the exfiltration inside what appears to be a legitimate output transformation. This note documents recurring attack structures observed in production and identifies output-layer signals that correlate reliably with exfiltration intent.',
	},
	{
		title: 'Evaluating Confidence Thresholds for Prompt Injection Classifiers',
		type: 'Research Note',
		body: 'Binary classification of prompt injection attacks requires a threshold decision: at what confidence score should a request be blocked rather than allowed to proceed? This note examines the precision-recall tradeoff across different threshold configurations on a held-out evaluation set, characterising how false positive rate and over-blocking risk vary across deployment contexts with different tolerance profiles for incorrect blocks versus missed attacks.',
	},
	{
		title: 'Bypass Resistance of System-Prompt Hardening Alone',
		type: 'Research Note',
		body: 'Embedding defensive instructions directly in a model\'s system context is a widely recommended mitigation for prompt injection. This note evaluates the bypass resistance of hardened system prompts against a range of injection techniques, including role impersonation, authority override phrasing, and context poisoning. The consistent finding is that instruction-level defences are bypassed when retrieved context carries adversarial authority signals, making proxy-layer enforcement a necessary complement rather than an alternative.',
	},
	{
		title: 'Multi-Turn Injection: Building Attack Context Across Conversation Rounds',
		type: 'Research Note',
		body: 'Some injection attacks are not self-contained within a single request. This note documents a class of multi-turn attacks where the adversary incrementally establishes context across successive conversation rounds, ultimately steering the model toward a target behaviour that would have been blocked if attempted in a single turn. The pattern exploits the limited attention that request-level safety classifiers allocate to historical context, and requires session-aware inspection to detect reliably.',
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

function PaperCard({
	item,
	index,
	showLink,
}: {
	item: typeof publishedPapers[0] | typeof reportsAndAdvisories[0];
	index: number;
	showLink: boolean;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.4, delay: index * 0.07 }}
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

			<p className="mt-5 text-sm text-muted-foreground leading-relaxed">{item.abstract}</p>

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
				{showLink && 'href' in item && item.href ? (
					<a
						href={item.href}
						target="_blank"
						rel="noreferrer noopener"
						className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-electric-green hover:underline"
					>
						Read on Academia.edu <ExternalLink className="h-3.5 w-3.5" />
					</a>
				) : null}
			</div>
		</motion.div>
	);
}

export default function ResearchPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="Research | KoreShield"
				description="KoreShield's AI security research: published papers, threat reports, technical advisories, and notes on indirect prompt injection, RAG pipeline security, and agentic AI threats."
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
						Peer-reviewed and preprint papers from the KoreShield research team, available on Academia.edu.
					</p>
					<div className="space-y-8">
						{publishedPapers.map((item, i) => (
							<PaperCard key={item.title} item={item} index={i} showLink={true} />
						))}
					</div>
				</div>
			</section>

			{/* Reports and advisories */}
			<section className="bg-muted/30 px-6 py-20 border-t border-border">
				<div className="mx-auto max-w-5xl">
					<h2 className="text-3xl font-bold tracking-tight mb-3">Reports &amp; advisories</h2>
					<p className="text-muted-foreground mb-12 max-w-xl">
						Threat intelligence reports, technical analyses, and security advisories from the KoreShield team.
					</p>
					<div className="space-y-8">
						{reportsAndAdvisories.map((item, i) => (
							<PaperCard key={item.title} item={item} index={i} showLink={false} />
						))}
					</div>
				</div>
			</section>

			{/* Research notes */}
			<section className="px-6 py-20 border-t border-border">
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
								New papers, reports, and research notes are announced via our blog and GitHub.
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
