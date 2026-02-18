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

import { ArrowRight } from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';

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
                <div className="max-w-3xl mx-auto text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-extrabold tracking-[-0.04em] text-foreground mb-6">
                        Ready to Get Started?
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
                        Deploy KoreShield in under 5 minutes. Protect every LLM request from day one.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href="https://docs.koreshield.com"
                            target="_blank"
                            rel="noreferrer"
                            className="group relative bg-electric-green hover:bg-emerald-bright text-white font-bold px-8 py-4 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg shadow-emerald-500/20 overflow-hidden"
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-0 animate-shimmer" />
                            <span className="relative z-10 flex items-center gap-2">
                                Start Building
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </a>
                        <span className="text-sm text-muted-foreground font-mono">pip install koreshield</span>
                        <span className="text-sm text-muted-foreground">or</span>
                        <span className="text-sm text-muted-foreground font-mono">npm install koreshield</span>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default LandingPage;
