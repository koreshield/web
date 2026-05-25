import { motion } from 'framer-motion';
import { Activity, ArrowRight, Database, FileText, Globe, Network, Server, Shield } from 'lucide-react';

const features = [
    {
        icon: Shield,
        title: '95% Detection Accuracy',
        eyebrow: 'Detection engine',
        description: 'Fewer than 3 false positives per 100 blocked requests. Tuned on millions of real-world attack attempts, not synthetic test data, so it catches what matters without crying wolf.',
        proof: '<3 false positives per 100 blocked requests',
    },
    {
        icon: Network,
        title: 'Multi-Provider',
        eyebrow: 'Provider control',
        description: 'One SDK. One API key. full coverage across LLMs.',
        proof: 'One policy layer across every model route',
    },
    {
        icon: Database,
        title: 'RAG Defense',
        eyebrow: 'Retrieval inspection',
        description: 'Scans every document in your retrieval context before it reaches the LLM, catching injected instructions your vector db doesn\'t know to look for.',
        proof: 'Context scanned before model exposure',
    },
    {
        icon: Globe,
        title: 'CRM Integrations',
        eyebrow: 'Workflow coverage',
        description: 'Pre-built connectors for Salesforce, HubSpot, and Zendesk. Secure your CRM-to-LLM pipelines without writing custom data extraction logic.',
        proof: 'Salesforce, HubSpot, and Zendesk paths',
    },
    {
        icon: FileText,
        title: 'Audit Trails',
        eyebrow: 'Evidence trail',
        description: 'Every scan, every block, every decision: logged with full context. Query your threat history, or export to your SIEM in one command.',
        proof: 'Exportable history for review',
    },
    {
        icon: Activity,
        title: 'Threat Monitoring',
        eyebrow: 'Live operations',
        description: 'Sub-30ms interception overhead at the proxy layer. Scan results are logged immediately and surfaced in your audit dashboard for review.',
        proof: 'Sub-30ms proxy overhead',
    },
    {
        icon: Server,
        title: 'Deploy Anywhere',
        eyebrow: 'Data sovereignty',
        description: 'Run in our managed cloud, self-hosted on your VPC, or fully air-gapped with no internet. Offline licence validation and bundled threat corpus included.',
        proof: 'Cloud, self-hosted, or air-gapped',
    },
];

const modelRoutes = ['OpenAI', 'Anthropic', 'Gemini', 'DeepSeek'];

const metricChips = [
    '50+ attack patterns',
    'RAG-aware scanning',
    'Audit-ready events',
];

function Features() {
    return (
        <section className="relative overflow-hidden bg-background px-4 py-24 transition-colors ambient-glow sm:px-6 md:py-36">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric-green/30 to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.13),transparent_28rem),radial-gradient(circle_at_80%_35%,rgba(59,130,246,0.08),transparent_24rem)]" />
            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="mx-auto mb-14 max-w-6xl text-center md:mb-16"
                >
                    <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-electric-green">
                        Protection Layer
                    </p>
                    <h2 className="mb-5 text-4xl font-extrabold tracking-[-0.04em] text-foreground md:text-5xl lg:whitespace-nowrap">
                        Block AI Threats Before the Model
                    </h2>
                    <p className="text-muted-foreground text-base leading-relaxed sm:text-lg lg:whitespace-nowrap">
                        Secure prompts, RAG context, provider traffic, and audit evidence in one proxy layer.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="group relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(255,255,255,0.035)_45%,rgba(15,23,42,0.45))] p-6 shadow-2xl shadow-emerald-950/20 lg:col-span-7 lg:p-8"
                    >
                        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-electric-green/20 bg-electric-green/10 blur-2xl transition-transform duration-500 group-hover:scale-110" />
                        <div className="relative z-10 flex h-full flex-col justify-between gap-10">
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-electric-green">
                                        <Shield className="h-3.5 w-3.5" />
                                        {features[0].eyebrow}
                                    </div>
                                    <h3 className="max-w-lg text-2xl font-black tracking-[-0.04em] text-foreground sm:text-3xl">
                                        Tuned to stop real attacks without turning your app into a false-positive machine.
                                    </h3>
                                </div>
                                <div className="shrink-0 rounded-3xl border border-white/[0.08] bg-background/70 p-5 text-center shadow-inner">
                                    <p className="text-5xl font-black tracking-[-0.08em] text-electric-green sm:text-6xl">95%</p>
                                    <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Detection accuracy</p>
                                </div>
                            </div>

                            <div>
                                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{features[0].description}</p>
                                <div className="mt-6 flex flex-wrap gap-2">
                                    {metricChips.map((chip) => (
                                        <span key={chip} className="rounded-full border border-white/[0.08] bg-background/60 px-3 py-1.5 text-xs font-semibold text-foreground/80">
                                            {chip}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        viewport={{ once: true }}
                        className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-card/80 p-6 shadow-sm lg:col-span-5 lg:p-8"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(16,185,129,0.12),transparent_16rem)]" />
                        <div className="relative z-10">
                            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-electric-green/20 bg-electric-green/10">
                                <Network className="h-6 w-6 text-electric-green" />
                            </div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-electric-green">{features[1].eyebrow}</p>
                            <h3 className="mb-4 text-2xl font-black tracking-[-0.035em] text-foreground">{features[1].title}</h3>
                            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{features[1].description}</p>

                            <div className="mt-7 space-y-2">
                                {modelRoutes.map((provider, index) => (
                                    <div key={provider} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-background/55 px-3 py-2.5">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-electric-green/10 text-[10px] font-black text-electric-green">
                                            {index + 1}
                                        </span>
                                        <span className="text-sm font-semibold text-foreground/85">{provider}</span>
                                        <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground/60" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {features.slice(2).map((feature, index) => (
                        <motion.div
                            key={index + 2}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.08 }}
                            viewport={{ once: true }}
                            className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-card/70 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-electric-green/30 hover:bg-card lg:col-span-3"
                        >
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric-green/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                            <div className="mb-5 flex items-center justify-between gap-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-electric-green/15 bg-electric-green/10 transition-colors group-hover:bg-electric-green/15">
                                    <feature.icon className="h-5 w-5 text-electric-green" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                                    {feature.eyebrow}
                                </span>
                            </div>
                            <h3 className="mb-3 text-xl font-black tracking-[-0.035em] text-foreground">{feature.title}</h3>
                            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                            <p className="mt-auto border-t border-white/[0.06] pt-4 text-xs font-semibold text-electric-green/90">{feature.proof}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Features;
