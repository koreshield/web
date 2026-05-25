import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

type FAQCategory = {
	title: string;
	questions: { q: string; a: string }[];
};

const faqCategories: FAQCategory[] = [
	{
		title: 'General',
		questions: [
			{
				q: 'What is Koreshield?',
				a: 'Koreshield is a proxy-layer security firewall for LLM-powered applications. It sits between your app and your AI providers, scanning every prompt, response, and RAG context for threats like injection attacks, jailbreaks, data exfiltration, and PII leakage — before they reach the model or your users.',
			},
			{
				q: 'How does Koreshield differ from prompt filtering libraries?',
				a: 'Most open-source libraries are scanner functions you embed inside your code. Koreshield is a runtime proxy that intercepts traffic at the network layer, enforces policies, logs audit evidence, and works across every provider and framework — without touching your application code.',
			},
			{
				q: 'Which LLM providers does Koreshield support?',
				a: 'Koreshield supports OpenAI, Anthropic (Claude), Google Gemini, DeepSeek, Azure OpenAI, and any OpenAI-compatible endpoint. You configure provider routing once and Koreshield handles the rest.',
			},
			{
				q: 'Is Koreshield open source?',
				a: 'Koreshield is a commercial product with an open-source SDK. The proxy engine, detection models, and threat corpus are proprietary. The Python and Node.js client SDKs are open source.',
			},
		],
	},
	{
		title: 'Security & Privacy',
		questions: [
			{
				q: 'Does Koreshield store my prompts or responses?',
				a: 'No. Koreshield is zero-log by default. Requests and responses are inspected in memory and discarded immediately. Nothing is stored unless you explicitly enable a retention policy on Scale or Enterprise.',
			},
			{
				q: 'What happens if Koreshield goes down?',
				a: 'Koreshield is designed with fail-open and fail-closed modes. By default, if the proxy is unreachable, requests are blocked (fail-closed) to prevent unscreened traffic. You can configure fail-open behaviour if availability is more critical than security for your use case.',
			},
			{
				q: 'How accurate is the detection engine?',
				a: 'Koreshield achieves 95%+ detection accuracy with fewer than 3 false positives per 100 blocked requests. The detection engine is tuned on millions of real-world attack attempts and continuously updated with new threat patterns from red-team research.',
			},
			{
				q: 'Does Koreshield add latency to my requests?',
				a: 'Koreshield adds sub-30ms overhead at the proxy layer. For most applications, this is negligible compared to LLM inference times which typically range from 500ms to several seconds.',
			},
			{
				q: 'Can Koreshield detect prompt injection in RAG contexts?',
				a: 'Yes. Koreshield scans every document in your retrieval context before it reaches the model. This catches indirect prompt injection — malicious instructions hidden inside retrieved documents that your vector database has no way of detecting.',
			},
		],
	},
	{
		title: 'Deployment & Infrastructure',
		questions: [
			{
				q: 'How long does integration take?',
				a: 'Under 30 minutes for most teams. You change one URL in your LLM client configuration to point through Koreshield. No code rewrite, no SDK migration, no architectural changes required. The Python and Node.js SDKs make it even simpler.',
			},
			{
				q: 'Can I self-host Koreshield?',
				a: 'Yes. Enterprise customers can deploy Koreshield on their own infrastructure using Docker Compose. Self-hosted deployments include offline licence validation, so there is no phone-home to our servers. See the self-hosted deployment guide for details.',
			},
			{
				q: 'Do you support air-gapped environments?',
				a: 'Yes. Koreshield supports fully air-gapped deployment with no outbound internet access. Licence validation is offline using HMAC-signed keys, and threat corpus updates are handled via bundled JSONL files with SIGHUP hot-reload. See the air-gapped deployment guide.',
			},
			{
				q: 'What infrastructure does the managed cloud run on?',
				a: 'Koreshield\'s managed cloud runs on dedicated infrastructure with automatic scaling, global edge distribution, and zero-maintenance operation. We handle availability, updates, and security patching.',
			},
			{
				q: 'Does Koreshield work with my existing infrastructure?',
				a: 'Yes. Koreshield integrates with Docker, Kubernetes, AWS, GCP, Azure, Vercel, Netlify, Railway, Heroku, Digital Ocean, and Cloudflare Workers. It also works with monitoring tools like Datadog, Prometheus, Grafana, and Sentry.',
			},
		],
	},
	{
		title: 'Pricing & Billing',
		questions: [
			{
				q: 'How does pricing work?',
				a: 'You pay a fixed monthly platform fee that includes a block of protected requests. If you exceed that block, overages are billed at £12 per 100,000 requests. Annual plans apply a flat 20% discount. The Dev tier is free with 10,000 protected requests per month.',
			},
			{
				q: 'What is a protected request?',
				a: 'One protected request equals one screened AI interaction routed through Koreshield. RAG document scans use weighted counting at 25 requests per document scanned, and audio scans use 50 requests per scan, reflecting the additional compute involved.',
			},
			{
				q: 'Do you charge per seat?',
				a: 'No. Koreshield pricing is built around AI traffic, not headcount. Your entire product, security, and engineering team can access the platform on paid plans without additional per-seat charges.',
			},
			{
				q: 'Can I start for free?',
				a: 'Yes. The Dev tier includes 10,000 protected requests per month with baseline prompt and RAG screening, basic dashboard visibility, and core logs. No credit card required.',
			},
			{
				q: 'What is included on Enterprise?',
				a: 'Self-hosted or air-gapped deployment with offline licence validation, SSO and SAML, SIEM export, custom retention and SLA, external threat corpus support, and dedicated onboarding and security review. Pricing is scoped to your protected-request volume and deployment requirements.',
			},
		],
	},
	{
		title: 'Compliance & Governance',
		questions: [
			{
				q: 'Does Koreshield help with GDPR compliance?',
				a: 'Yes. Koreshield\'s zero-log default means no personal data is retained. When retention is enabled, data is stored in schema-per-tenant isolated databases with configurable retention periods. We also offer a Data Processing Agreement (DPA) for Enterprise customers.',
			},
			{
				q: 'Can Koreshield provide audit evidence for compliance?',
				a: 'Yes. Every scan, block, and policy decision is logged with full context. You can query threat history, generate compliance evidence reports, and export to your SIEM. This covers audit requirements for SOC 2, ISO 27001, HIPAA, and similar frameworks.',
			},
			{
				q: 'Does Koreshield support RBAC?',
				a: 'Yes. Role-Based Access Control is available on Scale and Enterprise plans. You can assign roles to team members, scope API keys to specific teams or projects, and maintain a full audit trail of who did what.',
			},
			{
				q: 'Where is my data processed?',
				a: 'On managed cloud, data is processed in-memory on our infrastructure and not retained by default. For self-hosted and air-gapped deployments, all data stays on your own infrastructure — nothing leaves your network.',
			},
		],
	},
	{
		title: 'Troubleshooting',
		questions: [
			{
				q: 'My requests are being blocked incorrectly. How do I tune detection?',
				a: 'Koreshield lets you configure detection sensitivity via policies. You can adjust confidence thresholds, allowlist specific patterns, or create custom rules. Check the policies documentation for details on fine-tuning detection to your use case.',
			},
			{
				q: 'I\'m seeing high false positive rates. What should I do?',
				a: 'Start by reviewing your blocked requests in the dashboard to identify patterns. Then create policy rules to allowlist legitimate patterns that are being flagged. If false positives persist, contact support — we can help tune the detection model for your specific traffic.',
			},
			{
				q: 'How do I rotate API keys without downtime?',
				a: 'Generate a new API key in the dashboard before revoking the old one. Update your application configuration to use the new key, then revoke the old key once all traffic has migrated. Koreshield supports multiple active keys per account to enable zero-downtime rotation.',
			},
			{
				q: 'The dashboard shows "degraded" provider health. What does that mean?',
				a: 'This means one or more of your configured LLM providers is responding slowly or returning errors. Koreshield monitors provider health continuously. Check the Provider Health page for details on which provider is affected and current error rates.',
			},
		],
	},
];

function FAQItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
	return (
		<div className="rounded-2xl border border-border bg-card transition-colors hover:border-white/[0.12]">
			<button
				type="button"
				onClick={onToggle}
				className="flex w-full items-center justify-between gap-4 p-6 text-left"
			>
				<span className="font-semibold text-foreground">{question}</span>
				<ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
			</button>
			<motion.div
				initial={false}
				animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
				transition={{ duration: 0.2 }}
				className="overflow-hidden"
			>
				<div className="px-6 pb-6 text-sm leading-relaxed text-muted-foreground">
					{answer}
				</div>
			</motion.div>
		</div>
	);
}

export default function FAQPage() {
	const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

	const toggleItem = (key: string) => {
		setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	const totalQuestions = faqCategories.reduce((sum, cat) => sum + cat.questions.length, 0);

	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="FAQ"
				description={`Answers to the ${totalQuestions} most common questions about Koreshield — security, privacy, deployment, pricing, compliance, and troubleshooting.`}
			/>

			<section className="relative px-6 py-24 ambient-glow">
				<div className="mx-auto max-w-4xl text-center relative z-10">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
						<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-electric-green">
							<span className="h-1.5 w-1.5 rounded-full bg-electric-green" />
							Knowledge Base
						</div>
						<h1 className="text-5xl font-extrabold tracking-[-0.04em] text-foreground md:text-6xl">
							Frequently Asked Questions
						</h1>
						<p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
							Everything you need to know about Koreshield — from how it works to how to deploy it in your environment.
						</p>
					</motion.div>
				</div>
			</section>

			<div className="mx-auto max-w-4xl px-6 pb-24">
				{/* Category nav */}
				<div className="mb-12 flex flex-wrap justify-center gap-2">
					{faqCategories.map((cat) => (
						<a
							key={cat.title}
							href={`#${cat.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
							className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-electric-green/30 hover:text-foreground"
						>
							{cat.title}
							<span className="ml-1.5 text-electric-green">{cat.questions.length}</span>
						</a>
					))}
				</div>

				{/* FAQ sections */}
				<div className="space-y-16">
					{faqCategories.map((category) => (
						<motion.section
							key={category.title}
							id={category.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5 }}
						>
							<h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">{category.title}</h2>
							<div className="space-y-3">
								{category.questions.map((faq, idx) => {
									const key = `${category.title}-${idx}`;
									return (
										<FAQItem
											key={key}
											question={faq.q}
											answer={faq.a}
											isOpen={!!openItems[key]}
											onToggle={() => toggleItem(key)}
										/>
									);
								})}
							</div>
						</motion.section>
					))}
				</div>

				{/* CTA */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="mt-20 rounded-[2rem] border border-white/[0.08] bg-card/70 p-10 text-center"
				>
					<h2 className="text-2xl font-extrabold tracking-[-0.03em] text-foreground">
						Still have questions?
					</h2>
					<p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground leading-relaxed">
						We're happy to help. Reach out to us directly or read the full documentation.
					</p>
					<div className="mt-8 flex flex-wrap justify-center gap-4">
						<Link
							to="/contact"
							className="inline-flex items-center gap-2 rounded-xl bg-electric-green px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-bright"
						>
							Contact us <ArrowRight className="h-4 w-4" />
						</Link>
						<Link
							to="/docs"
							className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-background/60 px-6 py-3 text-sm font-bold text-foreground transition-colors hover:border-electric-green/30 hover:bg-muted"
						>
							Read the docs
						</Link>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
