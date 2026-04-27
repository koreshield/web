import emailjs from '@emailjs/browser';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Clock, Shield, Zap } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';
import { useToast } from '../components/ToastNotification';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;
const TEMPLATE_ID =
	(import.meta.env.VITE_EMAILJS_TEMPLATE_ID_CONTACT as string | undefined) ||
	(import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined) ||
	'';
const emailConfigAvailable =
	Boolean(EMAILJS_SERVICE_ID) && Boolean(EMAILJS_PUBLIC_KEY) && Boolean(TEMPLATE_ID);

// Google Apps Script deployment URL for Google Sheets
const GOOGLE_SHEETS_WEBHOOK = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK as string | undefined;

// Backend API endpoint for database storage
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL as string | undefined;

const whatYoullSee = [
	{
		icon: <Shield className="h-5 w-5 text-electric-green" />,
		title: 'Live threat interception',
		body: 'Watch KoreShield catch prompt injection, jailbreaks, and PII exfiltration attempts in real time; routed through the real security proxy, not a simulation.',
	},
	{
		icon: <Zap className="h-5 w-5 text-electric-green" />,
		title: 'One-URL integration',
		body: 'We will walk through a real integration in under five minutes. One line change. No SDK migration. Compatible with your existing LLM client.',
	},
	{
		icon: <Clock className="h-5 w-5 text-electric-green" />,
		title: 'Your use case, specifically',
		body: 'We tailor every demo to your stack and threat model. Tell us what you are building in the form and we will come prepared.',
	},
];

const trustSignals = [
	'Zero-log by default',
	'Under 50ms overhead',
	'Compatible with OpenAI, Anthropic, Gemini, DeepSeek',
	'Public SDK on PyPI and npm',
	'No sales pressure',
];

type FormState = {
	firstName: string;
	lastName: string;
	workEmail: string;
	company: string;
	jobTitle: string;
	useCase: string;
	source: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
	firstName: '',
	lastName: '',
	workEmail: '',
	company: '',
	jobTitle: '',
	useCase: '',
	source: '',
};

const validateForm = (form: FormState): FormErrors => {
	const errors: FormErrors = {};

	if (!form.firstName.trim()) {
		errors.firstName = 'First name is required';
	}
	if (!form.lastName.trim()) {
		errors.lastName = 'Last name is required';
	}
	if (!form.workEmail.trim()) {
		errors.workEmail = 'Work email is required';
	} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.workEmail)) {
		errors.workEmail = 'Please enter a valid email address';
	}
	if (!form.company.trim()) {
		errors.company = 'Company is required';
	}
	if (!form.jobTitle.trim()) {
		errors.jobTitle = 'Job title is required';
	}
	if (!form.useCase.trim()) {
		errors.useCase = 'Please describe what you are building';
	}

	return errors;
};

export default function DemoPage() {
	const { addToast } = useToast();
	const [form, setForm] = useState<FormState>(initialForm);
	const [errors, setErrors] = useState<FormErrors>({});
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
	) => {
		const { name } = e.target;
		setForm((prev) => ({ ...prev, [name]: e.target.value }));
		// Clear error for this field when user starts typing
		if (errors[name as keyof FormState]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[name as keyof FormState];
				return newErrors;
			});
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (submitting) return;

		// Validate form
		const formErrors = validateForm(form);
		if (Object.keys(formErrors).length > 0) {
			setErrors(formErrors);
			addToast({
				message: 'Please fill in all required fields correctly',
				type: 'error',
			});
			return;
		}

		setSubmitting(true);
		try {
			const formData = {
				firstName: form.firstName,
				lastName: form.lastName,
				workEmail: form.workEmail,
				company: form.company,
				jobTitle: form.jobTitle,
				useCase: form.useCase,
				source: form.source || 'Not specified',
			};

			// Send to Google Sheets (non-blocking)
			if (GOOGLE_SHEETS_WEBHOOK) {
				fetch(GOOGLE_SHEETS_WEBHOOK, {
					method: 'POST',
					body: JSON.stringify(formData),
				}).catch((err) => {
					console.error('Google Sheets submission failed:', err);
					// Don't fail the main submission if Sheets fails
				});
			}

			// Send to backend database
			if (BACKEND_API_URL) {
				const backendResponse = await fetch(`${BACKEND_API_URL}/api/demo-submission`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						first_name: form.firstName,
						last_name: form.lastName,
						work_email: form.workEmail,
						company: form.company,
						job_title: form.jobTitle,
						use_case: form.useCase,
						source: form.source || null,
					}),
				});

				if (!backendResponse.ok) {
					console.error('Backend submission failed:', backendResponse.statusText);
				}
			}

			// Send notification email via EmailJS
			if (emailConfigAvailable) {
				await emailjs.send(
					EMAILJS_SERVICE_ID,
					TEMPLATE_ID,
					{
						name: `${form.firstName} ${form.lastName}`.trim(),
						from_name: `${form.firstName} ${form.lastName}`.trim(),
						email: form.workEmail,
						from_email: form.workEmail,
						company: form.company,
						tier: form.jobTitle,
						subject: 'Demo request',
						subject_line: `Demo request from ${form.company}`,
						form_type: 'Book a Demo',
						icon: '🎯',
						message: `Job title: ${form.jobTitle}\n\nWhat they are building:\n${form.useCase}\n\nHow they heard about us: ${form.source || 'Not specified'}`,
						details: form.useCase,
					},
					EMAILJS_PUBLIC_KEY,
				);
			}

			setSubmitted(true);
			setForm(initialForm);
			setErrors({});
		} catch {
			addToast({
				message: 'Something went wrong. Please try emailing us directly at hello@koreshield.com.',
				type: 'error',
			});
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-background text-foreground">
			<SEOMeta
				title="Book a Live Demo | Koreshield"
				description="See Koreshield intercept real LLM attacks live. Book a 30-minute demo tailored to your stack and use case."
			/>

			<div className="mx-auto max-w-7xl px-4 py-20">
				<div className="grid gap-16 lg:grid-cols-[1fr,1.1fr] lg:items-start lg:gap-20">

					{/* ── Left: value props ─────────────────────────────── */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6 }}
						className="relative z-0 lg:sticky lg:top-24"
					>
						<span className="inline-flex items-center gap-2 rounded-full border border-electric-green/20 bg-electric-green/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-electric-green">
							<span className="h-1.5 w-1.5 rounded-full bg-electric-green animate-pulse" />
							30-minute session
						</span>

						<h1 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
							See Koreshield in action.
						</h1>
						<p className="mt-4 text-lg text-muted-foreground leading-relaxed">
							We will walk through a live demo tailored to your stack, your threat model, and what you are building. No slides. No canned pitch. Just the product working.
						</p>

						<div className="mt-10 space-y-6">
							{whatYoullSee.map((item) => (
								<div key={item.title} className="flex gap-4">
									<div className="mt-0.5 flex-shrink-0 rounded-xl border border-electric-green/20 bg-electric-green/10 p-2.5">
										{item.icon}
									</div>
									<div>
										<p className="font-semibold">{item.title}</p>
										<p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.body}</p>
									</div>
								</div>
							))}
						</div>

						<div className="mt-10 rounded-2xl border border-border bg-muted/30 p-6">
							<p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">What you get</p>
							<ul className="space-y-2.5">
								{trustSignals.map((signal) => (
									<li key={signal} className="flex items-center gap-3 text-sm">
										<CheckCircle2 className="h-4 w-4 flex-shrink-0 text-electric-green" />
										<span>{signal}</span>
									</li>
								))}
							</ul>
						</div>

						<p className="mt-8 text-sm text-muted-foreground">
							Prefer to start immediately?{' '}
							<Link to="/signup?plan=free" className="font-semibold text-foreground underline underline-offset-2 hover:text-electric-green transition-colors">
								Start for free
							</Link>{' '}
							(no credit card required).
						</p>
					</motion.div>

					{/* ── Right: form ───────────────────────────────────── */}
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6, delay: 0.1 }}
						className="relative z-10"
					>
						<div className="rounded-3xl border border-border bg-card p-8 shadow-xl">
							{submitted ? (
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<div className="rounded-full border border-electric-green/30 bg-electric-green/10 p-4">
										<CheckCircle2 className="h-10 w-10 text-electric-green" />
									</div>
									<h2 className="mt-6 text-2xl font-bold">Request received.</h2>
									<p className="mt-3 max-w-sm text-muted-foreground">
										We will be in touch within one business day to confirm a time. We have noted what you are building so we can come prepared.
									</p>
									<div className="mt-8 flex flex-col gap-3 sm:flex-row">
										<Link
											to="/signup?plan=free"
											className="inline-flex items-center gap-2 rounded-xl bg-electric-green px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-500"
										>
											Start for free in the meantime
											<ArrowRight className="h-4 w-4" />
										</Link>
										<Link
											to="/docs"
											className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 font-semibold transition-colors hover:bg-muted"
										>
											Read the docs
										</Link>
									</div>
								</div>
							) : (
								<>
									<h2 className="text-xl font-bold">Book your demo</h2>
									<p className="mt-1 text-sm text-muted-foreground">
										Fill in the details below and we will confirm a time within one business day.
									</p>

									<form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
										<div className="grid gap-4 sm:grid-cols-2">
											<div>
												<label htmlFor="firstName" className="block text-sm font-medium mb-1.5">
													First name <span className="text-red-400">*</span>
												</label>
												<input
													id="firstName"
													name="firstName"
													type="text"
													autoComplete="given-name"
													value={form.firstName}
													onChange={handleChange}
													placeholder="Jane"
													className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-colors ${
														errors.firstName
															? 'border-red-500 focus:ring-red-500/40'
															: 'border-border focus:ring-electric-green/40'
													}`}
												/>
												{errors.firstName && (
													<p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
												)}
											</div>
											<div>
												<label htmlFor="lastName" className="block text-sm font-medium mb-1.5">
													Last name <span className="text-red-400">*</span>
												</label>
												<input
													id="lastName"
													name="lastName"
													type="text"
													autoComplete="family-name"
													value={form.lastName}
													onChange={handleChange}
													placeholder="Smith"
													className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-colors ${
														errors.lastName
															? 'border-red-500 focus:ring-red-500/40'
															: 'border-border focus:ring-electric-green/40'
													}`}
												/>
												{errors.lastName && (
													<p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
												)}
											</div>
										</div>

										<div>
											<label htmlFor="workEmail" className="block text-sm font-medium mb-1.5">
												Work email <span className="text-red-400">*</span>
											</label>
											<input
												id="workEmail"
												name="workEmail"
												type="email"
												autoComplete="email"
												value={form.workEmail}
												onChange={handleChange}
												placeholder="jane@yourcompany.com"
												className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-colors ${
													errors.workEmail
														? 'border-red-500 focus:ring-red-500/40'
														: 'border-border focus:ring-electric-green/40'
												}`}
											/>
											{errors.workEmail && (
												<p className="mt-1 text-xs text-red-500">{errors.workEmail}</p>
											)}
										</div>

										<div className="grid gap-4 sm:grid-cols-2">
											<div>
												<label htmlFor="company" className="block text-sm font-medium mb-1.5">
													Company <span className="text-red-400">*</span>
												</label>
												<input
													id="company"
													name="company"
													type="text"
													autoComplete="organization"
													value={form.company}
													onChange={handleChange}
													placeholder="Acme Corp"
													className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-colors ${
														errors.company
															? 'border-red-500 focus:ring-red-500/40'
															: 'border-border focus:ring-electric-green/40'
													}`}
												/>
												{errors.company && (
													<p className="mt-1 text-xs text-red-500">{errors.company}</p>
												)}
											</div>
											<div>
												<label htmlFor="jobTitle" className="block text-sm font-medium mb-1.5">
													Job title <span className="text-red-400">*</span>
												</label>
												<input
													id="jobTitle"
													name="jobTitle"
													type="text"
													autoComplete="organization-title"
													value={form.jobTitle}
													onChange={handleChange}
													placeholder="CTO, Security Engineer..."
													className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-colors ${
														errors.jobTitle
															? 'border-red-500 focus:ring-red-500/40'
															: 'border-border focus:ring-electric-green/40'
													}`}
												/>
												{errors.jobTitle && (
													<p className="mt-1 text-xs text-red-500">{errors.jobTitle}</p>
												)}
											</div>
										</div>

										<div>
											<label htmlFor="useCase" className="block text-sm font-medium mb-1.5">
												What are you building? <span className="text-red-400">*</span>
											</label>
											<textarea
												id="useCase"
												name="useCase"
												rows={4}
												value={form.useCase}
												onChange={handleChange}
												placeholder="Briefly describe your LLM use case, the model(s) you are using, and your main security concern."
												className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 resize-none transition-colors ${
													errors.useCase
														? 'border-red-500 focus:ring-red-500/40'
														: 'border-border focus:ring-electric-green/40'
												}`}
											/>
											{errors.useCase && (
												<p className="mt-1 text-xs text-red-500">{errors.useCase}</p>
											)}
										</div>

										<div>
											<label htmlFor="source" className="block text-sm font-medium mb-1.5">
												How did you hear about Koreshield?
											</label>
											<select
												id="source"
												name="source"
												value={form.source}
												onChange={handleChange}
												className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-electric-green/40"
											>
												<option value="">Select an option</option>
												<option value="Search / Google">Search / Google</option>
												<option value="LinkedIn">LinkedIn</option>
												<option value="Twitter / X">Twitter / X</option>
												<option value="Word of mouth">Word of mouth</option>
												<option value="GitHub">GitHub</option>
												<option value="Newsletter or blog">Newsletter or blog</option>
												<option value="Security community">Security community</option>
												<option value="Other">Other</option>
											</select>
										</div>

										<button
											type="submit"
											disabled={submitting}
											className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-electric-green px-6 py-3.5 font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
										>
											{submitting ? (
												<>
													<span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
													Sending...
												</>
											) : (
												<>
													Request a demo
													<ArrowRight className="h-4 w-4" />
												</>
											)}
										</button>

										<p className="text-center text-xs text-muted-foreground">
											By submitting, you agree to our{' '}
											<Link to="/privacy-policy" className="underline underline-offset-2 hover:text-foreground transition-colors">
												Privacy Policy
											</Link>
											. We will never share your details.
										</p>
									</form>
								</>
							)}
						</div>
					</motion.div>
				</div>
			</div>
		</div>
	);
}
