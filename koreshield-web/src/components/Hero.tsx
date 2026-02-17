import { motion } from 'framer-motion';
import { ArrowRight, Github } from 'lucide-react';
import TerminalAnimation from './TerminalAnimation';

function Hero() {
	return (
		<section className="relative min-h-[85vh] flex items-center justify-center px-6 py-20 overflow-hidden bg-background transition-colors">
			{/* Subtle grid */}
			<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.04)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.04)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

			<div className="relative z-10 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
				{/* Left: Text content */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					<motion.h1
						className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tight text-foreground"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
					>
						Secure Your AI <br />
						<span className="text-electric-green">Infrastructure.</span>
					</motion.h1>

					<motion.p
						className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 max-w-xl"
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
						<a
							href="https://docs.koreshield.com"
							target="_blank"
							rel="noreferrer"
							className="group bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 w-full sm:w-auto"
						>
							Read the Docs
							<ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
						</a>

						<a
							href="https://github.com/koreshield/"
							target="_blank"
							rel="noreferrer"
							className="group border border-border text-foreground hover:border-electric-green hover:text-electric-green font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto bg-card/60 backdrop-blur"
						>
							<Github className="w-4 h-4 sm:w-5 sm:h-5" />
							<span>View on GitHub</span>
						</a>
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
