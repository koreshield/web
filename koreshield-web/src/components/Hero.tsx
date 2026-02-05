import { motion } from 'framer-motion';
import { Github, ArrowRight } from 'lucide-react';
import TerminalAnimation from './TerminalAnimation';

function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-dark/10 via-black to-black" />

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)]" />

            <div className="relative z-10 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                {/* Left: Text content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <motion.h1
                        className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        Secure Your AI <br />
                        <span className="text-electric-green">Infrastructure.</span>
                    </motion.h1>

                    <motion.p
                        className="text-base sm:text-lg md:text-xl text-gray-400 mb-8 max-w-xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        The open-source proxy between your app and LLM providers. Prevents prompt injection, jailbreaks, and data exfiltration with <span className="text-electric-green font-semibold">95% detection accuracy</span>.
                    </motion.p>

                    <motion.div
                        className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                    >
                        <button className="group bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 glow-green shadow-lg shadow-emerald-500/20 w-full sm:w-auto">
                            Get Started
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button className="group border border-gray-700 hover:border-electric-green text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto">
                            <Github className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>View on GitHub</span>

                        </button>
                    </motion.div>
                </motion.div>

                {/* Right: Terminal animation */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    <TerminalAnimation />
                </motion.div>
            </div>
        </section>
    );
}

export default Hero;
