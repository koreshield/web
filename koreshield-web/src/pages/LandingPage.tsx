import Architecture from '../components/Architecture';
import { ErrorBoundary } from '../components/ErrorBoundary';
import Features from '../components/Features';
import Hero from '../components/Hero';
import IntegrationCode from '../components/IntegrationCode';
import { IntegrationTicker } from '../components/IntegrationTicker';
import { InteractiveDemo } from '../components/InteractiveDemo';
import { RAGShowcase } from '../components/RAGShowcase';
import { ThreatDashboard } from '../components/ThreatDashboard';
import { TrustBadges } from '../components/TrustBadges';
import UseCases from '../components/UseCases';

import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight, CheckCircle2, Rocket, Settings, Terminal } from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';

function CTAFlowArrow() {
    return (
        <>
            <div className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-10 h-10 rounded-full bg-muted border border-white/[0.08] shadow-sm">
                <ArrowRight className="text-electric-green w-5 h-5" />
            </div>
            <div className="flex lg:hidden justify-center py-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted border border-white/[0.08] shadow-sm">
                    <ArrowDown className="text-electric-green w-5 h-5" />
                </div>
            </div>
        </>
    );
}

function LandingPage() {
    return (
        <div className="bg-background text-foreground">
            <SEOMeta />
            <Hero />

            <ErrorBoundary fallback={<div className="h-20 bg-muted/50" />}>
                <IntegrationTicker />
            </ErrorBoundary>

            <section className="py-28 md:py-36 px-6 relative ambient-glow">
                <div className="max-w-7xl mx-auto relative z-10">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 tracking-[-0.04em]">Live Threat Intelligence</h2>
                    <p className="text-center text-muted-foreground mb-14 max-w-2xl mx-auto">Watch KoreShield defend against real attack patterns in real-time. Every blocked threat below is a simulated production scenario.</p>
                    <ErrorBoundary fallback={<div className="h-64 bg-muted/20 border border-white/[0.08] rounded-2xl text-center p-8">Unable to load dashboard</div>}>
                        <ThreatDashboard />
                    </ErrorBoundary>
                </div>
            </section>

            <section className="py-28 md:py-36 px-6 bg-muted/30 dark:bg-muted/20">
                <div className="max-w-7xl mx-auto">
                    <ErrorBoundary fallback={null}>
                        <InteractiveDemo />
                    </ErrorBoundary>
                </div>
            </section>

            <ErrorBoundary fallback={null}>
                <RAGShowcase />
            </ErrorBoundary>

            <Architecture />
            <Features />

            <ErrorBoundary fallback={null}>
                <IntegrationCode />
            </ErrorBoundary>

            <TrustBadges />
            <UseCases />

            {/* — CTA Section — */}
            <section className="py-32 md:py-44 px-6 bg-background relative overflow-hidden ambient-glow">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-electric-green/[0.02] to-transparent pointer-events-none" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-6xl font-extrabold tracking-[-0.04em] text-foreground mb-6">
                            Ready to Get Started?
                        </h2>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                            Deploy KoreShield in under 5 minutes. Protect every LLM request from day one.
                        </p>
                    </motion.div>

                    {/* 3-column flow */}
                    <div className="flex flex-col lg:grid lg:grid-cols-3 lg:gap-10 lg:items-center">

                        {/* Step 1: Install */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-card border border-white/[0.08] rounded-xl p-6 relative shadow-sm lg:self-center w-full"
                        >
                            <div className="hidden lg:block"><CTAFlowArrow /></div>
                            <div className="flex items-center gap-3 mb-4 text-blue-500">
                                <Terminal className="w-6 h-6" />
                                <h3 className="font-semibold">1. Install</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="p-3 bg-muted/50 rounded border border-white/[0.06] text-sm font-mono text-muted-foreground">
                                    <span className="text-electric-green">$</span> pip install koreshield
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>or</span>
                                </div>
                                <div className="p-3 bg-muted/50 rounded border border-white/[0.06] text-sm font-mono text-muted-foreground">
                                    <span className="text-electric-green">$</span> npm install koreshield
                                </div>
                                <p className="text-xs text-muted-foreground">Works with Python &amp; Node.js out of the box.</p>
                            </div>
                        </motion.div>

                        {/* Mobile arrow */}
                        <div className="lg:hidden"><CTAFlowArrow /></div>

                        {/* Step 2: Configure — star card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="relative overflow-visible"
                        >
                            <div className="flex justify-center mb-3">
                                <span className="inline-flex items-center gap-1.5 bg-emerald-600 dark:bg-electric-green text-white font-bold px-5 py-2 text-xs rounded-full uppercase tracking-widest shadow-lg shadow-emerald-600/30 dark:shadow-emerald-500/30 ring-2 ring-emerald-600/20 dark:ring-emerald-400/20">
                                    <Settings className="w-3.5 h-3.5" />
                                    Quick Setup
                                </span>
                            </div>

                            <div className="bg-card border-2 border-electric-green/20 rounded-xl p-6 md:p-8 relative shadow-lg shadow-emerald-500/10">
                                <div className="hidden lg:block"><CTAFlowArrow /></div>

                                <div className="flex flex-col items-center text-center gap-3 mb-5">
                                    <div className="w-14 h-14 bg-electric-green/10 rounded-full flex items-center justify-center">
                                        <Settings className="w-7 h-7 text-electric-green" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground">2. Configure</h3>
                                        <p className="text-sm text-muted-foreground">Point to your provider, set policies</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {/* config.yaml — provider selection */}
                                    <div className="p-3 bg-muted/50 rounded border border-white/[0.06] text-xs font-mono text-muted-foreground leading-relaxed">
                                        <div className="text-muted-foreground/50 mb-1"># config.yaml</div>
                                        <div><span className="text-blue-400">providers</span>:</div>
                                        <div className="ml-4"><span className="text-blue-400">openai</span>:</div>
                                        <div className="ml-8">enabled: <span className="text-electric-green">true</span></div>
                                        <div className="ml-8">base_url: <span className="text-electric-green">"https://api.openai.com/v1"</span></div>
                                        <div className="ml-4"><span className="text-blue-400">anthropic</span>:</div>
                                        <div className="ml-8">enabled: <span className="text-electric-green">true</span></div>
                                        <div className="ml-8">base_url: <span className="text-electric-green">"https://api.anthropic.com/v1"</span></div>
                                    </div>

                                    {/* SDK usage */}
                                    <div className="p-3 bg-muted/50 rounded border border-white/[0.06] text-xs font-mono text-muted-foreground leading-relaxed">
                                        <div><span className="text-purple-400">from</span> koreshield <span className="text-purple-400">import</span> KoreShieldClient</div>
                                        <div className="mt-1.5">client = KoreShieldClient(</div>
                                        <div className="ml-4">api_key=<span className="text-electric-green">"your-key"</span>,</div>
                                        <div className="ml-4">base_url=<span className="text-electric-green">"https://api.koreshield.com"</span></div>
                                        <div>)</div>
                                        <div className="mt-1.5 text-muted-foreground/50"># Scan before sending to LLM</div>
                                        <div>result = client.scan_prompt(<span className="text-electric-green">"Summarize emails"</span>)</div>
                                        <div><span className="text-purple-400">if</span> result.is_safe:</div>
                                        <div className="ml-4"><span className="text-muted-foreground/50"># Safe to forward to provider</span></div>
                                        <div className="ml-4">response = openai.chat.completions.create(...)</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Mobile arrow */}
                        <div className="lg:hidden"><CTAFlowArrow /></div>

                        {/* Step 3: Protected */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                            className="bg-card border border-white/[0.08] rounded-xl p-6 shadow-sm lg:self-center w-full"
                        >
                            <div className="flex items-center gap-3 mb-4 text-electric-green">
                                <CheckCircle2 className="w-6 h-6" />
                                <h3 className="font-semibold">3. Protected</h3>
                            </div>
                            <div className="space-y-2 mb-4">
                                {['Prompt injection blocked', 'PII automatically redacted', 'Requests audited & logged', 'Policies enforced'].map((item) => (
                                    <div key={item} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/50 border border-white/[0.04]">
                                        <div className="w-2 h-2 bg-electric-green rounded-full status-dot-glow shrink-0" />
                                        <span className="text-sm text-muted-foreground">{item}</span>
                                    </div>
                                ))}
                            </div>
                            <a
                                href="https://docs.koreshield.com"
                                target="_blank"
                                rel="noreferrer"
                                className="group relative w-full inline-flex items-center justify-center gap-2 bg-electric-green hover:bg-emerald-bright text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 shadow-lg shadow-emerald-500/20 overflow-hidden"
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-0 animate-shimmer" />
                                <Rocket className="w-4 h-4 relative z-10" />
                                <span className="relative z-10">Start Building</span>
                                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                            </a>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default LandingPage;
