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
		abstract: 'This paper presents LLM-Firewall, a middleware architecture for real-time detection of indirect prompt injection in enterprise retrieval-augmented generation systems. The design places inspection between retrieval and inference so that retrieved context can be evaluated before prompt assembly. Its central contribution is a cross-document correlation engine that identifies fragmented attack payloads distributed across multiple retrieved chunks, a failure mode that single-document inspection often misses. The evaluation covers 5,000 adversarial scenarios across five attack dimensions and compares the architecture against static blocklist baselines and secondary-model judging approaches, showing that strong detection can be achieved without introducing impractical latency at production scale.',
	},
	{
		type: 'Preprint',
		title: 'LLM-Firewall: A Novel Taxonomy of Indirect Prompt Injection Attacks in Enterprise RAG Systems',
		date: 'December 2025',
		authors: 'Isaac Emmanuel, Teslim O. Kazeem',
		affiliation: 'National Open University of Nigeria',
		tags: ['Prompt Injection', 'RAG Security', 'Taxonomy', 'Enterprise AI'],
		href: 'https://www.academia.edu/145685538/_Preprint_LLM_Firewall_A_Novel_Taxonomy_of_Indirect_Prompt_Injection_Attacks_in_Enterprise_RAG_Systems',
		abstract: 'This preprint introduces a five-dimensional taxonomy for classifying indirect prompt injection attacks against enterprise RAG deployments. It addresses a gap in prior work, which has focused more heavily on direct user-supplied injection while giving less attention to the retrieval layer. The taxonomy classifies attacks by injection vector, operational target, persistence mechanism, enterprise context, and detection complexity. Together, these dimensions provide a structured way to reason about attacks in which adversarial instructions embedded in retrieved content shape model behavior without requiring direct interaction with the application. The paper also motivates LLM-Firewall as a middleware architecture placed at the retrieval-to-inference boundary and establishes the threat model later implemented in the companion architecture paper.',
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
		abstract: 'This threat report analyses prompt injection activity observed across production LLM deployments integrated with KoreShield during Q1 2025. Drawing on a corpus of more than two million intercepted requests, it characterises prevalent attack patterns by frequency, detection rate, and target model family, and documents a clear shift in the threat landscape. Indirect injection through retrieval-augmented generation pipelines emerges as the dominant attack vector in enterprise deployments, overtaking direct user-input injection. The report attributes this shift to the widespread adoption of RAG architectures for enterprise knowledge retrieval, which introduces a document-layer attack surface that many deployed defenses do not adequately inspect. Detection rates by attack class, common evasion patterns, and recommendations for layered defensive controls are included.',
	},
	{
		type: 'Technical Paper',
		title: 'Indirect Prompt Injection via Retrieved Documents: Attack Taxonomy and Mitigations',
		date: 'March 2025',
		authors: 'Isaac Emmanuel',
		affiliation: 'KoreShield',
		tags: ['RAG Security', 'Taxonomy', 'Mitigations', 'Indirect Injection'],
		abstract: 'This paper introduces a structured taxonomy of indirect prompt injection attacks targeting retrieval-augmented generation pipelines. Observed attack patterns are organised into four classes: instruction embedding, role impersonation, context poisoning, and cross-document chaining. For each class, the paper evaluates detection efficacy across representative attack instances and finds that static blocklist approaches remain adequate for straightforward instruction embedding but degrade substantially on role impersonation and context poisoning. The paper concludes that a proxy-layer mitigation architecture at the retrieval boundary is the most operationally tractable point for consistent cross-class defense.',
	},
	{
		type: 'Security Advisory',
		title: 'Tool Call Hijacking in Agentic Pipelines: A Practical Demonstration',
		date: 'February 2025',
		authors: 'Isaac Emmanuel',
		affiliation: 'KoreShield',
		tags: ['AI Agents', 'Tool Abuse', 'Agentic Security', 'Proof of Concept'],
		abstract: 'This advisory demonstrates a class of attack in which malicious instructions embedded in tool outputs redirect an autonomous LLM agent to execute actions outside its intended scope. Agentic systems that invoke tools and act on their results are structurally exposed to this pattern because tool responses are commonly treated as trusted context. An attacker who can influence a tool response, whether through a compromised API, a manipulated retrieved document, or a web page processed by a browsing agent, can redirect subsequent agent behavior without direct user-level access. Proof-of-concept scenarios are documented across LangChain, AutoGen, and Claude Tools, supporting the claim that the weakness is architectural rather than framework-specific. The advisory closes with a discussion of proxy-layer enforcement for tool inputs and outputs as a practical way to reduce the blast radius of successful injection attempts.',
	},
];

const researchNotes = [
	{
		title: 'Jailbreak Technique Drift: How Attack Patterns Evolve Month-Over-Month',
		type: 'Research Note',
		body: 'Jailbreak techniques observed in production LLM deployments do not remain static. Analysis of requests processed through KoreShield over successive months shows iterative adaptation, with attack variants clustering around recently disclosed techniques before drifting toward new formulations as detection coverage matures. This note characterises the lifecycle of a jailbreak technique and outlines what that lifecycle means for classifiers trained on historical attack distributions.',
	},
	{
		title: 'PII Exfiltration via LLM Output: Common Patterns and Detection Signals',
		type: 'Research Note',
		body: 'A class of prompt injection attacks aims not to alter model behavior but to extract sensitive data present in the model context window. Common patterns include instruction sequences that ask the model to summarise, reformat, or translate content containing personally identifiable information, thereby embedding exfiltration inside what appears to be a legitimate output transformation. This note documents recurring attack structures observed in production and identifies output-layer signals that correlate reliably with exfiltration intent.',
	},
	{
		title: 'Evaluating Confidence Thresholds for Prompt Injection Classifiers',
		type: 'Research Note',
		body: 'Binary classification of prompt injection attacks requires a threshold decision: at what confidence score should a request be blocked rather than allowed to proceed? This note examines the precision-recall tradeoff across threshold configurations on a held-out evaluation set and characterises how false positive rate and over-blocking risk vary across deployment contexts with different tolerances for incorrect blocks and missed attacks.',
	},
	{
		title: 'Bypass Resistance of System-Prompt Hardening Alone',
		type: 'Research Note',
		body: 'Embedding defensive instructions directly in a model system context is a widely recommended mitigation for prompt injection. This note evaluates the bypass resistance of hardened system prompts against role impersonation, authority override phrasing, and context poisoning. The consistent finding is that instruction-level defenses are bypassed when retrieved context carries adversarial authority signals, making proxy-layer enforcement a necessary complement rather than an alternative.',
	},
	{
		title: 'Multi-Turn Injection: Building Attack Context Across Conversation Rounds',
		type: 'Research Note',
		body: 'Some injection attacks are not self-contained within a single request. This note documents a class of multi-turn attacks in which the adversary incrementally establishes context across successive conversation rounds, ultimately steering the model toward a target behavior that would likely have been blocked if attempted in a single turn. The pattern exploits the limited attention that request-level safety classifiers often allocate to historical context and therefore requires session-aware inspection to detect reliably.',
	},
	{
		title: 'False Positive Rates in Semantic vs. Rule-Based Detectors at Scale',
		type: 'Research Note',
		body: 'Production LLM deployments handle a significant volume of legitimate requests that superficially resemble injection attempts. This note benchmarks false positive rates for semantic embedding-based detectors against rule-based pattern-matching classifiers across a large production request set. Semantic classifiers achieve lower false positive rates on paraphrased and obfuscated content, while rule-based systems continue to perform well on structured attack signatures. Hybrid pipelines that combine both methods reduce false positives across both categories.',
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
				description="Research from KoreShield on prompt injection, RAG pipeline security, agentic AI threats, and production attack patterns."
			/>

			{/* Hero */}
			<section className="relative px-6 py-24 overflow-hidden ambient-glow">
				<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
				<div className="relative mx-auto max-w-5xl">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
						<div className="text-center">
							<span className="inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-electric-green mb-6">
								<span className="h-1.5 w-1.5 rounded-full bg-electric-green animate-pulse" />
								Research
							</span>
							<h1 className="text-5xl font-bold tracking-tight md:text-6xl">
								Research on real attack behavior in production LLM systems
							</h1>
							<p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
								This page collects papers, technical reports, advisories, and short research notes written from the perspective of applied LLM security engineering. The work focuses on prompt injection, retrieval-layer abuse, agentic failure modes, and the operational realities of defending production systems.
							</p>
						</div>
						<div className="mt-10 grid gap-4 md:grid-cols-3">
							<div className="rounded-2xl border border-border bg-card/80 p-5">
								<p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Research Lead</p>
								<p className="mt-2 text-lg font-semibold">Isaac Emmanuel</p>
								<p className="mt-1 text-sm text-muted-foreground">CTO, KoreShield</p>
							</div>
							<div className="rounded-2xl border border-border bg-card/80 p-5">
								<p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Focus</p>
								<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
									Prompt injection, retrieval security, agentic systems, and defensive architecture for enterprise AI.
								</p>
							</div>
							<div className="rounded-2xl border border-border bg-card/80 p-5">
								<p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Method</p>
								<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
									Threat modelling, production telemetry, adversarial testing, and systems-oriented evaluation.
								</p>
							</div>
						</div>
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
						Published and preprint work from the KoreShield research program, with papers authored by Isaac Emmanuel and collaborators.
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
						Technical reports and advisories written by Isaac Emmanuel on attack trends, defensive design, and practical failure modes in deployed AI systems.
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
						Short-form notes from ongoing investigation into classifier behavior, attack adaptation, and production telemetry.
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
