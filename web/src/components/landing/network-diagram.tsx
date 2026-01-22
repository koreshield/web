import { motion } from "motion/react";
import { Shield, Zap, Eye, Lock, Sparkles } from "lucide-react";

export function NetworkDiagram() {
  return (
    <section className="py-24 bg-[#050a14] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-24">
          <div className="relative inline-block">
            <motion.div
              className="absolute -inset-8 bg-gradient-to-r from-security-green/20 via-electric-blue/20 to-cyber-purple/20 blur-2xl rounded-full"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <h2 className="relative text-6xl md:text-7xl font-bold italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/70 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] font-sans">
              Defense in Depth
            </h2>

            <motion.div
              className="absolute -top-8 -right-10 text-security-green"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
                rotate: [0, 15, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-10 h-10 fill-security-green/20" />
            </motion.div>
            <motion.div
              className="absolute -bottom-4 -left-10 text-electric-blue"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
                rotate: [0, -15, 0],
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            >
              <Sparkles className="w-8 h-8 fill-electric-blue/20" />
            </motion.div>
            <motion.div
              className="absolute top-0 -left-8 text-cyber-purple"
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              <Sparkles className="w-4 h-4 fill-cyber-purple/20" />
            </motion.div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 hidden md:block" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 relative z-10 group-hover:border-yellow-400/50 group-hover:bg-yellow-400/10 transition-all duration-500 backdrop-blur-sm">
                <Shield className="w-10 h-10 text-yellow-400" />
                <motion.div
                  className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full"
                  animate={{ opacity: [0, 1, 0, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    times: [0, 0.1, 0.25, 1],
                    ease: "easeInOut",
                  }}
                />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-sans">
                Input Sanitization
              </h3>
              <p className="text-sm text-white/50 leading-relaxed font-sans">
                Cleans and normalizes prompts,
                <br />
                removes malicious patterns
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 relative z-10 group-hover:border-red-400/50 group-hover:bg-red-400/10 transition-all duration-500 backdrop-blur-sm">
                <Zap className="w-10 h-10 text-red-400" />
                <motion.div
                  className="absolute inset-0 bg-red-400/20 blur-xl rounded-full"
                  animate={{ opacity: [0, 0, 1, 0, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    times: [0, 0.2, 0.35, 0.5, 1],
                    ease: "easeInOut",
                  }}
                />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-sans">
                Attack Detection
              </h3>
              <p className="text-sm text-white/50 leading-relaxed font-sans">
                Heuristic analysis for
                <br />
                prompt injection patterns
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 relative z-10 group-hover:border-cyber-purple/50 group-hover:bg-cyber-purple/10 transition-all duration-500 backdrop-blur-sm">
                <Lock className="w-10 h-10 text-cyber-purple" />
                <motion.div
                  className="absolute inset-0 bg-cyber-purple/20 blur-xl rounded-full"
                  animate={{ opacity: [0, 0, 0, 1, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    times: [0, 0.45, 0.6, 0.75, 1],
                    ease: "easeInOut",
                  }}
                />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-sans">
                Policy Enforcement
              </h3>
              <p className="text-sm text-white/50 leading-relaxed font-sans">
                Applies security rules and
                <br />
                sensitivity levels
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 relative z-10 group-hover:border-electric-blue/50 group-hover:bg-electric-blue/10 transition-all duration-500 backdrop-blur-sm">
                <Eye className="w-10 h-10 text-electric-blue" />
                <motion.div
                  className="absolute inset-0 bg-electric-blue/20 blur-xl rounded-full"
                  animate={{ opacity: [0, 0, 0, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    times: [0, 0.7, 0.85, 1],
                    ease: "easeInOut",
                  }}
                />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Audit Logging
              </h3>
              <p className="text-sm text-white/40">
                Comprehensive logging of
                <br />
                all security events
              </p>
            </div>
          </div>

          <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 hidden md:block pointer-events-none">
            <motion.div
              className="w-24 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-50"
              animate={{
                x: ["0%", "100%"],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-green-400 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]"
              animate={{
                left: ["0%", "100%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
