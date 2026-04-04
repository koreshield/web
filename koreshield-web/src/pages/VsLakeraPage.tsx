import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Code, DollarSign, ExternalLink, Minus, Shield, XCircle } from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';

export default function VsLakeraPage() {
	return (
		<div className="min-h-screen bg-background">
			<SEOMeta
				title="KoreShield vs Lakera Guard"
				description="Compare KoreShield and Lakera Guard: features, pricing, and which LLM security solution is right for your needs."
			/>

			{/* Hero */}
			<section className="py-20 px-4 bg-background relative ambient-glow">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-center"
					>
						<h1 className="text-5xl font-bold text-foreground mb-6">
							KoreShield vs Lakera Guard
						</h1>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
							An honest comparison of two leading LLM security solutions
						</p>
					</motion.div>
				</div>
			</section>

			<div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
				{/* Quick Summary */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="grid md:grid-cols-2 gap-8"
				>
					<div className="bg-card rounded-xl shadow-lg border border-border p-8">
						<div className="flex items-center gap-3 mb-4">
							<Shield className="w-8 h-8 text-electric-green" />
							<h2 className="text-2xl font-bold text-foreground">KoreShield</h2>
						</div>
						<p className="text-muted-foreground mb-4">
							Enterprise-grade LLM security with 95% detection accuracy and multi-provider support.
						</p>
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-green-600 dark:text-green-400">
								<CheckCircle className="w-5 h-5" />
								<span>Transparent security controls</span>
							</div>
							<div className="flex items-center gap-2 text-green-600 dark:text-green-400">
								<CheckCircle className="w-5 h-5" />
								<span>50-70% lower cost</span>
							</div>
							<div className="flex items-center gap-2 text-green-600 dark:text-green-400">
								<CheckCircle className="w-5 h-5" />
								<span>Self-hosted option</span>
							</div>
							<div className="flex items-center gap-2 text-green-600 dark:text-green-400">
								<CheckCircle className="w-5 h-5" />
								<span>Research-driven innovation</span>
							</div>
						</div>
					</div>

					<div className="bg-card rounded-xl shadow-lg border border-border p-8">
						<div className="flex items-center gap-3 mb-4">
							<Shield className="w-8 h-8 text-purple-600 dark:text-purple-400" />
							<h2 className="text-2xl font-bold text-foreground">Lakera Guard</h2>
						</div>
						<p className="text-muted-foreground mb-4">
							Closed-source enterprise LLM security platform with Fortune 500 customers and proven track record.
						</p>
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-green-600 dark:text-green-400">
								<CheckCircle className="w-5 h-5" />
								<span>First-mover advantage</span>
							</div>
							<div className="flex items-center gap-2 text-green-600 dark:text-green-400">
								<CheckCircle className="w-5 h-5" />
								<span>Enterprise-focused</span>
							</div>
							<div className="flex items-center gap-2 text-green-600 dark:text-green-400">
								<CheckCircle className="w-5 h-5" />
								<span>Strong marketing presence</span>
							</div>
							<div className="flex items-center gap-2 text-red-600 dark:text-red-400">
								<XCircle className="w-5 h-5" />
								<span>Closed-source (no transparency)</span>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Feature Comparison Table */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="bg-card rounded-xl shadow-lg border border-border overflow-hidden"
				>
					<div className="p-8">
						<h2 className="text-3xl font-bold text-foreground mb-6">Feature Comparison</h2>
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="border-b border-border">
									<tr>
										<th className="text-left py-4 px-4 text-foreground font-semibold">Feature</th>
										<th className="text-center py-4 px-4 text-electric-green font-semibold">KoreShield</th>
										<th className="text-center py-4 px-4 text-purple-600 dark:text-purple-400 font-semibold">Lakera Guard</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
								
									<tr>
										<td className="py-4 px-4 text-foreground font-medium">Detection Accuracy</td>
										<td className="py-4 px-4 text-center text-foreground">95%+</td>
										<td className="py-4 px-4 text-center text-foreground">~90%</td>
									</tr>
									<tr>
										<td className="py-4 px-4 text-foreground font-medium">Multi-Provider Support</td>
										<td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
										<td className="py-4 px-4 text-center"><Minus className="w-6 h-6 text-yellow-500 mx-auto" /></td>
									</tr>
									<tr>
										<td className="py-4 px-4 text-foreground font-medium">Self-Hosted Option</td>
										<td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
										<td className="py-4 px-4 text-center"><XCircle className="w-6 h-6 text-red-500 mx-auto" /></td>
									</tr>
									<tr>
										<td className="py-4 px-4 text-foreground font-medium">Multi-Tenancy</td>
										<td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
										<td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
									</tr>
									<tr>
										<td className="py-4 px-4 text-foreground font-medium">RBAC</td>
										<td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
										<td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
									</tr>
									<tr>
										<td className="py-4 px-4 text-foreground font-medium">Custom Rules</td>
										<td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
										<td className="py-4 px-4 text-center"><Minus className="w-6 h-6 text-yellow-500 mx-auto" /></td>
									</tr>
									<tr>
										<td className="py-4 px-4 text-foreground font-medium">RAG Protection</td>
										<td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
										<td className="py-4 px-4 text-center"><Minus className="w-6 h-6 text-yellow-500 mx-auto" /></td>
									</tr>
									<tr>
										<td className="py-4 px-4 text-foreground font-medium">Starting Price</td>
										<td className="py-4 px-4 text-center text-foreground font-semibold">£99/mo paid tier</td>
										<td className="py-4 px-4 text-center text-foreground font-semibold">$999/mo</td>
									</tr>
									<tr>
										<td className="py-4 px-4 text-foreground font-medium">Community Support</td>
										<td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
										<td className="py-4 px-4 text-center"><XCircle className="w-6 h-6 text-red-500 mx-auto" /></td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</motion.div>

				{/* Pricing Comparison */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
					className="bg-card rounded-xl shadow-lg border border-border p-8"
				>
					<div className="flex items-center gap-3 mb-6">
						<DollarSign className="w-8 h-8 text-electric-green" />
						<h2 className="text-3xl font-bold text-foreground">Pricing Comparison</h2>
					</div>
					<div className="grid md:grid-cols-2 gap-8">
						<div>
							<h3 className="text-xl font-semibold text-electric-green mb-4">KoreShield</h3>
							<ul className="space-y-3 text-muted-foreground">
								<li>• <strong>£0:</strong> Free tier with 10,000 protected requests</li>
								<li>• <strong>£99/mo:</strong> Growth with 100,000 protected requests</li>
								<li>• <strong>£399/mo:</strong> Scale with 1,000,000 protected requests</li>
								<li>• <strong>From £18k/year:</strong> Enterprise with private deployment and governance controls</li>
								<li>• <strong>Usage-based overages</strong> instead of seat-based pricing</li>
							</ul>
						</div>
						<div>
							<h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-4">Lakera Guard</h3>
							<ul className="space-y-3 text-muted-foreground">
								<li>• <strong>No free tier</strong></li>
								<li>• <strong>$999/mo:</strong> Starting plan</li>
								<li>• <strong>$5K+/mo:</strong> Professional</li>
								<li>• <strong>$50K+/year:</strong> Enterprise (cloud only)</li>
								<li>• <strong>Premium pricing</strong> for enterprise features</li>
							</ul>
						</div>
					</div>
				</motion.div>

				{/* Pros and Cons */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="grid md:grid-cols-2 gap-8"
				>
					<div className="bg-card rounded-xl shadow-lg border border-border p-8">
						<h3 className="text-2xl font-bold text-electric-green mb-6">KoreShield Advantages</h3>
						<ul className="space-y-3">
							<li className="flex gap-3">
								<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
								<span className="text-foreground"><strong>Deployment Flexibility:</strong> Self-hosted and managed options</span>
							</li>
							<li className="flex gap-3">
								<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
								<span className="text-foreground"><strong>Cost:</strong> 50-70% cheaper for similar features</span>
							</li>
							<li className="flex gap-3">
								<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
								<span className="text-foreground"><strong>Flexibility:</strong> Self-hosted or cloud deployment</span>
							</li>
							<li className="flex gap-3">
								<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
								<span className="text-foreground"><strong>Multi-Provider:</strong> Works with all major LLMs</span>
							</li>
							<li className="flex gap-3">
								<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
								<span className="text-foreground"><strong>Community:</strong> Active contributors and support</span>
							</li>
							<li className="flex gap-3">
								<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
								<span className="text-foreground"><strong>Accuracy:</strong> 95%+ detection rate</span>
							</li>
						</ul>
					</div>

					<div className="bg-card rounded-xl shadow-lg border border-border p-8">
						<h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-6">Lakera Guard Advantages</h3>
						<ul className="space-y-3">
							<li className="flex gap-3">
								<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
								<span className="text-foreground"><strong>First-Mover:</strong> Established market presence</span>
							</li>
							<li className="flex gap-3">
								<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
								<span className="text-foreground"><strong>Enterprise Customers:</strong> Fortune 500 validation</span>
							</li>
							<li className="flex gap-3">
								<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
								<span className="text-foreground"><strong>Managed Service:</strong> Fully managed platform</span>
							</li>
							<li className="flex gap-3">
								<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
								<span className="text-foreground"><strong>Marketing:</strong> Strong brand recognition</span>
							</li>
							<li className="flex gap-3">
								<XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
								<span className="text-foreground"><strong>Closed Source:</strong> No code transparency</span>
							</li>
							<li className="flex gap-3">
								<XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
								<span className="text-foreground"><strong>Expensive:</strong> Premium pricing tier</span>
							</li>
						</ul>
					</div>
				</motion.div>

				{/* When to Choose */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5 }}
					className="bg-card border border-border rounded-xl p-8"
				>
					<h2 className="text-3xl font-bold text-foreground mb-8 text-center">Which Should You Choose?</h2>
					<div className="grid md:grid-cols-2 gap-8">
						<div className="bg-card rounded-lg p-6">
							<h3 className="text-xl font-bold text-electric-green mb-4">Choose KoreShield if:</h3>
							<ul className="space-y-2 text-muted-foreground">
								<li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> You value transparency and control</li>
								<li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> You want cost-effective enterprise security</li>
								<li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> You need self-hosted/air-gapped deployment</li>
								<li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> You use multiple LLM providers</li>
								<li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> You want to customize detection rules</li>
								<li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> You're building a startup or mid-market product</li>
							</ul>
						</div>
						<div className="bg-card rounded-lg p-6">
							<h3 className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-4">Choose Lakera Guard if:</h3>
							<ul className="space-y-2 text-muted-foreground">
								<li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" /> You prefer fully managed solutions</li>
								<li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" /> You have a large enterprise budget</li>
								<li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" /> You want proven Fortune 500 validation</li>
								<li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" /> You prioritize brand recognition</li>
								<li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" /> You don't need source code access</li>
								<li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" /> You're okay with cloud-only deployment</li>
							</ul>
						</div>
					</div>
				</motion.div>

				{/* CTA */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
					className="bg-card border border-border rounded-xl p-10 text-center"
				>
					<h2 className="text-3xl font-bold mb-4 text-foreground">Upgrade to KoreShield</h2>
					<p className="text-lg mb-8 text-muted-foreground">
						Get enterprise-ready security with the same security-first values
					</p>
					<div className="flex flex-wrap justify-center gap-4">
						<Link to="/pricing"
							className="inline-flex items-center gap-2 px-6 py-3 bg-electric-green hover:bg-emerald-bright text-white rounded-lg font-semibold transition-colors"
						>
							<Code className="w-5 h-5" />
							Upgrade Now
						</Link>
						<Link to="/playground"
							className="inline-flex items-center gap-2 px-6 py-3 border border-border hover:border-primary/40 bg-background text-foreground rounded-lg font-semibold transition-colors"
						>
							Try Interactive Demo
							<ExternalLink className="w-5 h-5" />
						</Link>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
