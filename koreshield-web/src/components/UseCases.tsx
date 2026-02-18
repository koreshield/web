import { motion } from 'framer-motion';
import { Building2, DollarSign, HeartPulse } from 'lucide-react';

const useCases = [
    {
        icon: DollarSign,
        title: 'Fintech',
        description: 'Block data exfiltration and ensure PCI-DSS compliance.',
    },
    {
        icon: HeartPulse,
        title: 'Healthcare',
        description: 'Redact PII/PHI automatically to meet HIPAA standards.',
    },
    {
        icon: Building2,
        title: 'Enterprise SaaS',
        description: 'Prevent cross-tenant leakage in multi-user AI apps.',
    },
];

function UseCases() {
    return (
        <section className="py-28 md:py-36 px-6 bg-muted/30 dark:bg-muted/20 transition-colors">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-foreground tracking-[-0.04em]">
                        Trusted by Industries
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Purpose-built security for regulated and high-stakes environments.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6">
                    {useCases.map((useCase, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.15 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -4 }}
                            className="bg-card border border-white/[0.08] rounded-2xl p-8 hover:border-electric-green/30 transition-all duration-300 group shadow-sm hover:shadow-lg hover:shadow-emerald-500/5"
                        >
                            <div className="bg-electric-green/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-electric-green/20 transition-colors">
                                <useCase.icon className="w-7 h-7 text-electric-green" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-foreground tracking-tight">{useCase.title}</h3>
                            <p className="text-muted-foreground text-lg leading-relaxed">{useCase.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default UseCases;
