import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight, Cloud, Code2, Zap } from 'lucide-react';
function FlowArrow({ branded = false }: { branded?: boolean }) {
    return (
        <>
            <div className="hidden lg:flex h-full min-w-16 items-center justify-center relative">
                <div className="relative flex w-full items-center justify-center">
                    <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-gradient-to-r from-transparent via-electric-green/30 to-transparent" />
                    {/* Flowing particle */}
                    <motion.div
                        className="absolute h-[3px] w-8 rounded-full bg-gradient-to-r from-transparent via-electric-green to-transparent"
                        style={{ top: 'calc(50% - 1.5px)' }}
                        animate={{ x: [-40, 40] }}
                        transition={{
                            ease: "linear",
                            duration: 2,
                            repeat: Infinity,
                        }}
                    />
                    <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-electric-green/25 bg-background shadow-lg shadow-emerald-500/10">
                        {branded ? (
                            <>
                                <img src="/logo/dark/SVG/Black.svg" alt="" className="h-5 w-5 dark:hidden" />
                                <img src="/logo/light/SVG/White.svg" alt="" className="hidden h-5 w-5 dark:block" />
                            </>
                        ) : (
                            <ArrowRight className="h-5 w-5 text-electric-green" />
                        )}
                    </div>
                </div>
            </div>
            <div className="flex lg:hidden justify-center py-4 relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-electric-green/30 to-transparent" />
                {/* Flowing particle downwards */}
                <motion.div
                    className="absolute h-8 w-[3px] rounded-full bg-gradient-to-b from-transparent via-electric-green to-transparent"
                    style={{ left: 'calc(50% - 1.5px)' }}
                    animate={{ y: [-24, 24] }}
                    transition={{
                        ease: "linear",
                        duration: 1.5,
                        repeat: Infinity,
                    }}
                />
                <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl border border-electric-green/25 bg-muted shadow-sm">
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
                        Zero Rearchitecting Required
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Point Koreshield at your existing LLM provider. Every request is inspected, scored, and either passed through or stopped, without changing a line of your application code.
                    </p>
                </motion.div>

                <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)_5rem_minmax(0,1fr)] lg:items-stretch">
                    {/* Step 1: Your Application */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-card border border-white/[0.08] rounded-xl p-6 shadow-sm"
                    >
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
                                <span className="ml-4 text-foreground/70">model=<span className="text-blue-400">"gpt-4o-mini"</span>,</span><br />
                                <span className="ml-4 text-foreground/70">messages=[&#123;...&#125;]</span><br />
                                <span className="text-foreground/70">)</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Works as a drop-in replacement. No refactoring needed.</p>
                        </div>
                    </motion.div>

                    <FlowArrow branded />

                    {/* Step 2: Koreshield Proxy  -  the "star" card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="relative overflow-visible"
                    >
                        <div className="flex justify-center mb-3">
                            <span className="inline-flex items-center gap-2 bg-emerald-600 dark:bg-electric-green text-white font-bold px-5 py-2 text-xs rounded-full uppercase tracking-widest shadow-lg shadow-emerald-600/30 dark:shadow-emerald-500/30 ring-2 ring-emerald-600/20 dark:ring-emerald-400/20">
                                <img src="/logo/light/SVG/White.svg" alt="" className="h-4 w-4" />
                                Koreshield Proxy
                            </span>
                        </div>

                        <div className="bg-card border-2 border-electric-green/20 rounded-xl p-6 md:p-8 relative overflow-hidden shadow-lg shadow-emerald-500/10">
                            <div className="pointer-events-none absolute -left-12 top-8 h-24 w-24 rounded-full border border-electric-green/10" />
                            <div className="pointer-events-none absolute -right-14 bottom-6 h-28 w-28 rounded-full bg-electric-green/5 blur-2xl" />

                            <div className="flex flex-col items-center text-center gap-3 mb-5">
                                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-electric-green/20 bg-electric-green/10 shadow-lg shadow-emerald-500/10">
                                    <img src="/logo/dark/SVG/Black.svg" alt="Koreshield" className="h-9 w-9 dark:hidden" />
                                    <img src="/logo/light/SVG/White.svg" alt="Koreshield" className="hidden h-9 w-9 dark:block" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">Intercepted &amp; Analyzed</h3>
                                    <p className="text-sm text-muted-foreground">Scored and classified in &lt;30ms</p>
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

                    <FlowArrow />

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
                        <p className="text-xs text-muted-foreground mt-3">Only clean, policy-compliant requests reach your providers.</p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

export default Architecture;
