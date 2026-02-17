import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

function Architecture() {
        return (
		<section className="py-20 px-6 bg-background transition-colors">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                        How It <span className="text-electric-green">Works</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        koreshield sits between your application and llm providers, analyzing every request in real-time
                    </p>
                </motion.div>

                {/* Flow diagram */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="flex items-center justify-center gap-4 flex-wrap"
                >
                    {/* Client App */}
                    <div className="bg-card border border-border rounded-lg px-8 py-6 text-center hover:border-electric-green transition-all duration-300 shadow-sm">
                        <div className="text-2xl font-bold mb-2 text-foreground">Client App</div>
                        <div className="text-muted-foreground text-sm">Your application</div>
                    </div>

                    <ArrowRight className="w-8 h-8 text-electric-green hidden md:block" />

                    {/* KoreShield Proxy */}
                    <div className="bg-card border-2 border-electric-green rounded-lg px-8 py-6 text-center shadow-lg shadow-emerald-500/10 glow-green">
                        <div className="text-2xl font-bold mb-2 text-electric-green">KoreShield Proxy</div>
                        <div className="text-muted-foreground text-sm space-y-1 mt-3">
                            <div className="flex items-center gap-2 justify-center">
                                <div className="w-2 h-2 bg-electric-green rounded-full"></div>
                                <span>Sanitization</span>
                            </div>
                            <div className="flex items-center gap-2 justify-center">
                                <div className="w-2 h-2 bg-electric-green rounded-full"></div>
                                <span>Attack Detection</span>
                            </div>
                            <div className="flex items-center gap-2 justify-center">
                                <div className="w-2 h-2 bg-electric-green rounded-full"></div>
                                <span>Policy Engine</span>
                            </div>
                            <div className="flex items-center gap-2 justify-center">
                                <div className="w-2 h-2 bg-electric-green rounded-full"></div>
                                <span>Audit Logging</span>
                            </div>
                        </div>
                    </div>

                    <ArrowRight className="w-8 h-8 text-electric-green hidden md:block" />

                    {/* LLM Providers */}
                    <div className="bg-card border border-border rounded-lg px-8 py-6 text-center hover:border-electric-green transition-all duration-300 shadow-sm">
                        <div className="text-2xl font-bold mb-2 text-foreground">LLM Providers</div>
                        <div className="text-muted-foreground text-sm space-y-1">
                            <div>OpenAI</div>
                            <div>Anthropic</div>
                            <div>DeepSeek</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

export default Architecture;
