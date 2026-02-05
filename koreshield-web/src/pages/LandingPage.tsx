import Hero from '../components/Hero';
import { ErrorBoundary } from '../components/ErrorBoundary';
import Architecture from '../components/Architecture';
import Features from '../components/Features';
import IntegrationCode from '../components/IntegrationCode';
import UseCases from '../components/UseCases';
import { ThreatDashboard } from '../components/ThreatDashboard';
import { InteractiveDemo } from '../components/InteractiveDemo';
import { RAGShowcase } from '../components/RAGShowcase';
import { IntegrationTicker } from '../components/IntegrationTicker';
import { TrustBadges } from '../components/TrustBadges';

import { SEOMeta } from '../components/SEOMeta';

function LandingPage() {
    return (
        <div className="bg-background text-foreground">
            <SEOMeta />
            <Hero />

            <ErrorBoundary fallback={<div className="h-20 bg-black/50" />}>
                <IntegrationTicker />
            </ErrorBoundary>

            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">Live Threat Intelligence</h2>
                    <ErrorBoundary fallback={<div className="h-64 bg-muted/20 border border-border rounded-lg text-center p-8">Unable to load dashboard</div>}>
                        <ThreatDashboard />
                    </ErrorBoundary>
                </div>
            </section>

            <section className="py-20 px-6 bg-muted/30">
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
