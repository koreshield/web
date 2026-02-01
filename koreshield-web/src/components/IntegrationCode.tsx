import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
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
                    className="code-block rounded-xl overflow-hidden border border-gray-800 bg-[#1a1a1a] shadow-2xl"
                >
                    <div className="flex items-center justify-between px-4 py-2 bg-[#252525] border-b border-gray-800">
                        <div className="code-tabs flex gap-2">
                            <button
                                className={`px-4 py-1.5 rounded-t-lg text-sm font-medium transition-colors relative top-[1px] ${activeTab === 'python' ? 'text-electric-green border-b-2 border-electric-green' : 'text-gray-400 hover:text-white'}`}
                                onClick={() => setActiveTab('python')}
                            >
                                Python
                            </button>
                            <button
                                className={`px-4 py-1.5 rounded-t-lg text-sm font-medium transition-colors relative top-[1px] ${activeTab === 'javascript' ? 'text-electric-green border-b-2 border-electric-green' : 'text-gray-400 hover:text-white'}`}
                                onClick={() => setActiveTab('javascript')}
                            >
                                JavaScript
                            </button>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 text-electric-green" />
                                    <span className="text-xs">Copied</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    <span className="text-xs">Copy</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="p-6 overflow-x-auto">
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
