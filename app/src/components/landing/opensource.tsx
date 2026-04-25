import { Heart, Lock, Users, Server } from "lucide-react";
import { SiGithub } from "react-icons/si";

export function OpenSource() {
  return (
    <section className="py-24 bg-[#050a14] relative overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight font-sans">
              100% Open Source
            </h2>
            <p className="text-lg text-white/60 mb-8 leading-relaxed font-sans">
              We believe in transparency and community. KoreShield is built in the
              open, so you can inspect the code, contribute features, or
              self-host the entire platform on your own infrastructure.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://github.com/koreshield/koreshield"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
              >
                <SiGithub className="w-5 h-5" />
                Star on GitHub
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-full" />
            <div className="relative bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-electric-blue/10 flex items-center justify-center mb-4 border border-electric-blue/20">
                    <Lock className="w-5 h-5 text-electric-blue" />
                  </div>
                  <h3 className="text-white font-bold font-sans">
                    Auditable Security
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed font-sans">
                    Verify our security claims by inspecting the source code
                    yourself.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-cyber-purple/10 flex items-center justify-center mb-4 border border-cyber-purple/20">
                    <Users className="w-5 h-5 text-cyber-purple" />
                  </div>
                  <h3 className="text-white font-bold font-sans">Community Driven</h3>
                  <p className="text-sm text-white/50 leading-relaxed font-sans">
                    Built with feedback and contributions from developers like
                    you.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-security-green/10 flex items-center justify-center mb-4 border border-security-green/20">
                    <Server className="w-5 h-5 text-security-green" />
                  </div>
                  <h3 className="text-white font-bold font-sans">Self-Hostable</h3>
                  <p className="text-sm text-white/50 leading-relaxed font-sans">
                    Run the entire stack on your own servers. No vendor lock-in.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-red-400/10 flex items-center justify-center mb-4 border border-red-400/20">
                    <Heart className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-white font-bold font-sans">Free Forever</h3>
                  <p className="text-sm text-white/50 leading-relaxed font-sans">
                    The core features will always be free and open source.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
