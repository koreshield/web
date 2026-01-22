import { Check, Bot, Cpu, Cloud } from "lucide-react";

export const BringYourOwnDomain = () => (
  <div className="py-24 bg-[#050a14] relative overflow-hidden">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-white font-sans">
            Multi-provider <br />
            LLM support
          </h2>
          <p className="text-xl text-white/60 mb-8 font-sans leading-relaxed">
            Protect applications using any LLM provider. KoreShield works with OpenAI, Anthropic, Google Gemini, Azure OpenAI, and more—all through the same simple API.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 text-white/70 font-sans">
              <div className="w-8 h-8 rounded-full bg-electric-blue/10 border border-electric-blue/20 flex items-center justify-center">
                <Check size={16} className="text-electric-blue" />
              </div>
              <span>OpenAI GPT-3.5, GPT-4, GPT-4 Turbo</span>
            </div>
            <div className="flex items-center gap-4 text-white/70 font-sans">
              <div className="w-8 h-8 rounded-full bg-electric-blue/10 border border-electric-blue/20 flex items-center justify-center">
                <Check size={16} className="text-electric-blue" />
              </div>
              <span>Anthropic Claude (all versions)</span>
            </div>
            <div className="flex items-center gap-4 text-white/70 font-sans">
              <div className="w-8 h-8 rounded-full bg-electric-blue/10 border border-electric-blue/20 flex items-center justify-center">
                <Check size={16} className="text-electric-blue" />
              </div>
              <span>Google Gemini/PaLM</span>
            </div>
            <div className="flex items-center gap-4 text-white/70 font-sans">
              <div className="w-8 h-8 rounded-full bg-electric-blue/10 border border-electric-blue/20 flex items-center justify-center">
                <Check size={16} className="text-electric-blue" />
              </div>
              <span>Azure OpenAI Service</span>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-electric-blue/20 blur-[100px] rounded-full group-hover:bg-electric-blue/30 transition-colors duration-500 opacity-50" />

          <div className="relative bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-electric-blue/10 flex items-center justify-center shrink-0 border border-electric-blue/20">
                  <Bot className="w-6 h-6 text-electric-blue" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white font-sans">
                      Multi-Provider Configuration
                    </h3>
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-security-green/10 border border-security-green/20 text-xs font-bold text-security-green tracking-wide">
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-white/40 mt-1 font-sans">
                    Configured on {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-black/40 rounded-2xl border border-white/5 overflow-hidden font-mono text-sm shadow-inner">
              <div className="p-4 border-b border-white/5 flex items-center justify-between hover:bg-white/5 transition-colors">
                <span className="text-white/40">Provider</span>
                <span className="text-white/90">OpenAI</span>
              </div>
              <div className="p-4 border-b border-white/5 flex items-center justify-between hover:bg-white/5 transition-colors">
                <span className="text-white/40">Model</span>
                <span className="text-white/90">gpt-4</span>
              </div>
              <div className="p-4 border-b border-white/5 flex items-center justify-between hover:bg-white/5 transition-colors">
                <span className="text-white/40">Security Level</span>
                <span className="text-electric-blue font-bold">High</span>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                <span className="text-white/40">Requests Today</span>
                <span className="text-white/90">1,247</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="bg-security-green/10 border border-security-green/20 rounded-xl p-3 text-center">
                <div className="text-security-green font-bold text-lg">1,234</div>
                <div className="text-[10px] text-security-green/60 font-bold uppercase tracking-wider">SAFE</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                <div className="text-red-400 font-bold text-lg">13</div>
                <div className="text-[10px] text-red-400/60 font-bold uppercase tracking-wider">BLOCKED</div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
                <div className="text-yellow-400 font-bold text-lg">2</div>
                <div className="text-[10px] text-yellow-400/60 font-bold uppercase tracking-wider">WARNED</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
