import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight, Cloud, Code2, Shield, Zap } from 'lucide-react';

function FlowArrow() {
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

function Architecture() {
    return (
        <section className="py-28 md:py-36 px-6 bg-muted/30 dark:bg-background transition-colors relative ambient-glow">
            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-foreground tracking-[-0.04em]">
                        How It Works
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        KoreShield sits between your application and LLM providers, analyzing every request in real-time.
                    </p>
                </motion.div>

                {/* 3-column flow — matches RAGShowcase pattern */}
                <div className="flex flex-col lg:grid lg:grid-cols-3 lg:gap-10 lg:items-stretch">
                    {/* Step 1: Your Application */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-card border border-white/[0.08] rounded-xl p-6 relative shadow-sm"
                    >
                        <div className="hidden lg:block"><FlowArrow /></div>
                        <div className="flex items-center gap-3 mb-4 text-blue-500">
                            <Code2 className="w-6 h-6" />
                            <h3 className="font-semibold">1. Your Application</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="p-3 bg-muted/50 rounded border border-white/[0.06] text-sm font-mono text-muted-foreground">
                                <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                                    <Zap className="w-3 h-3" /> Outgoing Request
                                </div>
                                <span className="text-foreground/70">client.chat.completions.create(</span><br />
                                <span className="ml-4 text-foreground/70">model=<span className="text-blue-400">"gpt-4"</span>,</span><br />
                                <span className="ml-4 text-foreground/70">messages=[&#123;...&#125;]</span><br />
                                <span className="text-foreground/70">)</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Drop-in SDK — zero code changes needed.</p>
                        </div>
                    </motion.div>

                    {/* Mobile arrow */}
                    <div className="lg:hidden"><FlowArrow /></div>

                    {/* Step 2: KoreShield Proxy — the "star" card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="relative overflow-visible"
                    >
                        <div className="flex justify-center mb-3">
                            <span className="inline-flex items-center gap-1.5 bg-emerald-600 dark:bg-electric-green text-white font-bold px-5 py-2 text-xs rounded-full uppercase tracking-widest shadow-lg shadow-emerald-600/30 dark:shadow-emerald-500/30 ring-2 ring-emerald-600/20 dark:ring-emerald-400/20">
                                <Shield className="w-3.5 h-3.5" />
                                KoreShield Proxy
                            </span>
                        </div>

                        <div className="bg-card border-2 border-electric-green/20 rounded-xl p-6 md:p-8 relative shadow-lg shadow-emerald-500/10">
                            <div className="hidden lg:block"><FlowArrow /></div>

                            <div className="flex flex-col items-center text-center gap-3 mb-5">
                                <div className="w-14 h-14 bg-electric-green/10 rounded-full flex items-center justify-center animate-pulse">
                                    <Shield className="w-7 h-7 text-electric-green" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">Real-time Analysis</h3>
                                    <p className="text-sm text-muted-foreground">Every request scanned in &lt;30ms</p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                {['Sanitization', 'Attack Detection', 'Policy Engine', 'Audit Logging'].map((item) => (
                                    <div key={item} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/50 border border-white/[0.04]">
                                        <div className="w-2 h-2 bg-electric-green rounded-full status-dot-glow shrink-0" />
                                        <span className="text-muted-foreground">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Mobile arrow */}
                    <div className="lg:hidden"><FlowArrow /></div>

                    {/* Step 3: LLM Providers */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="bg-card border border-white/[0.08] rounded-xl p-6 shadow-sm"
                    >
                        <div className="flex items-center gap-3 mb-4 text-purple-500">
                            <Cloud className="w-6 h-6" />
                            <h3 className="font-semibold">3. LLM Providers</h3>
                        </div>
                        <div className="space-y-2">
                            {['OpenAI', 'Anthropic', 'Gemini', 'DeepSeek'].map((provider) => (
                                <div key={provider} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-muted/50 border border-white/[0.04]">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full shrink-0" />
                                    <span className="text-sm text-foreground/80 font-medium">{provider}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">Safe, sanitized requests reach your LLMs.</p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

export default Architecture;
