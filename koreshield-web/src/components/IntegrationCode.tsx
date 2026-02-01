import { motion } from 'framer-motion';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

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
                    className="code-block"
                >
                    <div className="flex items-center justify-between">
                        <div className="code-tabs flex-1">
                            <button
                                className={`code-tab ${activeTab === 'python' ? 'active' : ''}`}
                                onClick={() => setActiveTab('python')}
                            >
                                python
                            </button>
                            <button
                                className={`code-tab ${activeTab === 'javascript' ? 'active' : ''}`}
                                onClick={() => setActiveTab('javascript')}
                            >
                                javascript
                            </button>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="px-4 py-2 text-gray-400 hover:text-electric-green transition-colors flex items-center gap-2"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span className="text-sm">copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    <span className="text-sm">copy</span>
                                </>
                            )}
                        </button>
                    </div>

                    <pre className="bg-[#1a1a1a]">
                        <code>{codeExamples[activeTab]}</code>
                    </pre>
                </motion.div>
            </div>
        </section>
    );
}

export default IntegrationCode;
