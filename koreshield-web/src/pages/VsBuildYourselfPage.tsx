import { motion } from 'framer-motion';
import { Clock, DollarSign, Shield, TrendingUp, AlertTriangle, CheckCircle, Code } from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';

export default function VsBuildYourselfPage() {
	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
			<SEOMeta
				title="KoreShield vs Building Your Own"
				description="Should you build your own LLM security solution or use KoreShield? Compare costs, time investment, maintenance burden, and long-term TCO."
			/>

			{/* Hero */}
			<section className="py-20 px-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-center"
					>
						<h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
							Build vs Buy: The Real Cost
						</h1>
						<p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
							An honest analysis of building your own LLM security vs using KoreShield
						</p>
					</motion.div>
				</div>
			</section>

			<div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
				{/* Cost Comparison */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8"
				>
					<div className="flex items-center gap-3 mb-6">
						<DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
						<h2 className="text-3xl font-bold text-gray-900 dark:text-white">Total Cost of Ownership (Year 1)</h2>
					</div>
					<div className="grid md:grid-cols-2 gap-8">
						<div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-6 border-2 border-red-200 dark:border-red-900">
							<h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Building In-House</h3>
							<div className="space-y-3">
								<div className="flex justify-between items-center">
									<span className="text-gray-700 dark:text-gray-300">Initial Development (2 engineers × 6 months)</span>
									<span className="font-bold text-gray-900 dark:text-white">$180,000</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-gray-700 dark:text-gray-300">Ongoing Maintenance (1 engineer)</span>
									<span className="font-bold text-gray-900 dark:text-white">$120,000</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-gray-700 dark:text-gray-300">Infrastructure & Tools</span>
									<span className="font-bold text-gray-900 dark:text-white">$24,000</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-gray-700 dark:text-gray-300">Security Research & Updates</span>
									<span className="font-bold text-gray-900 dark:text-white">$36,000</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-gray-700 dark:text-gray-300">Opportunity Cost (delayed features)</span>
									<span className="font-bold text-gray-900 dark:text-white">$100,000+</span>
								</div>
								<div className="pt-3 border-t border-red-300 dark:border-red-800 flex justify-between items-center">
									<span className="font-bold text-lg text-gray-900 dark:text-white">Total Year 1:</span>
									<span className="font-bold text-2xl text-red-600 dark:text-red-400">$460,000+</span>
								</div>
							</div>
						</div>

						<div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-6 border-2 border-green-200 dark:border-green-900">
							<h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">Using KoreShield</h3>
							<div className="space-y-3">
								<div className="flex justify-between items-center">
									<span className="text-gray-700 dark:text-gray-300">KoreShield Enterprise License</span>
									<span className="font-bold text-gray-900 dark:text-white">$50,000</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-gray-700 dark:text-gray-300">Integration Time (1 week)</span>
									<span className="font-bold text-gray-900 dark:text-white">$3,500</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-gray-700 dark:text-gray-300">Infrastructure</span>
									<span className="font-bold text-gray-900 dark:text-white">$12,000</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-gray-700 dark:text-gray-300">Maintenance</span>
									<span className="font-bold text-gray-900 dark:text-white">$0</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-gray-700 dark:text-gray-300">Opportunity Cost</span>
									<span className="font-bold text-gray-900 dark:text-white">$0</span>
								</div>
								<div className="pt-3 border-t border-green-300 dark:border-green-800 flex justify-between items-center">
									<span className="font-bold text-lg text-gray-900 dark:text-white">Total Year 1:</span>
									<span className="font-bold text-2xl text-green-600 dark:text-green-400">$65,500</span>
								</div>
							</div>
							<div className="mt-6 pt-6 border-t border-green-300 dark:border-green-800">
								<div className="text-center">
									<div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">Save $394,500</div>
									<div className="text-sm text-gray-600 dark:text-gray-400">85% cost reduction in Year 1</div>
								</div>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Time to Market */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8"
				>
					<div className="flex items-center gap-3 mb-6">
						<Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
						<h2 className="text-3xl font-bold text-gray-900 dark:text-white">Time to Production</h2>
					</div>
					<div className="grid md:grid-cols-2 gap-8">
						<div>
							<h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Building In-House: 6-12 Months</h3>
							<ul className="space-y-3 text-gray-700 dark:text-gray-300">
								<li className="flex gap-3">
									<span className="text-red-500">Month 1-2:</span>
									<span>Research attacks, design architecture</span>
								</li>
								<li className="flex gap-3">
									<span className="text-red-500">Month 3-4:</span>
									<span>Build detection engine, test patterns</span>
								</li>
								<li className="flex gap-3">
									<span className="text-red-500">Month 5-6:</span>
									<span>Add enterprise features (RBAC, multi-tenancy)</span>
								</li>
								<li className="flex gap-3">
									<span className="text-red-500">Month 7-8:</span>
									<span>Build monitoring, alerting, dashboards</span>
								</li>
								<li className="flex gap-3">
									<span className="text-red-500">Month 9-10:</span>
									<span>Security testing, performance tuning</span>
								</li>
								<li className="flex gap-3">
									<span className="text-red-500">Month 11-12:</span>
									<span>Documentation, training, deployment</span>
								</li>
							</ul>
						</div>
						<div>
							<h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4">Using KoreShield: 1 Week</h3>
							<ul className="space-y-3 text-gray-700 dark:text-gray-300">
								<li className="flex gap-3">
									<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
									<span><strong>Day 1:</strong> Install and basic setup</span>
								</li>
								<li className="flex gap-3">
									<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
									<span><strong>Day 2-3:</strong> Configure policies and rules</span>
								</li>
								<li className="flex gap-3">
									<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
									<span><strong>Day 4-5:</strong> Integration and testing</span>
								</li>
								<li className="flex gap-3">
									<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
									<span><strong>Day 6-7:</strong> Deploy to production</span>
								</li>
								<li className="flex gap-3 mt-6">
									<TrendingUp className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
									<span><strong>Week 2+:</strong> Focus on building product features instead</span>
								</li>
							</ul>
							<div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
								<div className="text-center">
									<div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">48x Faster</div>
									<div className="text-sm text-gray-600 dark:text-gray-400">From 12 months to 1 week</div>
								</div>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Hidden Costs */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
					className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8"
				>
					<div className="flex items-center gap-3 mb-6">
						<AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
						<h2 className="text-3xl font-bold text-gray-900 dark:text-white">Hidden Costs of Building</h2>
					</div>
					<div className="grid md:grid-cols-2 gap-6">
						<div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-6 border border-orange-200 dark:border-orange-900">
							<h3 className="font-bold text-gray-900 dark:text-white mb-3">Ongoing Maintenance</h3>
							<ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
								<li>• New attack vectors emerge weekly</li>
								<li>• LLM providers update APIs frequently</li>
								<li>• Bug fixes and performance optimization</li>
								<li>• Documentation and onboarding</li>
								<li>• <strong>Estimated: $120K/year ongoing</strong></li>
							</ul>
						</div>
						<div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-6 border border-orange-200 dark:border-orange-900">
							<h3 className="font-bold text-gray-900 dark:text-white mb-3">Technical Debt</h3>
							<ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
								<li>• Code becomes unmaintainable over time</li>
								<li>• Original developers leave the company</li>
								<li>• Refactoring required every 12-18 months</li>
								<li>• Testing and security audits</li>
								<li>• <strong>Estimated: $50K-100K/year</strong></li>
							</ul>
						</div>
						<div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-6 border border-orange-200 dark:border-orange-900">
							<h3 className="font-bold text-gray-900 dark:text-white mb-3">Opportunity Cost</h3>
							<ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
								<li>• Engineers not building product features</li>
								<li>• Delayed time-to-market (6-12 months)</li>
								<li>• Lost competitive advantage</li>
								<li>• Potential customer churn during delays</li>
								<li>• <strong>Estimated: $100K-500K+</strong></li>
							</ul>
						</div>
						<div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-6 border border-orange-200 dark:border-orange-900">
							<h3 className="font-bold text-gray-900 dark:text-white mb-3">Lower Detection Quality</h3>
							<ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
								<li>• Your team lacks specialized security expertise</li>
								<li>• No research team tracking new attacks</li>
								<li>• Lower accuracy (70-80% vs 95%+)</li>
								<li>• Higher false positive/negative rates</li>
								<li>• <strong>Risk: $4.5M average breach cost</strong></li>
							</ul>
						</div>
					</div>
				</motion.div>

				{/* What You Get with KoreShield */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8"
				>
					<div className="flex items-center gap-3 mb-6">
						<Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
						<h2 className="text-3xl font-bold text-gray-900 dark:text-white">What's Included in KoreShield</h2>
					</div>
					<div className="grid md:grid-cols-3 gap-6">
						<div className="space-y-3">
							<h3 className="font-bold text-gray-900 dark:text-white">Core Features</h3>
							<ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
								<li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1" /> 95%+ detection accuracy</li>
								<li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1" /> 10+ attack types covered</li>
								<li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1" /> Multi-provider support</li>
								<li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1" /> Real-time detection (10-50ms)</li>
								<li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1" /> Custom rule engine</li>
								<li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1" /> Blocklist/allowlist management</li>
							</ul>
						</div>
						<div className="space-y-3">
							<h3 className="font-bold text-gray-900 dark:text-white">Enterprise Features</h3>
							<ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
								<li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1" /> Multi-tenancy with isolation</li>
								<li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1" /> RBAC and policies</li>
								<li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1" /> Complete audit logs</li>
								<li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1" /> Prometheus metrics</li>
								<li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1" /> Grafana dashboards</li>
								<li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1" /> Alert integrations</li>
							</ul>
						</div>
						<div className="space-y-3">
							<h3 className="font-bold text-gray-900 dark:text-white">Support & Updates</h3>
							<ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
								<li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1" /> Weekly pattern updates</li>
								<li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1" /> Research team tracking threats</li>
								<li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1" /> Professional support</li>
								<li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1" /> SLA guarantees</li>
								<li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1" /> Complete documentation</li>
								<li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1" /> SDK for Python & JS</li>
							</ul>
						</div>
					</div>
				</motion.div>

				{/* ROI Calculator */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5 }}
					className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-8"
				>
					<h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">3-Year Total Cost of Ownership</h2>
					<div className="grid md:grid-cols-2 gap-8">
						<div className="bg-white dark:bg-gray-900 rounded-lg p-6">
							<h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Build In-House</h3>
							<div className="space-y-2 text-gray-700 dark:text-gray-300">
								<div className="flex justify-between"><span>Year 1:</span><span className="font-bold">$460,000</span></div>
								<div className="flex justify-between"><span>Year 2:</span><span className="font-bold">$220,000</span></div>
								<div className="flex justify-between"><span>Year 3:</span><span className="font-bold">$250,000</span></div>
								<div className="pt-3 border-t border-gray-300 dark:border-gray-700 flex justify-between">
									<span className="font-bold">3-Year Total:</span>
									<span className="font-bold text-2xl text-red-600 dark:text-red-400">$930,000</span>
								</div>
							</div>
						</div>
						<div className="bg-white dark:bg-gray-900 rounded-lg p-6">
							<h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4">Use KoreShield</h3>
							<div className="space-y-2 text-gray-700 dark:text-gray-300">
								<div className="flex justify-between"><span>Year 1:</span><span className="font-bold">$65,500</span></div>
								<div className="flex justify-between"><span>Year 2:</span><span className="font-bold">$60,000</span></div>
								<div className="flex justify-between"><span>Year 3:</span><span className="font-bold">$70,000</span></div>
								<div className="pt-3 border-t border-gray-300 dark:border-gray-700 flex justify-between">
									<span className="font-bold">3-Year Total:</span>
									<span className="font-bold text-2xl text-green-600 dark:text-green-400">$195,500</span>
								</div>
							</div>
						</div>
					</div>
					<div className="mt-8 text-center">
						<div className="inline-block bg-white dark:bg-gray-900 rounded-lg p-6">
							<div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">Save $734,500</div>
							<div className="text-lg text-gray-600 dark:text-gray-400">79% cost reduction over 3 years</div>
						</div>
					</div>
				</motion.div>

				{/* CTA */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
					className="bg-blue-600 dark:bg-blue-900 rounded-xl p-8 text-center text-white"
				>
					<h2 className="text-3xl font-bold mb-4">Focus on Building Your Product</h2>
					<p className="text-xl mb-6 text-blue-100">
						Let us handle LLM security so you can ship faster and save hundreds of thousands
					</p>
					<div className="flex flex-wrap justify-center gap-4">
						<a
							href="/pricing"
							className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
						>
							<DollarSign className="w-5 h-5" />
							View Pricing
						</a>
						<a
							href="https://docs.koreshield.com/getting-started/installation"
							className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-colors"
						>
							<Code className="w-5 h-5" />
							Get Started Free
						</a>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
