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
import { ArrowRight, CheckCircle2, Copy, ShieldCheck, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const quickStartCommands = [
    { label: 'Python', command: 'pip install koreshield' },
    { label: 'Node.js', command: 'npm install koreshield' },
];

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
                                        <Copy className="h-4 w-4 text-muted-foreground" />
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

            <section className="relative overflow-hidden bg-background px-6 py-24 ambient-glow md:py-32">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric-green/40 to-transparent" />
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-electric-green/10 blur-3xl" />
                <div className="relative z-10 mx-auto max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="rounded-[2rem] border border-white/[0.08] bg-card/80 p-8 text-center shadow-2xl shadow-emerald-500/5 md:p-12"
                    >
                        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-electric-green/20 bg-electric-green/10">
                            <ShieldCheck className="h-7 w-7 text-electric-green" />
                        </div>
                        <h2 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-[-0.04em] text-foreground md:text-6xl">
                            Put a security layer in front of your AI.
                        </h2>
                        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                            Start with the proxy, prove the controls in your logs, and expand into RAG, agents, and compliance evidence when you are ready.
                        </p>
                        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link
                                to="/signup?plan=free"
                                className="inline-flex items-center gap-2 rounded-xl bg-electric-green px-7 py-3 font-bold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-bright"
                            >
                                Start for free <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                to="/demo"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-background/60 px-7 py-3 font-bold text-foreground transition-colors hover:border-electric-green/30 hover:bg-muted"
                            >
                                Book a demo
                            </Link>
                            <Link
                                to="/solutions/rag-security"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-background/60 px-7 py-3 font-bold text-foreground transition-colors hover:border-electric-green/30 hover:bg-muted"
                            >
                                Explore RAG security
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}

export default LandingPage;
