import { motion } from 'framer-motion';
import { Activity, Database, Globe, Network, Shield, FileText } from 'lucide-react';

const features = [
    {
        icon: Shield,
        title: '95% Detection Accuracy',
        description: 'Fewer than 3 false positives per 100 blocked requests. Tuned on millions of real-world attack attempts  -  not synthetic test data  -  so it catches what matters without crying wolf.',
        highlight: true,
    },
    {
        icon: Network,
        title: 'Multi-Provider',
        description: 'One SDK, one API key, full coverage across OpenAI, Anthropic, Gemini, and DeepSeek. Switch providers without touching your security layer.',
        highlight: false,
    },
    {
        icon: Database,
        title: 'RAG Defense',
        description: 'Scans every document in your retrieval context before it reaches the LLM  -  catching injected instructions your vector database doesn\'t know to look for.',
        highlight: false,
    },
    {
        icon: Globe,
        title: 'CRM Integrations',
        description: 'Pre-built connectors for Salesforce, HubSpot, and Zendesk. Secure your CRM-to-LLM pipelines without writing custom data extraction logic.',
        highlight: false,
    },
    {
        icon: FileText,
        title: 'Audit Trails',
        description: 'Every scan, every block, every decision  -  logged with full context. Query your threat history, or export to your SIEM in one command.',
        highlight: false,
    },
    {
        icon: Activity,
        title: 'Real-time Monitoring',
        description: 'Sub-30ms interception with no perceptible latency overhead. Threats appear in your dashboard the moment they\'re detected  -  not after the fact.',
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
                        What KoreShield Catches Before Your LLM Does
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        50+ attack detection patterns, tuned on real production traffic  -  not just benchmark datasets.
                    </p>
                </motion.div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Hero card  -  95% Accuracy  -  spans 2 cols */}
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

                    {/* Multi-Provider  -  1 col */}
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

                    {/* Bottom row  -  3 equal cards */}
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
