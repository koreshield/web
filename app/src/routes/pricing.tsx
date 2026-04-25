import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/navbar";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";
import { Check, X, Sparkles } from "lucide-react";

export const Route = createFileRoute("/pricing")({
	component: PricingPage,
});

function PricingPage() {
	const plans = Object.entries(SUBSCRIPTION_PLANS)
		.filter(([_, plan]) => !("hidden" in plan && plan.hidden))
		.map(([key, plan]) => ({
			id: key,
			...plan,
		}));

	return (
		<div className="min-h-screen bg-[#050a14] text-white selection:bg-electric-blue/30 font-sans">
			<Navbar />

			<div className="pt-32 pb-24 px-6 relative overflow-hidden">
				{/* Ambient backgrounds */}
				<div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
					<div className="absolute top-[10%] left-[-20%] w-[60%] h-[60%] bg-electric-blue/5 rounded-full blur-[150px]" />
					<div className="absolute bottom-[10%] right-[-20%] w-[60%] h-[60%] bg-cyber-purple/5 rounded-full blur-[150px]" />
				</div>

				<div className="max-w-7xl mx-auto relative z-10">
					<div className="text-center mb-16">
						<h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight font-manrope">
							Flexible plans for every scale
						</h1>
						<p className="text-xl text-white/60 max-w-2xl mx-auto font-manrope">
							Secure your LLM applications with enterprise-grade protection.
							<br />
							Start for free, upgrade as you grow.
						</p>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
						{plans.map((plan) => {
							const f = plan.features as {
								maxProviders: number;
								maxMembers: number;
								requestsPerMonth: number;
								retentionDays: number;
								auditLogs: boolean;
								sso: boolean;
								prioritySupport: boolean;
								advancedDetection: boolean;
								customRules: boolean;
							};
							return (
								<div
									key={plan.id}
									className={`relative flex flex-col p-8 rounded-3xl border transition-all duration-300 ${plan.id === "beam"
										? "bg-white/10 backdrop-blur-xl border-electric-blue/50 shadow-[0_0_60px_rgba(59,130,246,0.15)] ring-1 ring-electric-blue/30 scale-[1.02]"
										: "bg-white/5 backdrop-blur-lg border-white/10 hover:border-white/20 hover:bg-white/10"
										}`}
								>
									{plan.id === "beam" && (
										<>
											<div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-electric-blue/10 via-transparent to-purple-500/5 pointer-events-none" />
											<div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-electric-blue text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-lg shadow-electric-blue/30 flex items-center gap-1.5">
												<Sparkles className="w-3.5 h-3.5 animate-pulse" />
												Most Popular
												<Sparkles className="w-3.5 h-3.5 animate-pulse" />
											</div>
										</>
									)}

									<div className="mb-8 relative">
										<h3
											className={`text-xl font-bold mb-2 font-manrope ${plan.id === "beam" ? "text-electric-blue" : ""
												}`}
										>
											{plan.name}
										</h3>
										<div className="flex items-baseline gap-1 font-manrope">
											<span className="text-4xl font-bold">${plan.price}</span>
											<span className="text-white/40">/month</span>
										</div>
									</div>

									<div className="flex-1 space-y-4 mb-8">
										<FeatureItem
											label={`${f.requestsPerMonth === -1
												? "Unlimited"
												: f.requestsPerMonth.toLocaleString()
												} Protected Requests/mo`}
										/>
										<FeatureItem
											label={`${f.maxProviders === -1 ? "Unlimited" : f.maxProviders
												} LLM Providers`}
										/>
										<FeatureItem
											label={`${f.maxMembers === -1 ? "Unlimited" : f.maxMembers
												} Team Members`}
										/>
										<FeatureItem
											label={`${f.retentionDays} Days Security Logs`}
										/>
										<FeatureItem
											label="Custom Security Rules"
											included={f.customRules}
										/>
										<FeatureItem
											label="ML-Based Detection"
											included={f.advancedDetection}
										/>
										<FeatureItem
											label="Audit Logs & Analytics"
											included={f.auditLogs}
										/>
										<FeatureItem
											label="Single Sign-On (SSO)"
											included={f.sso}
										/>
										<FeatureItem
											label="Priority Support"
											included={f.prioritySupport}
										/>
									</div>

									<Link
										to="/login"
										className={`w-full py-3 rounded-xl font-bold text-center transition-all ${plan.id === "beam"
											? "bg-electric-blue text-white hover:bg-electric-blue/90 hover:shadow-lg hover:shadow-electric-blue/20"
											: "bg-white/10 text-white hover:bg-white/20 border border-white/5"
											}`}
									>
										{plan.price === 0 ? "Get Started" : "Subscribe"}
									</Link>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			<footer className="border-t border-white/10 py-12 bg-[#050a14] relative z-20">
				<div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
					<div className="flex items-center gap-2">
						<img src="/logo-padlock.png" alt="KoreShield Logo" className="w-8" />
						<span className="font-bold font-manrope">KoreShield</span>
					</div>
					<div className="text-white/40 text-sm font-manrope">
						© {new Date().getFullYear()} KoreShield Inc. All rights reserved.
					</div>
					<div className="flex gap-6 text-white/60 font-manrope">
						<a href="https://twitter.com/koreshield" target="_blank" className="hover:text-white transition-colors">
							Twitter
						</a>
						<a href="https://github.com/koreshield/koreshield" target="_blank" className="hover:text-white transition-colors">
							GitHub
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}

function FeatureItem({
	label,
	included = true,
}: {
	label: string;
	included?: boolean;
}) {
	return (
		<div className="flex items-center gap-3 text-sm">
			{included ? (
				<div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
					<Check size={12} className="text-white" />
				</div>
			) : (
				<div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0">
					<X size={12} className="text-white/20" />
				</div>
			)}
			<span className={included ? "text-white/80" : "text-white/40"}>
				{label}
			</span>
		</div>
	);
}
