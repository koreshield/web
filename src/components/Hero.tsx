import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import TerminalAnimation from './TerminalAnimation';

function Hero() {

	return (
		<section className="relative min-h-[90vh] flex items-center justify-center px-6 py-28 overflow-hidden bg-background transition-colors ambient-glow">
			{/* Subtle dot grid  -  barely visible */}
			<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

			<div className="relative z-10 max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
				{/* Left: Text content */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					<motion.div
						className="inline-flex items-center gap-2 bg-electric-green/10 border border-electric-green/20 text-electric-green text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.1 }}
					>
						<span className="w-1.5 h-1.5 rounded-full bg-electric-green animate-pulse" />
						LLM Security Firewall
					</motion.div>

					<motion.h1
						className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-[1.08] tracking-[-0.04em] text-foreground"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
					>
						Every Prompt Is a{' '}
						<span className="text-electric-green">Potential Attack.</span>
					</motion.h1>

					<motion.p
						className="text-base sm:text-lg md:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.4 }}
					>
						KoreShield intercepts every request between your app and LLM providers  -  blocking prompt injection, jailbreaks, and data exfiltration in{' '}
						<span className="text-foreground font-semibold">under 30ms</span>, with{' '}
						<span className="text-electric-green font-semibold">95% detection accuracy</span>.
					</motion.p>

					<motion.div
						className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.6 }}
					>
						<Link
							to="/demo"
							rel="noopener"
							className="group relative bg-electric-green hover:bg-emerald-bright text-white font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 w-full sm:w-auto overflow-hidden"
						>
							<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
							<Play className="w-4 h-4 fill-white relative z-10 shrink-0" />
							<span className="relative z-10">See Live Demo</span>
							<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10 shrink-0" />
						</Link>

						<a
							href="https://docs.koreshield.com"
							target="_blank"
							rel="noreferrer noopener"
							className="group relative border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-foreground font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto backdrop-blur-sm"
						>
							<span className="relative z-10">Read the Docs</span>
							<ArrowRight className="w-4 h-4 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform shrink-0" />
						</a>
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
