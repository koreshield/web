import { motion } from 'framer-motion';
import { Activity, Database, Globe, Network, Shield, Users } from 'lucide-react';

const features = [
    {
        icon: Shield,
        title: '95% Accuracy',
        description: 'Industry-leading detection rate with <3% false positives. Battle-tested across millions of production requests.',
        highlight: true, // Bento: takes 2/3 width
    },
    {
        icon: Network,
        title: 'Multi-Provider',
        description: 'Unified security for OpenAI, Anthropic, Gemini, and DeepSeek.',
        highlight: false,
    },
    {
        icon: Database,
        title: 'RAG Defense',
        description: 'Scan retrieved context for indirect prompt injection attacks before they reach the LLM.',
        highlight: false,
    },
    {
        icon: Globe,
        title: 'CRM Integrations',
        description: 'Secure Salesforce, HubSpot, and Zendesk data pipelines out-of-the-box.',
        highlight: false,
    },
    {
        icon: Users,
        title: 'Tenant Isolation',
        description: 'Built for SaaS. Separate quotas, RBAC, and policies per tenant.',
        highlight: false,
    },
    {
        icon: Activity,
        title: 'Real-time Monitoring',
        description: 'Detect jailbreaks, PII leakage, and code injection instantly with sub-30ms latency.',
        highlight: false,
    },
];

function Features() {
    return (
        <section className="py-28 md:py-36 px-6 bg-background transition-colors relative ambient-glow">
            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-foreground tracking-[-0.04em]">
                        Key Features
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Enterprise-grade security primitives, designed to drop into any LLM workflow.
                    </p>
                </motion.div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Hero card — 95% Accuracy — spans 2 cols */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -4 }}
                        className="md:col-span-2 bg-card border border-white/[0.08] rounded-2xl p-8 transition-all duration-300 group shadow-sm hover:border-electric-green/30 hover:shadow-lg hover:shadow-emerald-500/5 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-electric-green/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="bg-electric-green/10 w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:bg-electric-green/20 transition-colors">
                                <Shield className="w-6 h-6 text-electric-green" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-foreground tracking-tight">{features[0].title}</h3>
                            <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">{features[0].description}</p>
                        </div>
                    </motion.div>

                    {/* Multi-Provider — 1 col */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -4 }}
                        className="bg-card border border-white/[0.08] rounded-2xl p-8 transition-all duration-300 group shadow-sm hover:border-electric-green/30 hover:shadow-lg hover:shadow-emerald-500/5"
                    >
                        <div className="bg-electric-green/10 w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:bg-electric-green/20 transition-colors">
                            <Network className="w-6 h-6 text-electric-green" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-foreground tracking-tight">{features[1].title}</h3>
                        <p className="text-muted-foreground">{features[1].description}</p>
                    </motion.div>

                    {/* Bottom row — 3 equal cards */}
                    {features.slice(2).map((feature, index) => (
                        <motion.div
                            key={index + 2}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: (index + 2) * 0.1 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -4 }}
                            className="bg-card border border-white/[0.08] rounded-2xl p-8 transition-all duration-300 group shadow-sm hover:border-electric-green/30 hover:shadow-lg hover:shadow-emerald-500/5"
                        >
                            <div className="bg-electric-green/10 w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:bg-electric-green/20 transition-colors">
                                <feature.icon className="w-6 h-6 text-electric-green" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-foreground tracking-tight">{feature.title}</h3>
                            <p className="text-muted-foreground">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Features;
