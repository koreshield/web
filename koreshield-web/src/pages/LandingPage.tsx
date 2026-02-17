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

import { SEOMeta } from '../components/SEOMeta';

function LandingPage() {
    return (
        <div className="bg-background text-foreground">
            <SEOMeta />
            <Hero />

            <ErrorBoundary fallback={<div className="h-20 bg-muted/50" />}>
                <IntegrationTicker />
            </ErrorBoundary>

            <section className="py-24 md:py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 tracking-tighter">Live Threat Intelligence</h2>
                    <p className="text-center text-muted-foreground mb-14 max-w-2xl mx-auto">Watch KoreShield defend against real attack patterns in real-time. Every blocked threat below is a simulated production scenario.</p>
                    <ErrorBoundary fallback={<div className="h-64 bg-muted/20 border border-border rounded-lg text-center p-8">Unable to load dashboard</div>}>
                        <ThreatDashboard />
                    </ErrorBoundary>
                </div>
            </section>

            <section className="py-24 md:py-32 px-6 bg-muted/30">
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
        </div>
    );
}

export default LandingPage;
