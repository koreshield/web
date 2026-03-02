import { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../components/ToastNotification';
import { SEOMeta } from '../components/SEOMeta';
import { SEOConfig } from '../lib/seo-config';

const supportOptions = [
	{
		icon: (
			<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
				/>
			</svg>
		),
		title: 'Community Support',
		description: 'Join our Discord community for peer support, share experiences, and get help from other developers.',
		cta: 'Join Discord',
		link: 'https://discord.gg/koreshield',
	},
	{
		icon: (
			<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
				/>
			</svg>
		),
		title: 'Email Support',
		description: 'For technical support, bug reports, or feature requests, reach out to our engineering team.',
		cta: 'Email Us',
		link: 'mailto:support@koreshield.com',
	},
	{
		icon: (
			<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
				/>
			</svg>
		),
		title: 'Documentation',
		description: 'Comprehensive guides, API references, and tutorials to help you get the most out of KoreShield.',
		cta: 'Browse Docs',
		link: 'https://docs.koreshield.com',
	},
	{
		icon: (
			<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
				/>
			</svg>
		),
		title: 'GitHub Issues',
		description: 'Report bugs, request features, or contribute to the open-source project on GitHub.',
		cta: 'View on GitHub',
		link: 'https://github.com/koreshield/',
	},
];

export default function ContactPage() {
	const [activeTab, setActiveTab] = useState<'general' | 'enterprise' | 'technical'>('general');

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
			<SEOMeta {...SEOConfig.contact} />

			{/* Hero Section */}
			<section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
				<div className="max-w-7xl mx-auto text-center">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
					>
						<h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
							Get in Touch
						</h1>
						<p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
							Whether you're a developer, enterprise customer, or just curious about KoreShield, we're here to help.
						</p>
					</motion.div>
				</div>
			</section>

			{/* Support Options */}
			<section className="py-20 px-4">
				<div className="max-w-7xl mx-auto">
					<h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
						How Can We Help?
					</h2>

					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
						{supportOptions.map((option, index) => (
							<motion.div
								key={option.title}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow"
							>
								<div className="text-blue-600 dark:text-blue-400 mb-4">{option.icon}</div>
								<h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
									{option.title}
								</h3>
								<p className="text-gray-600 dark:text-gray-400 mb-6">{option.description}</p>
								<a
									href={option.link}
									className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
								>
									{option.cta}
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 5l7 7-7 7"
										/>
									</svg>
								</a>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Contact Forms */}
			<section className="py-20 px-4 bg-white dark:bg-gray-900">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
						Send Us a Message
					</h2>

					{/* Tab Navigation */}
					<div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-800">
						<button
							onClick={() => setActiveTab('general')}
							className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'general'
								? 'border-blue-600 text-blue-600 dark:text-blue-400'
								: 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
								}`}
						>
							General Enquiry
						</button>
						<button
							onClick={() => setActiveTab('enterprise')}
							className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'enterprise'
								? 'border-blue-600 text-blue-600 dark:text-blue-400'
								: 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
								}`}
						>
							Enterprise Sales
						</button>
						<button
							onClick={() => setActiveTab('technical')}
							className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'technical'
								? 'border-blue-600 text-blue-600 dark:text-blue-400'
								: 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
								}`}
						>
							Technical Support
						</button>
					</div>

					{/* Form Content */}
					{activeTab === 'general' && <GeneralContactForm />}
					{activeTab === 'enterprise' && <EnterpriseContactForm />}
					{activeTab === 'technical' && <TechnicalSupportForm />}
				</div>
			</section>


		</div>
	);
}

function GeneralContactForm() {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		subject: '',
		message: '',
	});
	const [loading, setLoading] = useState(false);
	const toast = useToast();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1500));

		toast.success('Message sent!', 'We\'ll get back to you within 24-48 hours.');

		setFormData({ name: '', email: '', subject: '', message: '' });
		setLoading(false);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="grid md:grid-cols-2 gap-6">
				<div>
					<label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Full Name *
					</label>
					<input
						type="text"
						id="name"
						required
						value={formData.name}
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
						className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
					/>
				</div>
				<div>
					<label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Email Address *
					</label>
					<input
						type="email"
						id="email"
						required
						value={formData.email}
						onChange={(e) => setFormData({ ...formData, email: e.target.value })}
						className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
					/>
				</div>
			</div>

			<div>
				<label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Subject *
				</label>
				<input
					type="text"
					id="subject"
					required
					value={formData.subject}
					onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
					className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
				/>
			</div>

			<div>
				<label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Message *
				</label>
				<textarea
					id="message"
					required
					rows={6}
					value={formData.message}
					onChange={(e) => setFormData({ ...formData, message: e.target.value })}
					className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{loading ? 'Sending...' : 'Send Message'}
			</button>
		</form>
	);
}

function EnterpriseContactForm() {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		company: '',
		companySize: '1-10',
		role: '',
		requestVolume: '',
		message: '',
	});
	const [loading, setLoading] = useState(false);
	const toast = useToast();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		await new Promise((resolve) => setTimeout(resolve, 1500));

		toast.success('Enquiry received!', 'Our enterprise team will contact you within 24 hours.');

		setFormData({
			name: '',
			email: '',
			company: '',
			companySize: '1-10',
			role: '',
			requestVolume: '',
			message: '',
		});
		setLoading(false);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="grid md:grid-cols-2 gap-6">
				<div>
					<label htmlFor="ent-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Full Name *
					</label>
					<input
						type="text"
						id="ent-name"
						required
						value={formData.name}
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
						className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
					/>
				</div>
				<div>
					<label htmlFor="ent-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Work Email *
					</label>
					<input
						type="email"
						id="ent-email"
						required
						value={formData.email}
						onChange={(e) => setFormData({ ...formData, email: e.target.value })}
						className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
					/>
				</div>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div>
					<label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Company Name *
					</label>
					<input
						type="text"
						id="company"
						required
						value={formData.company}
						onChange={(e) => setFormData({ ...formData, company: e.target.value })}
						className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
					/>
				</div>
				<div>
					<label htmlFor="companySize" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Company Size
					</label>
					<select
						id="companySize"
						value={formData.companySize}
						onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
						className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
					>
						<option value="1-10">1-10 employees</option>
						<option value="11-50">11-50 employees</option>
						<option value="51-200">51-200 employees</option>
						<option value="201-1000">201-1,000 employees</option>
						<option value="1000+">1,000+ employees</option>
					</select>
				</div>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<div>
					<label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Your Role
					</label>
					<input
						type="text"
						id="role"
						value={formData.role}
						onChange={(e) => setFormData({ ...formData, role: e.target.value })}
						placeholder="e.g. CTO, Engineering Manager"
						className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
					/>
				</div>
				<div>
					<label htmlFor="requestVolume" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Expected Monthly Volume
					</label>
					<input
						type="text"
						id="requestVolume"
						value={formData.requestVolume}
						onChange={(e) => setFormData({ ...formData, requestVolume: e.target.value })}
						placeholder="e.g. 5M requests/month"
						className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
					/>
				</div>
			</div>

			<div>
				<label htmlFor="ent-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Tell us about your requirements
				</label>
				<textarea
					id="ent-message"
					rows={6}
					value={formData.message}
					onChange={(e) => setFormData({ ...formData, message: e.target.value })}
					placeholder="What are your security goals? Any compliance requirements? Timeline for deployment?"
					className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{loading ? 'Sending...' : 'Request Enterprise Demo'}
			</button>

			<p className="text-sm text-gray-600 dark:text-gray-400 text-center">
				Typical response time: Within 24 hours on business days
			</p>
		</form>
	);
}

function TechnicalSupportForm() {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		tier: 'open-source',
		severity: 'low',
		category: 'bug',
		subject: '',
		description: '',
		environment: '',
	});
	const [loading, setLoading] = useState(false);
	const toast = useToast();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		await new Promise((resolve) => setTimeout(resolve, 1500));

		toast.success('Support ticket created!', 'Our technical team will review your issue shortly.');

		setFormData({
			name: '',
			email: '',
			tier: 'open-source',
			severity: 'low',
			category: 'bug',
			subject: '',
			description: '',
			environment: '',
		});
		setLoading(false);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="grid md:grid-cols-2 gap-6">
				<div>
					<label htmlFor="tech-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Full Name *
					</label>
					<input
						type="text"
						id="tech-name"
						required
						value={formData.name}
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
						className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
					/>
				</div>
				<div>
					<label htmlFor="tech-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Email Address *
					</label>
					<input
						type="email"
						id="tech-email"
						required
						value={formData.email}
						onChange={(e) => setFormData({ ...formData, email: e.target.value })}
						className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
					/>
				</div>
			</div>

			<div className="grid md:grid-cols-3 gap-6">
				<div>
					<label htmlFor="tier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Your Tier
					</label>
					<select
						id="tier"
						value={formData.tier}
						onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
						className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
					>
						<option value="open-source">Open Source</option>
						<option value="startup">Startup</option>
						<option value="growth">Growth</option>
						<option value="enterprise">Enterprise</option>
					</select>
				</div>
				<div>
					<label htmlFor="severity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Severity
					</label>
					<select
						id="severity"
						value={formData.severity}
						onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
						className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
					>
						<option value="low">Low</option>
						<option value="medium">Medium</option>
						<option value="high">High</option>
						<option value="critical">Critical</option>
					</select>
				</div>
				<div>
					<label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Category
					</label>
					<select
						id="category"
						value={formData.category}
						onChange={(e) => setFormData({ ...formData, category: e.target.value })}
						className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
					>
						<option value="bug">Bug Report</option>
						<option value="feature">Feature Request</option>
						<option value="integration">Integration Issue</option>
						<option value="performance">Performance</option>
						<option value="security">Security Question</option>
						<option value="other">Other</option>
					</select>
				</div>
			</div>

			<div>
				<label htmlFor="tech-subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Subject *
				</label>
				<input
					type="text"
					id="tech-subject"
					required
					value={formData.subject}
					onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
					placeholder="Brief description of the issue"
					className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
				/>
			</div>

			<div>
				<label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Description *
				</label>
				<textarea
					id="description"
					required
					rows={6}
					value={formData.description}
					onChange={(e) => setFormData({ ...formData, description: e.target.value })}
					placeholder="Please provide detailed steps to reproduce, error messages, and expected vs actual behaviour"
					className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
				/>
			</div>

			<div>
				<label htmlFor="environment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Environment Details
				</label>
				<textarea
					id="environment"
					rows={3}
					value={formData.environment}
					onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
					placeholder="KoreShield version, deployment method (Docker/Python), Python/Node version, OS, etc."
					className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{loading ? 'Submitting...' : 'Submit Support Ticket'}
			</button>

			<p className="text-sm text-gray-600 dark:text-gray-400 text-center">
				Response times vary by tier. Enterprise customers get 24/7 priority support.
			</p>
		</form>
	);
}
