import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, Check, Copy } from 'lucide-react';

interface CodeLine {
  text: string;
  isChanged?: boolean;
  isRemoved?: boolean;
  isAdded?: boolean;
}

interface CodeSamples {
  [language: string]: {
    before: CodeLine[];
    after: CodeLine[];
  };
}

const samples: CodeSamples = {
  cURL: {
    before: [
      { text: 'curl https://api.openai.com/v1/chat/completions \\', isRemoved: true },
      { text: '  -H "Authorization: Bearer $OPENAI_API_KEY" \\' },
      { text: '  -H "Content-Type: application/json" \\' },
      { text: '  -d \'{\'' },
      { text: '    "model": "gpt-4o",' },
      { text: '    "messages": [{"role": "user", "content": "Hello!"}]' },
      { text: '  }\'' }
    ],
    after: [
      { text: 'curl https://api.koreshield.ai/v1/chat/completions \\', isAdded: true },
      { text: '  -H "Authorization: Bearer $OPENAI_API_KEY" \\' },
      { text: '  -H "Content-Type: application/json" \\' },
      { text: '  -d \'{\'' },
      { text: '    "model": "gpt-4o",' },
      { text: '    "messages": [{"role": "user", "content": "Hello!"}]' },
      { text: '  }\'' }
    ]
  },
  Python: {
    before: [
      { text: 'from openai import OpenAI' },
      { text: '' },
      { text: 'client = OpenAI(' },
      { text: '    api_key="sk-..."' },
      { text: ')' },
      { text: '' },
      { text: 'response = client.chat.completions.create(' },
      { text: '    model="gpt-4o-mini",' },
      { text: '    messages=[{"role": "user", "content": "Hello!"}]' },
      { text: ')' }
    ],
    after: [
      { text: 'from openai import OpenAI' },
      { text: '' },
      { text: 'client = OpenAI(' },
      { text: '    api_key="sk-...",' },
      { text: '    base_url="https://api.koreshield.ai/v1" # Point to Koreshield', isAdded: true },
      { text: ')' },
      { text: '' },
      { text: 'response = client.chat.completions.create(' },
      { text: '    model="gpt-4o-mini",' },
      { text: '    messages=[{"role": "user", "content": "Hello!"}]' },
      { text: ')' }
    ]
  },
  'Node.js': {
    before: [
      { text: 'import OpenAI from "openai";' },
      { text: '' },
      { text: 'const openai = new OpenAI({' },
      { text: '  apiKey: "sk-..."' },
      { text: '});' },
      { text: '' },
      { text: 'const response = await openai.chat.completions.create({' },
      { text: '  model: "gpt-4o-mini",' },
      { text: '  messages: [{ role: "user", content: "Hello!" }]' },
      { text: '});' }
    ],
    after: [
      { text: 'import OpenAI from "openai";' },
      { text: '' },
      { text: 'const openai = new OpenAI({' },
      { text: '  apiKey: "sk-...",' },
      { text: '  baseURL: "https://api.koreshield.ai/v1" // Point to Koreshield', isAdded: true },
      { text: '});' },
      { text: '' },
      { text: 'const response = await openai.chat.completions.create({' },
      { text: '  model: "gpt-4o-mini",' },
      { text: '  messages: [{ role: "user", content: "Hello!" }]' },
      { text: '});' }
    ]
  }
};

export function CodeSwap() {
  const [lang, setLang] = useState<'cURL' | 'Python' | 'Node.js'>('cURL');
  const [isProtected, setIsProtected] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeSample = samples[lang];
  const activeLines = isProtected ? activeSample.after : activeSample.before;

  const handleCopy = () => {
    const rawText = activeLines.map(l => l.text).join('\n');
    navigator.clipboard.writeText(rawText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl border border-white/[0.08] bg-card/40 p-6 backdrop-blur-sm relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-electric-green/[0.02] via-transparent to-transparent pointer-events-none" />
      
      {/* Top Bar with Language Tabs and Before/After Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/[0.06] pb-5 relative z-10">
        <div className="flex items-center gap-2">
          {['cURL', 'Python', 'Node.js'].map((item) => (
            <button
              key={item}
              onClick={() => setLang(item as any)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                lang === item
                  ? 'bg-white/[0.08] text-foreground border border-white/[0.06]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gateway State:</span>
          <div className="flex bg-black/40 rounded-xl p-1 border border-white/[0.06]">
            <button
              onClick={() => setIsProtected(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                !isProtected
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Direct (Unsecured)
            </button>
            <button
              onClick={() => setIsProtected(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                isProtected
                  ? 'bg-electric-green/10 text-electric-green border border-electric-green/20'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Protected
            </button>
          </div>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="relative rounded-2xl border border-white/[0.06] bg-black/50 p-5 font-mono text-sm leading-relaxed overflow-x-auto min-h-[280px]">
        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="absolute right-4 top-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-2 text-muted-foreground transition-all hover:bg-white/[0.08] hover:text-foreground z-10"
        >
          {copied ? <Check className="w-4 h-4 text-electric-green" /> : <Copy className="w-4 h-4" />}
        </button>

        {/* Floating security status badge inside editor */}
        <div className="absolute right-16 top-4 z-10 hidden sm:block">
          <AnimatePresence mode="wait">
            {isProtected ? (
              <motion.span
                key="protected"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="inline-flex items-center gap-1.5 rounded-full bg-electric-green/15 border border-electric-green/30 px-3 py-1 text-xs font-bold text-electric-green shadow-lg shadow-emerald-500/5"
              >
                <span className="w-1.5 h-1.5 bg-electric-green rounded-full animate-ping" />
                Active Proxy Firewall
              </motion.span>
            ) : (
              <motion.span
                key="unsecured"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/30 px-3 py-1 text-xs font-bold text-red-400 shadow-lg"
              >
                Direct LLM Route
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Code Content */}
        <div className="mt-6 space-y-1">
          <AnimatePresence mode="popLayout">
            {activeLines.map((line, idx) => {
              let lineClass = "text-muted-foreground/90";
              let bgClass = "";

              if (line.isRemoved) {
                lineClass = "text-red-400 font-semibold";
                bgClass = "bg-red-950/20 -mx-5 px-5 border-l-2 border-red-500";
              } else if (line.isAdded) {
                lineClass = "text-electric-green font-semibold";
                bgClass = "bg-emerald-950/20 -mx-5 px-5 border-l-2 border-electric-green";
              }

              return (
                <motion.div
                  key={`${lang}-${isProtected}-${idx}-${line.text}`}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 4 }}
                  transition={{ duration: 0.15, delay: idx * 0.02 }}
                  className={`flex items-start gap-4 py-0.5 ${bgClass}`}
                >
                  <span className="text-white/20 select-none text-right w-6 text-xs mt-1">{idx + 1}</span>
                  <span className={`whitespace-pre ${lineClass}`}>{line.text}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-1">
          <Terminal className="w-3.5 h-3.5 text-electric-green" />
          <span>Zero dependencies or library migrations needed.</span>
        </div>
        <span className="hidden md:inline">Latency impact: &lt;30ms</span>
      </div>
    </div>
  );
}
