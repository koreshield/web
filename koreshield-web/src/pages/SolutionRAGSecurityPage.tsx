import { motion } from 'framer-motion';
import { ArrowRight, Database, FileSearch, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const howItWorks = [
	{
		icon: <FileSearch className="h-6 w-6 text-electric-green" />,
		title: 'Retrieved content is scanned before the model sees it',
		body: 'In a RAG pipeline, documents retrieved from your index are passed to the model as context. Koreshield scans that content for injected instructions before it reaches the LLM, not after.',
	},
	{
		icon: <TriangleAlert className="h-6 w-6 text-electric-green" />,
		title: 'Indirect injection detection',
		body: 'An attacker who cannot reach your users directly can poison your document index instead. Koreshield detects instructions embedded in retrieved content that attempt to hijack the model\'s behaviour.',
	},
	{
		icon: <Database className="h-6 w-6 text-electric-green" />,
		title: 'Included in all plans, not an add-on',
		body: 'RAG scanning is a core capability, not a premium feature. Indirect prompt injection via retrieved documents is one of the most commonly exploited vectors in production LLM systems. It belongs in the default stack.',
	},
	{
		icon: <ShieldCheck className="h-6 w-6 text-electric-green" />,
		title: 'No changes to your retrieval pipeline',
		body: 'Koreshield inspects content as part of the proxy flow. You do not need to modify your embedding pipeline, your vector store, or your retrieval logic. The protection is applied at the point the content enters the LLM context.',
	},
];

const vectors = [
	'Instructions embedded in PDFs, emails, or web pages in your index',
	'Prompt injection in code comments retrieved by a coding assistant',
	'Manipulation via tool output or API response content',
	'Poisoned knowledge base entries targeting internal LLM tools',
	'Cross-user injection via shared document repositories',
];

export default function SolutionRAGSecurityPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="RAG Security | Koreshield"
				description="Protect your RAG pipelines against indirect prompt injection. Koreshield scans retrieved content before it reaches the model. Included in all plans."
			/>

			{/* Hero */}
			<section className="relative px-6 py-24 overflow-hidden ambient-glow">
				<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
				<div className="relative mx-auto max-w-4xl text-center">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
						<span className="inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-electric-green mb-6">
							<span className="h-1.5 w-1.5 rounded-full bg-electric-green animate-pulse" />
							RAG Security
						</span>
						<h1 className="text-5xl font-bold tracking-tight md:text-6xl">
							The attack is in your documents. Not your prompts.
						</h1>
						<p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
							Indirect prompt injection, malicious instructions hidden inside content your RAG pipeline retrieves, is one of the most exploited vulnerabilities in production LLM systems. Koreshield catches it before the model acts on it.
						</p>
						<div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
							<Link to="/signup?plan=free" className="inline-flex items-center gap-2 rounded-xl bg-electric-green px-7 py-3 font-semibold text-white transition-colors hover:bg-emerald-500">
								Start for free <ArrowRight className="h-4 w-4" />
							</Link>
							<Link to="/demo" className="inline-flex items-center gap-2 rounded-xl border border-border px-7 py-3 font-semibold transition-colors hover:bg-muted">
								Book a demo
							</Link>
						</div>
					</motion.div>
				</div>
			</section>

			{/* How it works */}
			<section className="px-6 py-20 border-t border-border">
				<div className="mx-auto max-w-5xl">
					<h2 className="text-3xl font-bold tracking-tight mb-3">How Koreshield secures your RAG pipeline</h2>
					<p className="text-muted-foreground mb-12 max-w-xl">RAG scanning runs as part of the proxy flow. No changes to your retrieval architecture.</p>
					<div className="grid gap-8 md:grid-cols-2">
						{howItWorks.map((item, i) => (
							<motion.div
								key={item.title}
								initial={{ opacity: 0, y: 16 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.4, delay: i * 0.07 }}
								className="flex gap-4 rounded-2xl border border-border bg-card p-6"
							>
								<div className="mt-0.5 flex-shrink-0 rounded-xl border border-electric-green/20 bg-electric-green/10 p-2.5">
									{item.icon}
								</div>
								<div>
									<p className="font-semibold">{item.title}</p>
									<p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.body}</p>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Attack vectors */}
			<section className="bg-muted/30 px-6 py-20 border-t border-border">
				<div className="mx-auto max-w-4xl">
					<div className="grid gap-12 md:grid-cols-2 md:items-center">
						<div>
							<h2 className="text-3xl font-bold tracking-tight">Indirect injection vectors Koreshield addresses</h2>
							<p className="mt-4 text-muted-foreground">These attacks bypass user-input validation entirely. They succeed precisely because the malicious content looks like legitimate retrieved data.</p>
						</div>
						<ul className="space-y-4">
							{vectors.map((item, i) => (
								<motion.li
									key={item}
									initial={{ opacity: 0, x: 12 }}
									whileInView={{ opacity: 1, x: 0 }}
									viewport={{ once: true }}
									transition={{ duration: 0.35, delay: i * 0.06 }}
									className="flex items-start gap-3 text-sm"
								>
									<ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-electric-green" />
									<span>{item}</span>
								</motion.li>
							))}
						</ul>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="px-6 py-20 border-t border-border text-center">
				<div className="mx-auto max-w-2xl">
					<h2 className="text-3xl font-bold">RAG scanning is included in every plan.</h2>
					<p className="mt-4 text-muted-foreground">It is not an add-on. It is a core part of what Koreshield does.</p>
					<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
						<Link to="/signup?plan=free" className="inline-flex items-center gap-2 rounded-xl bg-electric-green px-7 py-3 font-semibold text-white transition-colors hover:bg-emerald-500">
							Start for free <ArrowRight className="h-4 w-4" />
						</Link>
						<Link to="/pricing" className="inline-flex items-center gap-2 rounded-xl border border-border px-7 py-3 font-semibold transition-colors hover:bg-muted">
							See all plans
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
