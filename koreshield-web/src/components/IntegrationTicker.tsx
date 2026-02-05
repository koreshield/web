import { motion } from 'framer-motion';
import { Database, Cloud, Box, Server, Globe, Cpu, Layers, Terminal } from 'lucide-react';

const integrations = [
    { name: 'Salesforce', icon: Cloud },
    { name: 'HubSpot', icon: Database },
    { name: 'Zendesk', icon: Globe },
    { name: 'OpenAI', icon: Cpu },
    { name: 'Anthropic', icon: Box },
    { name: 'LangChain', icon: Layers },
    { name: 'DeepSeek', icon: Terminal },
    { name: 'Slack', icon: Server },
];

// Duplicate for seamless loop
const tickerItems = [...integrations, ...integrations];

export function IntegrationTicker() {
    return (
        <section className="py-10 border-y border-slate-900 bg-black/50 overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10"></div>

            <div className="max-w-7xl mx-auto px-6 mb-6 text-center">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
                    Protecting Data Across Your Stack
                </p>
            </div>

            <div className="flex">
                <motion.div
                    className="flex gap-12 sm:gap-20 items-center whitespace-nowrap"
                    animate={{
                        x: [0, -1000],
                    }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: 30,
                            ease: "linear",
                        },
                    }}
                >
                    {tickerItems.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-default grayscale hover:grayscale-0">
                            <item.icon className="w-6 h-6 text-electric-green" />
                            <span className="text-xl font-bold text-gray-300">{item.name}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
