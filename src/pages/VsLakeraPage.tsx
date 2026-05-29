import { motion } from 'framer-motion';
import { ArrowRight, Cloud, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const rows = [
	['Primary shape', 'Runtime proxy and evidence layer', 'Commercial prompt-security API/platform'],
	['Good fit', 'Teams that want policy, audit evidence, and provider routing in one layer', 'Teams that want a managed vendor API for prompt defense'],
	['Architecture question', 'Where should enforcement and evidence live?', 'How much do you want delegated to a vendor API?'],
	['RAG and agents', 'Positioned around retrieved context, tool output, tenant context, and audit logs', 'Evaluate current vendor coverage against your exact workflow'],
	['Decision lens', 'Operational control and evidence', 'Managed platform convenience'],
];

export default function VsLakeraPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="Koreshield vs Lakera Guard"
				description="Compare Koreshield and Lakera Guard by deployment model, operating model, RAG coverage, and governance needs."
			/>

			<section className="relative overflow-hidden px-6 py-24 ambient-glow md:py-32">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.1),transparent_24%)]" />
				<div className="relative mx-auto max-w-5xl text-center">
					<motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
						<span className="mb-6 inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-electric-green">
							<ShieldCheck className="h-3.5 w-3.5" />
							Comparison
						</span>
						<h1 className="text-5xl font-extrabold tracking-[-0.055em] md:text-7xl">Koreshield vs Lakera Guard</h1>
						<p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
							Both live in the AI security category. The choice is less about slogans and more about where you want enforcement, evidence, and operational control to sit.
						</p>
						<p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Last reviewed May 2026</p>
					</motion.div>
				</div>
			</section>

			<section className="border-y border-border bg-card/35 px-6 py-20">
				<div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
					<div className="rounded-[2rem] border border-electric-green/25 bg-electric-green/10 p-7 shadow-sm">
						<ShieldCheck className="mb-5 h-8 w-8 text-electric-green" />
						<h2 className="text-3xl font-extrabold tracking-[-0.04em]">Koreshield</h2>
						<p className="mt-3 text-sm leading-relaxed text-muted-foreground">Built around runtime proxy protection, provider routing, RAG/context scanning, policy decisions, alerts, and audit evidence.</p>
					</div>
					<div className="rounded-[2rem] border border-border bg-card/90 p-7 shadow-sm">
						<Cloud className="mb-5 h-8 w-8 text-electric-green" />
						<h2 className="text-3xl font-extrabold tracking-[-0.04em]">Lakera Guard</h2>
						<p className="mt-3 text-sm leading-relaxed text-muted-foreground">A commercial AI security product to evaluate if you want a managed vendor option for prompt and model protection.</p>
					</div>
				</div>
			</section>

			<section className="px-6 py-20">
				<div className="mx-auto overflow-hidden rounded-[2rem] border border-border bg-card/90 shadow-sm">
					{rows.map(([label, koreshield, competitor]) => (
						<div key={label} className="grid gap-4 border-b border-border p-5 last:border-b-0 md:grid-cols-[0.7fr_1fr_1fr] md:items-center">
							<p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
							<p className="rounded-2xl bg-electric-green/10 px-4 py-3 text-sm font-semibold">{koreshield}</p>
							<p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">{competitor}</p>
						</div>
					))}
				</div>
			</section>

			<section className="border-t border-border px-6 py-20">
				<div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-[2rem] border border-border bg-card/85 p-7 shadow-sm md:flex-row md:items-center md:justify-between">
					<div>
						<h2 className="text-3xl font-extrabold tracking-[-0.03em]">Ask the architecture question first.</h2>
						<p className="mt-2 text-sm text-muted-foreground">Where will policy, tenant context, and audit evidence live in your AI stack?</p>
					</div>
					<Link to="/demo" className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric-green px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-bright">
						Compare with us <ArrowRight className="h-4 w-4" />
					</Link>
				</div>
			</section>
		</div>
	);
}
