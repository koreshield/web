import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { SEOMeta } from '../components/SEOMeta';

const pages: Record<string, { title: string; effective: string; sections: { heading: string; body: string }[] }> = {
	'/privacy-policy': {
		title: 'Privacy Policy',
		effective: '1 January 2026',
		sections: [
			{
				heading: 'What we collect',
				body: 'We collect information you provide directly (name, email, company) when you create an account or contact us, and usage data such as API request volumes and dashboard interactions. We do not store the content of prompts processed through the KoreShield firewall.',
			},
			{
				heading: 'How we use it',
				body: 'Your data is used to operate and improve the KoreShield platform, send transactional emails, and provide customer support. We do not sell your data to third parties.',
			},
			{
				heading: 'Data storage & retention',
				body: 'Customer data is stored in UK and EU data centres by default. Enterprise customers may request alternative regions. We retain account data for the duration of your subscription plus 90 days after cancellation.',
			},
			{
				heading: 'Your rights',
				body: 'Under UK GDPR and EU GDPR you have the right to access, correct, or delete your personal data. To exercise these rights email hello@koreshield.com.',
			},
			{
				heading: 'Cookies',
				body: 'We use strictly necessary cookies for authentication and session management, and optional analytics cookies to understand usage patterns. You can manage cookie preferences in your browser settings.',
			},
			{
				heading: 'Contact',
				body: 'Data controller: Koreshield Labs Ltd, incorporated in England and Wales (Co. No. 17057784). Questions about this policy: hello@koreshield.com.',
			},
		],
	},
	'/terms-of-service': {
		title: 'Terms of Service',
		effective: '1 January 2026',
		sections: [
			{
				heading: 'Acceptance',
				body: 'By accessing or using KoreShield you agree to these Terms. If you are using KoreShield on behalf of an organisation, you represent that you have authority to bind that organisation.',
			},
			{
				heading: 'Service',
				body: "KoreShield provides a managed LLM security gateway. The core platform is proprietary. SDKs and documentation are MIT-licensed. Uptime commitments are set out in your plan's SLA.",
			},
			{
				heading: 'Acceptable use',
				body: 'You may not use KoreShield to process illegal content, circumvent security controls, resell access without authorisation, or reverse-engineer the core detection engine.',
			},
			{
				heading: 'Billing',
				body: 'Hosted plans are billed monthly or annually in advance. Enterprise annual licences are invoiced per contract. Overages are charged at the rates set out in your plan. All prices exclude VAT.',
			},
			{
				heading: 'Termination',
				body: 'You may cancel at any time. On cancellation access ends at the end of the current billing period. We may suspend access for material breach after reasonable notice.',
			},
			{
				heading: 'Limitation of liability',
				body: 'To the maximum extent permitted by law, KoreShield\'s total liability for any claim arising from these Terms is limited to fees paid in the three months preceding the claim.',
			},
			{
				heading: 'Governing law',
				body: 'These Terms are governed by the laws of England and Wales. Disputes are subject to the exclusive jurisdiction of the courts of England and Wales.',
			},
		],
	},
	'/cookie-policy': {
		title: 'Cookie Policy',
		effective: '1 January 2026',
		sections: [
			{
				heading: 'What are cookies?',
				body: 'Cookies are small text files stored on your device when you visit a website. They help us recognise your session, remember preferences, and understand how the site is used.',
			},
			{
				heading: 'Strictly necessary cookies',
				body: 'These cookies are required for the platform to function. They include session tokens (to keep you logged in) and CSRF protection tokens. These cannot be disabled.',
			},
			{
				heading: 'Analytics cookies',
				body: 'We use privacy-respecting analytics (no cross-site tracking, IP anonymisation enabled) to understand which features are most used and where users encounter friction. These are optional.',
			},
			{
				heading: 'Managing cookies',
				body: 'You can disable optional cookies in your browser settings. Disabling strictly necessary cookies will prevent you from logging in to the dashboard.',
			},
			{
				heading: 'Contact',
				body: 'Questions about our cookie usage: hello@koreshield.com.',
			},
		],
	},
};

export default function LegalPage() {
	const { pathname } = useLocation();
	const page = pages[pathname];

	if (!page) return null;

	return (
		<div className="min-h-screen bg-background text-foreground transition-colors">
			<SEOMeta title={page.title} description={`KoreShield ${page.title}`} />

			<div className="max-w-3xl mx-auto px-6 py-20">
				<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
					<Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
						<ArrowLeft className="w-4 h-4" />
						Back to home
					</Link>

					<h1 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">{page.title}</h1>
					<p className="text-sm text-muted-foreground mb-12">Effective {page.effective} · Koreshield Labs Ltd</p>

					<div className="space-y-10">
						{page.sections.map((s) => (
							<div key={s.heading}>
								<h2 className="text-lg font-semibold text-foreground mb-3">{s.heading}</h2>
								<p className="text-muted-foreground leading-relaxed text-sm">{s.body}</p>
							</div>
						))}
					</div>

					<div className="mt-16 pt-8 border-t border-border text-xs text-muted-foreground">
						Questions? Email{' '}
						<a href="mailto:hello@koreshield.com" className="text-primary hover:underline">hello@koreshield.com</a>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
