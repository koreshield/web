import { Server, Cloud, Shield, ArrowRight } from "lucide-react";

export const MultipleProtocols = () => (
  <div className="py-32 bg-[#050a14] relative overflow-hidden border-t border-white/5">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight font-sans text-white">
          Enterprise-ready deployment,<br />
          <span className="text-white/40">anywhere you need it.</span>
        </h2>
        <p className="text-xl text-white/60 font-sans leading-relaxed">
          Deploy KoreShield wherever your applications run. Choose from cloud-hosted, self-hosted, or hybrid deployments to meet your security and compliance requirements.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Cloud-Hosted Card */}
        <div className="group relative bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-electric-blue/30 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-b from-electric-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />

          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-electric-blue/10 border border-electric-blue/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Cloud className="w-6 h-6 text-electric-blue" />
            </div>

            <h3 className="text-xl font-bold text-white mb-3 font-sans">Cloud-Hosted</h3>
            <p className="text-white/50 mb-8 h-12 font-sans text-sm leading-relaxed">
              Managed infrastructure with automatic scaling, updates, and 99.9% uptime SLA. Perfect for teams that want zero maintenance.
            </p>

            <div className="bg-black/40 rounded-xl border border-white/5 p-3 font-mono text-sm text-white/60 flex items-center justify-between group-hover:border-electric-blue/20 transition-colors shadow-inner">
              <span>99.9% uptime SLA</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-electric-blue" />
            </div>
          </div>
        </div>

        {/* Self-Hosted Card */}
        <div className="group relative bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-cyber-purple/30 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-b from-cyber-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />

          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-cyber-purple/10 border border-cyber-purple/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Server className="w-6 h-6 text-cyber-purple" />
            </div>

            <h3 className="text-xl font-bold text-white mb-3 font-sans">Self-Hosted</h3>
            <p className="text-white/50 mb-8 h-12 font-sans text-sm leading-relaxed">
              Deploy in your own infrastructure with Docker containers. Full data control and compliance with your security policies.
            </p>

            <div className="bg-black/40 rounded-xl border border-white/5 p-3 font-mono text-sm text-white/60 flex items-center justify-between group-hover:border-cyber-purple/20 transition-colors shadow-inner">
              <span>docker run koreshield</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-cyber-purple" />
            </div>
          </div>
        </div>

        {/* Enterprise Card */}
        <div className="group relative bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />

          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-6 h-6 text-orange-400" />
            </div>

            <h3 className="text-xl font-bold text-white mb-3 font-sans">Enterprise</h3>
            <p className="text-white/50 mb-8 h-12 font-sans text-sm leading-relaxed">
              SOC 2 Type II compliant with audit trails, custom integrations, and dedicated support for mission-critical deployments.
            </p>

            <div className="bg-black/40 rounded-xl border border-white/5 p-3 font-mono text-sm text-white/60 flex items-center justify-between group-hover:border-orange-500/20 transition-colors shadow-inner">
              <span>SOC 2 Type II & GDPR</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-orange-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
