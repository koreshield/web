import { Check, Bot, Cpu, Cloud } from "lucide-react";

export const BringYourOwnDomain = () => (
  <div className="py-24 bg-black relative overflow-hidden">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Multi-provider <br />
            LLM support
          </h2>
          <p className="text-xl text-white/40 mb-8">
            Protect applications using any LLM provider. KoreShield works with OpenAI, Anthropic, Google Gemini, Azure OpenAI, and more—all through the same simple API.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 text-white/60">
              <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Check size={16} className="text-accent" />
              </div>
              <span>OpenAI GPT-3.5, GPT-4, GPT-4 Turbo</span>
            </div>
            <div className="flex items-center gap-4 text-white/60">
              <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Check size={16} className="text-accent" />
              </div>
              <span>Anthropic Claude (all versions)</span>
            </div>
            <div className="flex items-center gap-4 text-white/60">
              <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Check size={16} className="text-accent" />
              </div>
              <span>Google Gemini/PaLM</span>
            </div>
            <div className="flex items-center gap-4 text-white/60">
              <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Check size={16} className="text-accent" />
              </div>
              <span>Azure OpenAI Service</span>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full group-hover:bg-accent/30 transition-colors duration-500" />

          <div className="relative bg-white/2 border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium text-white">
                      Multi-Provider Configuration
                    </h3>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-medium text-accent">
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-white/40 mt-1">
                    Configured on {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-black/40 rounded-2xl border border-white/5 overflow-hidden font-mono text-sm">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <span className="text-white/40">Provider</span>
                <span className="text-white/80">OpenAI</span>
              </div>
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <span className="text-white/40">Model</span>
                <span className="text-white/80">gpt-4</span>
              </div>
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <span className="text-white/40">Security Level</span>
                <span className="text-accent">High</span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="text-white/40">Requests Today</span>
                <span className="text-white/80">1,247</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                <div className="text-green-400 font-bold">1,234</div>
                <div className="text-xs text-green-400/60">SAFE</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                <div className="text-red-400 font-bold">13</div>
                <div className="text-xs text-red-400/60">BLOCKED</div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
                <div className="text-yellow-400 font-bold">2</div>
                <div className="text-xs text-yellow-400/60">WARNED</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
