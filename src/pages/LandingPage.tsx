import Architecture from '../components/Architecture';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { EcosystemProof } from '../components/EcosystemProof';
import Features from '../components/Features';
import Hero from '../components/Hero';
import { IntegrationTicker } from '../components/IntegrationTicker';
import { ProductExtensions } from '../components/ProductExtensions';
import { StatsBanner } from '../components/StatsBanner';
import { ThreatDashboard } from '../components/ThreatDashboard';
import { TrustBadges } from '../components/TrustBadges';
import UseCases from '../components/UseCases';

import { motion } from 'framer-motion';
import { ArrowRight, Check, CheckCircle2, Cloud, Copy, Lock, Server, Terminal } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const quickStartCommands = [
    { label: 'Python', command: 'pip install koreshield' },
    { label: 'Node.js', command: 'npm install koreshield' },
];

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            type="button"
            aria-label="Copy to clipboard"
            onClick={() => {
                navigator.clipboard.writeText(text).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                });
            }}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
        >
            {copied ? <Check className="h-4 w-4 text-electric-green" /> : <Copy className="h-4 w-4" />}
        </button>
    );
}

function LandingPage() {
    return (
        <div className="bg-background text-foreground">
            <SEOMeta />
            <Hero />

            <EcosystemProof />

            <ErrorBoundary fallback={<div className="h-20 bg-muted/50" />}>
                <IntegrationTicker />
            </ErrorBoundary>

            <section className="py-28 md:py-36 px-6 relative ambient-glow">
                <div className="max-w-7xl mx-auto relative z-10">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 tracking-[-0.04em]">Threats Blocked. Right Now.</h2>
                    <p className="text-center text-muted-foreground mb-14 max-w-2xl mx-auto">Watch Koreshield intercept real attack patterns as they happen. These are the same threats hitting production AI systems today: classified, scored, and stopped.</p>
                    <ErrorBoundary fallback={<div className="h-64 bg-muted/20 border border-white/[0.08] rounded-2xl text-center p-8">Unable to load dashboard</div>}>
                        <ThreatDashboard />
                    </ErrorBoundary>
                </div>
            </section>

            <StatsBanner />

            <Architecture />

            <section className="relative overflow-hidden border-y border-white/[0.06] bg-card/30 px-6 py-20">
                <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12),transparent_55%)]" />
                <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-electric-green">
                            <Terminal className="h-3.5 w-3.5" />
                            Installation
                        </div>
                        <h2 className="max-w-2xl text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">
                            Start with one package, not a platform migration.
                        </h2>
                        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                            Works with the SDKs you already use. Add the client, point requests through Koreshield, and keep your provider choices open.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.08 }}
                        className="rounded-[1.75rem] border border-white/[0.08] bg-background/70 p-5 shadow-2xl shadow-emerald-500/5"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-electric-green/10">
                                    <Terminal className="h-4 w-4 text-electric-green" />
                                </span>
                                Choose your runtime
                            </div>
                            <span className="rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-electric-green">
                                Python + Node
                            </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {quickStartCommands.map((item) => (
                                <div key={item.label} className="rounded-2xl border border-white/[0.08] bg-card/80 p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-sm font-bold text-foreground">{item.label}</span>
                                        <CopyButton text={item.command} />
                                    </div>
                                    <code className="block overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 px-3 py-3 text-sm text-muted-foreground">
                                        <span className="text-electric-green">$</span> {item.command}
                                    </code>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                            {['API key auth', 'Provider routing', 'Audit events'].map((item) => (
                                <div key={item} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-card/60 px-3 py-2">
                                    <CheckCircle2 className="h-4 w-4 text-electric-green" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            <Features />
            <ProductExtensions />

            <TrustBadges />
            <UseCases />

            <section className="relative overflow-hidden border-y border-white/[0.06] bg-background px-4 py-24 sm:px-6 md:py-32">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.08),transparent_28rem)]" />
                <div className="relative mx-auto max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="mx-auto mb-14 max-w-3xl text-center"
                    >
                        <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-electric-green">Deploy Anywhere</p>
                        <h2 className="mb-5 text-4xl font-extrabold tracking-[-0.04em] text-foreground md:text-5xl">
                            Your infrastructure. Your rules.
                        </h2>
                        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                            Run Koreshield in our managed cloud, on your own servers, or in fully air-gapped environments with no internet access. Enterprise licence validation is offline — no phone-home, ever.
                        </p>
                    </motion.div>

                    <div className="grid gap-5 md:grid-cols-3">
                        {[
                            {
                                icon: <Cloud className="h-6 w-6 text-blue-400" />,
                                title: 'Managed Cloud',
                                desc: 'Zero infrastructure to manage. We handle scaling, updates, and availability.',
                                chips: ['Auto-scaling', 'Global edge', 'Zero maintenance'],
                                border: 'border-blue-400/20',
                            },
                            {
                                icon: <Server className="h-6 w-6 text-electric-green" />,
                                title: 'Self-Hosted',
                                desc: 'Deploy on your own VPC or data centre with a signed Enterprise licence.',
                                chips: ['Data residency', 'VPC / on-prem', 'Docker Compose'],
                                border: 'border-electric-green/20',
                            },
                            {
                                icon: <Lock className="h-6 w-6 text-amber-400" />,
                                title: 'Air-Gapped',
                                desc: 'No outbound internet. Offline licence validation, bundled threat corpus, local-only operation.',
                                chips: ['Offline licence', 'Bundled corpus', 'No phone-home'],
                                border: 'border-amber-400/20',
                            },
                        ].map((option) => (
                            <motion.div
                                key={option.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                viewport={{ once: true }}
                                className={`group relative overflow-hidden rounded-[2rem] border ${option.border} bg-card/70 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-card lg:p-8`}
                            >
                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                                    {option.icon}
                                </div>
                                <h3 className="mb-3 text-xl font-black tracking-[-0.035em] text-foreground">{option.title}</h3>
                                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{option.desc}</p>
                                <div className="flex flex-wrap gap-2">
                                    {option.chips.map((chip) => (
                                        <span key={chip} className="rounded-full border border-white/[0.08] bg-background/60 px-3 py-1.5 text-xs font-semibold text-foreground/80">
                                            {chip}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-10 text-center">
                        <Link
                            to="/docs/integrations/deployment/self-hosted"
                            className="inline-flex items-center gap-2 text-sm font-bold text-electric-green transition-colors hover:text-emerald-bright"
                        >
                            Read the self-hosted deployment guide <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>

            <section className="border-t border-white/[0.08] bg-background px-6 py-14">
                <div className="mx-auto max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="flex flex-col gap-5 rounded-[1.75rem] border border-white/[0.08] bg-card/70 p-6 shadow-sm md:flex-row md:items-center md:justify-between md:p-8"
                    >
                        <div>
                            <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-foreground md:text-3xl">
                                Ready to put Koreshield in the path?
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                                Start free, or walk through your AI stack with us.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Link
                                to="/signup?plan=free"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric-green px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-bright"
                            >
                                Start for free <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                to="/demo"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-background/60 px-6 py-3 text-sm font-bold text-foreground transition-colors hover:border-electric-green/30 hover:bg-muted"
                            >
                                Book a demo
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}

export default LandingPage;
