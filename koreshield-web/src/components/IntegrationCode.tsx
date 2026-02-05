import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Copy, Check, Terminal, FileCode2 } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';

const codeExamples = {
    python: `import koreshield

client = koreshield.Client(api_key="ks_...")
# requests are automatically sanitized
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": user_input}]
)`,
    javascript: `import { KoreShield } from '@koreshield/sdk';

const client = new KoreShield({ apiKey: process.env.KORESHIELD_KEY });
const result = await client.chat.completions.create({
  messages: [{ role: 'user', content: userInput }]
});`,
};

function IntegrationCode() {
    const [activeTab, setActiveTab] = useState<'python' | 'javascript'>('python');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        Prism.highlightAll();
    }, [activeTab]);

    const handleCopy = () => {
        navigator.clipboard.writeText(codeExamples[activeTab]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <section className="py-20 px-6 bg-gradient-to-b from-black via-slate-950 to-black">
            <div className="max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        Easy <span className="text-electric-green">Integration</span>
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Drop-in replacement for your existing LLM clients
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="code-block rounded-xl overflow-hidden border border-gray-800 bg-[#0d0d0d] shadow-2xl relative group"
                >
                    {/* Premium Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-[#151515] border-b border-gray-800">
                        {/* Window Controls */}
                        <div className="flex items-center gap-2 w-20">
                            <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                            <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
                        </div>

                        {/* Tabs (Pill Style) */}
                        <div className="flex bg-black/50 p-1 rounded-lg border border-white/5">
                            <button
                                onClick={() => setActiveTab('python')}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${activeTab === 'python'
                                        ? 'bg-gray-800 text-white shadow-sm ring-1 ring-white/10'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                    }`}
                            >
                                <Terminal size={14} className={activeTab === 'python' ? 'text-electric-green' : ''} />
                                Python
                            </button>
                            <button
                                onClick={() => setActiveTab('javascript')}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${activeTab === 'javascript'
                                        ? 'bg-gray-800 text-white shadow-sm ring-1 ring-white/10'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                    }`}
                            >
                                <FileCode2 size={14} className={activeTab === 'javascript' ? 'text-yellow-400' : ''} />
                                JavaScript
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="w-20 flex justify-end">
                            <button
                                onClick={handleCopy}
                                className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10"
                                aria-label="Copy code"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-electric-green" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="p-6 overflow-x-auto bg-[#0d0d0d]">
                        <pre className="!bg-transparent !m-0 !p-0 font-mono text-sm leading-relaxed">
                            <code className={`language-${activeTab}`}>
                                {codeExamples[activeTab]}
                            </code>
                        </pre>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

export default IntegrationCode;
