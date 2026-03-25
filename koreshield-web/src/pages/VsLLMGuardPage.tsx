import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Code, ExternalLink, GitBranch, Shield, XCircle } from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';

export default function VsLLMGuardPage() {
	return (
		<div className="min-h-screen bg-background">
			<SEOMeta
				title="KoreShield vs LLM Guard"
				description="Compare KoreShield and LLM Guard: enterprise features, detection accuracy, support options, and when to choose each solution."
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
							KoreShield vs LLM Guard
						</h1>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
							Comparing two LLM security solutions with different deployment models
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
							Enterprise-ready LLM security with 95% detection accuracy, professional support, and managed cloud option.
						</p>
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-green-600 dark:text-green-400">
								<CheckCircle className="w-5 h-5" />
								<span>95%+ detection accuracy</span>
							</div>
							<div className="flex items-center gap-2 text-green-600 dark:text-green-400">
								<CheckCircle className="w-5 h-5" />
								<span>Enterprise features (RBAC, multi-tenancy)</span>
							</div>
							<div className="flex items-center gap-2 text-green-600 dark:text-green-400">
								<CheckCircle className="w-5 h-5" />
								<span>Professional support & SLAs</span>
							</div>
							<div className="flex items-center gap-2 text-green-600 dark:text-green-400">
								<CheckCircle className="w-5 h-5" />
								<span>Managed cloud option</span>
							</div>
						</div>
					</div>

					<div className="bg-card rounded-xl shadow-lg border border-border p-8">
						<div className="flex items-center gap-3 mb-4">
							<GitBranch className="w-8 h-8 text-electric-green" />
							<h2 className="text-2xl font-bold text-foreground">LLM Guard</h2>
						</div>
						<p className="text-muted-foreground mb-4">
							Community-driven LLM security toolkit with basic detection capabilities and MIT license.
						</p>
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-green-600 dark:text-green-400">
								<CheckCircle className="w-5 h-5" />
								<span>100% free to use</span>
							</div>
							<div className="flex items-center gap-2 text-green-600 dark:text-green-400">
								<CheckCircle className="w-5 h-5" />
								<span>Active community contributions</span>
							</div>
							<div className="flex items-center gap-2 text-red-600 dark:text-red-400">
								<XCircle className="w-5 h-5" />
								<span>~75% detection accuracy</span>
							</div>
							<div className="flex items-center gap-2 text-red-600 dark:text-red-400">
								<XCircle className="w-5 h-5" />
								<span>No professional support or SLAs</span>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Feature Comparison */}
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
										<th className="text-center py-4 px-4 text-green-600 dark:text-green-400 font-semibold">LLM Guard</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									<tr>
										<td className="py-4 px-4 text-foreground font-medium">Detection Accuracy</td>
										<td className="py-4 px-4 text-center text-foreground font-semibold">95%+</td>
										<td className="py-4 px-4 text-center text-foreground">~75%</td>
									</tr>
									<tr>
										<td className="py-4 px-4 text-foreground font-medium">Multi-Tenancy</td>
										<td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
										<td className="py-4 px-4 text-center"><XCircle className="w-6 h-6 text-red-500 mx-auto" /></td>
									</tr>
									<tr>
										<td className="py-4 px-4 text-foreground font-medium">RBAC & Policies</td>
										<td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
										<td className="py-4 px-4 text-center"><XCircle className="w-6 h-6 text-red-500 mx-auto" /></td>
									</tr>
									<tr>
										<td className="py-4 px-4 text-foreground font-medium">Audit Logs</td>
										<td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
										<td className="py-4 px-4 text-center"><XCircle className="w-6 h-6 text-red-500 mx-auto" /></td>
									</tr>
									<tr>
										<td className="py-4 px-4 text-foreground font-medium">Professional Support</td>
										<td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
										<td className="py-4 px-4 text-center"><XCircle className="w-6 h-6 text-red-500 mx-auto" /></td>
									</tr>
									<tr>
										<td className="py-4 px-4 text-foreground font-medium">SLA Guarantees</td>
										<td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
										<td className="py-4 px-4 text-center"><XCircle className="w-6 h-6 text-red-500 mx-auto" /></td>
									</tr>
									<tr>
										<td className="py-4 px-4 text-foreground font-medium">Managed Cloud Option</td>
										<td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
										<td className="py-4 px-4 text-center"><XCircle className="w-6 h-6 text-red-500 mx-auto" /></td>
									</tr>
									<tr>
										<td className="py-4 px-4 text-foreground font-medium">Documentation Quality</td>
										<td className="py-4 px-4 text-center text-foreground">Excellent</td>
										<td className="py-4 px-4 text-center text-foreground">Basic</td>
									</tr>
									<tr>
										<td className="py-4 px-4 text-foreground font-medium">Compliance Ready</td>
										<td className="py-4 px-4 text-center"><CheckCircle className="w-6 h-6 text-green-500 mx-auto" /></td>
										<td className="py-4 px-4 text-center"><XCircle className="w-6 h-6 text-red-500 mx-auto" /></td>
									</tr>
								
								</tbody>
							</table>
						</div>
					</div>
				</motion.div>

				{/* Use Case Comparison */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
					className="grid md:grid-cols-2 gap-8"
				>
					<div className="bg-card rounded-xl shadow-lg border border-border p-8">
						<h3 className="text-2xl font-bold text-electric-green mb-6">KoreShield Best For:</h3>
						<ul className="space-y-3">
							<li className="flex gap-3">
								<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
								<div>
									<strong className="text-foreground">Enterprise Production</strong>
									<p className="text-muted-foreground text-sm">Need SLAs, support, and compliance</p>
								</div>
							</li>
							<li className="flex gap-3">
								<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
								<div>
									<strong className="text-foreground">SaaS Deployments</strong>
									<p className="text-muted-foreground text-sm">Require account isolation and RBAC</p>
								</div>
							</li>
							<li className="flex gap-3">
								<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
								<div>
									<strong className="text-foreground">Regulated Industries</strong>
									<p className="text-muted-foreground text-sm">Healthcare, finance, legal requiring audit logs</p>
								</div>
							</li>
							<li className="flex gap-3">
								<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
								<div>
									<strong className="text-foreground">High Accuracy Needs</strong>
									<p className="text-muted-foreground text-sm">95%+ detection rate required</p>
								</div>
							</li>
						</ul>
					</div>

					<div className="bg-card rounded-xl shadow-lg border border-border p-8">
						<h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-6">LLM Guard Best For:</h3>
						<ul className="space-y-3">
							<li className="flex gap-3">
								<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
								<div>
									<strong className="text-foreground">Hobby Projects</strong>
									<p className="text-muted-foreground text-sm">Personal projects and learning</p>
								</div>
							</li>
							<li className="flex gap-3">
								<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
								<div>
									<strong className="text-foreground">Proof of Concept</strong>
									<p className="text-muted-foreground text-sm">Testing and prototyping</p>
								</div>
							</li>
							<li className="flex gap-3">
								<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
								<div>
									<strong className="text-foreground">Learning LLM Security</strong>
									<p className="text-muted-foreground text-sm">Educational purposes</p>
								</div>
							</li>
							<li className="flex gap-3">
								<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
								<div>
									<strong className="text-foreground">Basic Detection</strong>
									<p className="text-muted-foreground text-sm">Simple use cases, low-stakes applications</p>
								</div>
							</li>
						</ul>
					</div>
				</motion.div>

				{/* Migration Path */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="bg-card border border-border rounded-xl p-8"
				>
					<h2 className="text-3xl font-bold text-foreground mb-6">Easy Migration from LLM Guard</h2>
					<p className="text-muted-foreground mb-6">
						Already using LLM Guard? KoreShield offers a straightforward migration path with minimal code changes.
					</p>
					<div className="grid md:grid-cols-3 gap-6">
						<div className="bg-card rounded-lg p-6">
							<div className="text-3xl font-bold text-electric-green mb-2">1</div>
							<h3 className="font-semibold text-foreground mb-2">Install KoreShield</h3>
							<p className="text-sm text-muted-foreground">
								<code className="bg-muted px-2 py-1 rounded">pip install koreshield-sdk</code>
							</p>
						</div>
						<div className="bg-card rounded-lg p-6">
							<div className="text-3xl font-bold text-electric-green mb-2">2</div>
							<h3 className="font-semibold text-foreground mb-2">Update Import</h3>
							<p className="text-sm text-muted-foreground">
								Replace LLM Guard imports with KoreShield SDK
							</p>
						</div>
						<div className="bg-card rounded-lg p-6">
							<div className="text-3xl font-bold text-electric-green mb-2">3</div>
							<h3 className="font-semibold text-foreground mb-2">Deploy</h3>
							<p className="text-sm text-muted-foreground">
								Enjoy higher accuracy and enterprise features
							</p>
						</div>
					</div>
				</motion.div>

				{/* CTA */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5 }}
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
