import { motion } from 'framer-motion';
import { Activity, Database, Globe, Network, Shield, Users } from 'lucide-react';

const features = [
    {
        icon: Shield,
        title: '95% Accuracy',
        description: 'Industry-leading detection rate with <3% false positives.',
    },
    {
        icon: Database,
        title: 'RAG Defense',
        description: 'Scan retrieved context (docs, emails) for indirect prompt injection attacks.',
    },
    {
        icon: Network,
        title: 'Multi-Provider',
        description: 'Unified security for OpenAI, Anthropic, Gemini, and DeepSeek.',
    },
    {
        icon: Globe,
        title: 'CRM Integrations',
        description: 'Secure Salesforce, HubSpot, and Zendesk data pipelines out-of-the-box.',
    },
    {
        icon: Users,
        title: 'Tenant Isolation',
        description: 'Built for SaaS. Separate quotas, RBAC, and policies per tenant.',
    },
    {
        icon: Activity,
        title: 'Real-time Monitoring',
        description: 'Detect jailbreaks ("DAN mode"), PII leakage, and code injection instantly.',
    },
];

function Features() {
    return (
    		<section className="py-20 px-6 bg-muted/30 transition-colors">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
    					<h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                        Key <span className="text-electric-green">Features</span>
                    </h2>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -5, borderColor: '#10b981' }}
                                className="bg-card border border-border rounded-lg p-6 transition-all duration-300 group shadow-sm"
                        >
                                <div className="bg-electric-green/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-electric-green/20 transition-colors">
                                <feature.icon className="w-6 h-6 text-electric-green" />
                            </div>
                                <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Features;
