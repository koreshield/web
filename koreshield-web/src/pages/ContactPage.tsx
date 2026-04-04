import emailjs from '@emailjs/browser';
import { motion } from 'framer-motion';
import { ArrowRight, FileText, Github, Mail, MessageSquare, Send } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';
import { useToast } from '../components/ToastNotification';
import { getPlanById } from '../lib/pricing';
import { SEOConfig } from '../lib/seo-config';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;
const TEMPLATE_CONTACT =
	(import.meta.env.VITE_EMAILJS_TEMPLATE_ID_CONTACT as string | undefined) ||
	(import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined) ||
	'';
const emailConfigAvailable =
	Boolean(EMAILJS_SERVICE_ID) &&
	Boolean(EMAILJS_PUBLIC_KEY) &&
	Boolean(TEMPLATE_CONTACT);

function buildTemplatePayload(values: {
	name: string;
	email: string;
	company: string;
	tier: string;
	message: string;
}) {
	return {
		name: values.name,
		email: values.email,
		company: values.company,
		tier: values.tier,
		message: values.message,
	};
}

const supportOptions = [
	{
		icon: <MessageSquare className="w-6 h-6" />,
		title: 'Community Discord',
		description: 'Get answers fast from fellow developers and our team. Best for general questions and integration help.',
		cta: 'Join Discord',
		link: 'https://discord.gg/koreshield',
		external: true,
	},
	{
		icon: <Send className="w-6 h-6" />,
		title: 'Telegram Channel',
		description: 'Follow product updates, security notes, and launch announcements from the KoreShield team.',
		cta: 'Join Telegram',
		link: 'https://t.me/koreshield',
		external: true,
	},
	{
		icon: <Mail className="w-6 h-6" />,
		title: 'Email Support',
		description: 'For technical issues, bug reports, or feature requests. Our engineering team reviews every ticket.',
		cta: 'Email Us',
		link: 'mailto:support@koreshield.com',
		external: true,
	},
	{
		icon: <FileText className="w-6 h-6" />,
		title: 'Documentation',
		description: 'Comprehensive guides, API references, and tutorials. Most questions are answered here first.',
		cta: 'Browse Docs',
		link: 'https://docs.koreshield.com',
		external: true,
	},
	{
		icon: <Github className="w-6 h-6" />,
		title: 'GitHub',
		description: 'Report bugs, request features, or follow development progress on our public repositories.',
		cta: 'View on GitHub',
		link: 'https://github.com/koreshield/',
		external: true,
	},
];

export default function ContactPage() {
	const [activeTab, setActiveTab] = useState<'general' | 'technical'>('general');

	return (
		<div className="min-h-screen bg-background text-foreground transition-colors">
			<SEOMeta {...SEOConfig.contact} />

			{/* Hero */}
			<section className="py-24 px-6 relative ambient-glow">
				<div className="max-w-3xl mx-auto text-center relative z-10">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
					>
						<div className="inline-flex items-center gap-2 bg-electric-green/10 border border-electric-green/20 text-electric-green text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">
							<span className="w-1.5 h-1.5 rounded-full bg-electric-green" />
							Contact
						</div>
						<h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-[-0.04em] text-foreground">
							Get in Touch
						</h1>
						<p className="text-lg text-muted-foreground leading-relaxed">
							Evaluating KoreShield, comparing plans, or preparing an enterprise rollout? We are here and we reply fast.
						</p>
					</motion.div>
				</div>
			</section>

			{/* Support channels */}
			<section className="py-16 px-6 border-t border-border">
				<div className="max-w-6xl mx-auto">
					<h2 className="text-2xl font-bold text-foreground mb-8 tracking-tight">How can we help?</h2>
					<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
						{supportOptions.map((option, index) => (
							<motion.a
								key={option.title}
								href={option.link}
								target={option.external ? '_blank' : undefined}
								rel={option.external ? 'noreferrer noopener' : undefined}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.4, delay: index * 0.08 }}
								className="group bg-card border border-border hover:border-primary/40 rounded-xl p-6 transition-all duration-200 hover:-translate-y-0.5 block"
							>
								<div className="text-electric-green mb-4">{option.icon}</div>
								<h3 className="text-base font-semibold text-foreground mb-2">{option.title}</h3>
								<p className="text-sm text-muted-foreground mb-4 leading-relaxed">{option.description}</p>
								<span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary group-hover:gap-2.5 transition-all">
									{option.cta}
									<ArrowRight className="w-3.5 h-3.5" />
								</span>
							</motion.a>
						))}
					</div>
				</div>
			</section>

			{/* Enterprise CTA */}
			<section className="py-10 px-6">
				<div className="max-w-4xl mx-auto">
					<div className="rounded-2xl bg-card border border-white/[0.08] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
						<div>
							<p className="text-xs font-semibold text-electric-green uppercase tracking-wider mb-1">Enterprise</p>
							<h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Scaling AI at enterprise level?</h3>
							<p className="text-muted-foreground max-w-lg text-sm leading-relaxed">
								Talk to our sales team about protected-request volume, dedicated support, SSO, and compliance requirements.
								Typical response within 24 hours.
							</p>
						</div>
						<Link
							to="/pricing"
							className="shrink-0 inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap shadow-md"
						>
							Talk to Sales
							<ArrowRight className="w-4 h-4" />
						</Link>
					</div>
				</div>
			</section>

			{/* Contact Forms */}
			<section className="py-20 px-6 border-t border-border">
				<div className="max-w-3xl mx-auto">
					<h2 className="text-2xl font-bold text-foreground mb-8 tracking-tight">Send us a message</h2>

					{/* Tabs */}
					<div className="flex gap-1 mb-8 p-1 bg-muted/50 rounded-lg w-fit">
						{(['general', 'technical'] as const).map((tab) => (
							<button
								key={tab}
								type="button"
								onClick={() => setActiveTab(tab)}
								className={`px-5 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
									activeTab === tab
										? 'bg-card text-foreground shadow-sm'
										: 'text-muted-foreground hover:text-foreground'
								}`}
							>
								{tab === 'general' ? 'General Enquiry' : 'Technical Support'}
							</button>
						))}
					</div>

					{activeTab === 'general' && <GeneralContactForm />}
					{activeTab === 'technical' && <TechnicalSupportForm />}
				</div>
			</section>
		</div>
	);
}

const inputClass = "w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm transition-colors placeholder:text-muted-foreground/50";
const labelClass = "block text-sm font-medium text-foreground mb-1.5";
const submitClass = "w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm";

function GeneralContactForm() {
	const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
	const [loading, setLoading] = useState(false);
	const toast = useToast();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			if (!emailConfigAvailable) {
				throw new Error('Contact email is not configured in this environment. Please email hello@koreshield.com directly.');
			}

			await emailjs.send(
				EMAILJS_SERVICE_ID,
				TEMPLATE_CONTACT,
				buildTemplatePayload({
					name: formData.name,
					email: formData.email,
					company: 'General enquiry',
					tier: 'general',
					message: `Subject: ${formData.subject}\n\n${formData.message}`,
				}),
				EMAILJS_PUBLIC_KEY,
			);
			toast.success('Message sent!', "We'll get back to you within 24 to 48 hours.");
			setFormData({ name: '', email: '', subject: '', message: '' });
		} catch (err: any) {
			toast.error('Failed to send', err?.text || err?.message || 'Please try again or email hello@koreshield.com directly.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			<div className="grid md:grid-cols-2 gap-5">
				<div>
					<label className={labelClass}>Full name *</label>
					<input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} placeholder="Jane Smith" />
				</div>
				<div>
					<label className={labelClass}>Email address *</label>
					<input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} placeholder="you@company.com" />
				</div>
			</div>
			<div>
				<label className={labelClass}>Subject *</label>
				<input type="text" required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className={inputClass} placeholder="How can we help?" />
			</div>
			<div>
				<label className={labelClass}>Message *</label>
				<textarea required rows={6} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className={inputClass} placeholder="Tell us more…" />
			</div>
			<button type="submit" disabled={loading} className={submitClass}>
				{loading ? 'Sending…' : 'Send message'}
			</button>
		</form>
	);
}

function TechnicalSupportForm() {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		tier: getPlanById('growth')?.name ?? 'Growth',
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
		try {
			if (!emailConfigAvailable) {
				throw new Error('Support email is not configured in this environment. Please email support@koreshield.com directly.');
			}

			await emailjs.send(
				EMAILJS_SERVICE_ID,
				TEMPLATE_CONTACT,
				buildTemplatePayload({
					name: formData.name,
					email: formData.email,
					company: 'Technical support',
					tier: formData.tier,
					message:
						`Severity: ${formData.severity}\n` +
						`Category: ${formData.category}\n` +
						`Subject: ${formData.subject}\n\n` +
						`Description:\n${formData.description}\n\n` +
						`Environment:\n${formData.environment || 'Not provided'}`,
				}),
				EMAILJS_PUBLIC_KEY,
			);
			toast.success('Support ticket created!', 'Our technical team will review your issue shortly.');
			setFormData({
				name: '',
				email: '',
				tier: getPlanById('growth')?.name ?? 'Growth',
				severity: 'low',
				category: 'bug',
				subject: '',
				description: '',
				environment: '',
			});
		} catch (err: any) {
			toast.error('Failed to send', err?.text || err?.message || 'Please try again or email support@koreshield.com directly.');
		} finally {
			setLoading(false);
		}
	};

	const selectClass = `${inputClass} appearance-none`;

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			<div className="grid md:grid-cols-2 gap-5">
				<div>
					<label className={labelClass}>Full name *</label>
					<input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} placeholder="Jane Smith" />
				</div>
				<div>
					<label className={labelClass}>Email address *</label>
					<input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} placeholder="you@company.com" />
				</div>
			</div>
			<div className="grid md:grid-cols-3 gap-5">
				<div>
					<label htmlFor="ts-tier" className={labelClass}>Your tier</label>
					<select id="ts-tier" value={formData.tier} onChange={(e) => setFormData({ ...formData, tier: e.target.value })} className={selectClass}>
						<option value={getPlanById('free')?.name ?? 'Free'}>Free</option>
						<option value={getPlanById('growth')?.name ?? 'Growth'}>Growth</option>
						<option value={getPlanById('scale')?.name ?? 'Scale'}>Scale</option>
						<option value={getPlanById('enterprise')?.name ?? 'Enterprise'}>Enterprise</option>
					</select>
				</div>
				<div>
					<label htmlFor="ts-severity" className={labelClass}>Severity</label>
					<select id="ts-severity" value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value })} className={selectClass}>
						<option value="low">Low</option>
						<option value="medium">Medium</option>
						<option value="high">High</option>
						<option value="critical">Critical</option>
					</select>
				</div>
				<div>
					<label htmlFor="ts-category" className={labelClass}>Category</label>
					<select id="ts-category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={selectClass}>
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
				<label className={labelClass}>Subject *</label>
				<input type="text" required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className={inputClass} placeholder="Brief description of the issue" />
			</div>
			<div>
				<label className={labelClass}>Description *</label>
				<textarea required rows={6} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputClass} placeholder="Steps to reproduce, error messages, expected vs actual behaviour…" />
			</div>
			<div>
				<label className={labelClass}>Environment details</label>
				<textarea rows={3} value={formData.environment} onChange={(e) => setFormData({ ...formData, environment: e.target.value })} className={inputClass} placeholder="KoreShield version, deployment method, Python/Node version, OS…" />
			</div>
			<button type="submit" disabled={loading} className={submitClass}>
				{loading ? 'Submitting…' : 'Submit support ticket'}
			</button>
			<p className="text-xs text-muted-foreground text-center">Response times vary by plan. Enterprise customers receive contract-backed priority support.</p>
		</form>
	);
}
