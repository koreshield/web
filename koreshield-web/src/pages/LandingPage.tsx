import Hero from '../components/Hero';
import Architecture from '../components/Architecture';
import Features from '../components/Features';
import IntegrationCode from '../components/IntegrationCode';
import UseCases from '../components/UseCases';
import { ThreatDashboard } from '../components/ThreatDashboard';
import { InteractiveDemo } from '../components/InteractiveDemo';

import { SEOMeta } from '../components/SEOMeta';

function LandingPage() {
    return (
        <div className="bg-background text-foreground">
            <SEOMeta />
            <Hero />

            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">Live Threat Intelligence</h2>
                    <ThreatDashboard />
                </div>
            </section>

            <section className="py-20 px-6 bg-muted/30">
                <div className="max-w-7xl mx-auto">
                    <InteractiveDemo />
                </div>
            </section>

            <Architecture />
            <Features />
            <IntegrationCode />
            <UseCases />
        </div>
    );
}

export default LandingPage;
