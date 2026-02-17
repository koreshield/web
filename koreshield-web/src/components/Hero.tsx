import { motion } from 'framer-motion';
import { ArrowRight, Check, Copy, Github } from 'lucide-react';
import { useState } from 'react';
import TerminalAnimation from './TerminalAnimation';

const INSTALL_CMD = 'pip install koreshield';

function Hero() {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(INSTALL_CMD);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<section className="relative min-h-[90vh] flex items-center justify-center px-6 py-28 overflow-hidden bg-background transition-colors ambient-glow">
			{/* Subtle dot grid — barely visible */}
			<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

			<div className="relative z-10 max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
				{/* Left: Text content */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					<motion.h1
						className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-[1.08] tracking-[-0.04em] text-foreground"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
					>
						Secure Your AI Infrastructure.
					</motion.h1>

					<motion.p
						className="text-base sm:text-lg md:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.4 }}
					>
						The open-source proxy between your app and LLM providers. Prevents prompt injection, jailbreaks, and data exfiltration with <span className="text-electric-green font-semibold">95% detection accuracy</span>.
					</motion.p>

					<motion.div
						className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-6"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.6 }}
					>
						{/* Shimmer CTA button */}
						<a
							href="https://docs.koreshield.com"
							target="_blank"
							rel="noreferrer"
							className="group relative bg-electric-green hover:bg-emerald-bright text-white font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 w-full sm:w-auto overflow-hidden"
						>
							<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-0 animate-shimmer" />
							<span className="relative z-10 flex items-center gap-2">
								Read the Docs
								<ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
							</span>
						</a>

						<a
							href="https://github.com/koreshield/"
							target="_blank"
							rel="noreferrer"
							className="group border border-white/10 dark:border-white/10 text-foreground hover:border-electric-green/50 hover:text-electric-green font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto bg-card/60 backdrop-blur-sm"
						>
							<Github className="w-4 h-4 sm:w-5 sm:h-5" />
							<span>View on GitHub</span>
						</a>
					</motion.div>

					{/* Install command with copy */}
					<motion.div
						className="inline-flex items-center gap-3 bg-card/80 dark:bg-[#18181B]/80 border border-white/10 dark:border-white/8 rounded-lg px-4 py-2.5 font-mono text-sm text-muted-foreground backdrop-blur-sm"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.8 }}
					>
						<span className="text-electric-green select-none">$</span>
						<span className="select-all">{INSTALL_CMD}</span>
						<button
							onClick={handleCopy}
							className="ml-1 p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
							aria-label="Copy install command"
						>
							{copied ? (
								<Check className="w-4 h-4 text-electric-green" />
							) : (
								<Copy className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
							)}
						</button>
					</motion.div>
				</motion.div>

				{/* Right: Interactive terminal */}
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
