import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';

/* ── Feature data – keep in sync with actual product capabilities ── */
const features = [
	{
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
				<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036a11.959 11.959 0 01 3.598-.124A11.973 11.973 0 0119.496 6.553" />
				<path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75l-4.5 4.5 4.5 4.5M4.5 8.25h15" />
				<path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5l3-3 3 3" />
				<path strokeLinecap="round" strokeLinejoin="round" d="M8.857 6a24.054 24.054 0 01-1.347 3.998 24.054 24.054 0 01-1.03 1.748" />
			</svg>
		),
		title: 'Real-time Prompt Defense',
		desc: 'Inspect every prompt before it reaches your LLM. Block injection attempts, role impersonation, and data exfiltration in milliseconds.',
	},
	{
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
				<path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
			</svg>
		),
		title: 'RAG Context Scanning',
		desc: 'Scan vector-store documents before they are inserted into context. Detect and strip malicious payload injections hidden inside retrieved chunks.',
	},
	{
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
				<path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
			</svg>
		),
		title: 'Framework Integrations',
		desc: 'Drop-in support for LangChain, LlamaIndex, FastAPI, and Express. One import  -  no proxy required.',
	},
	{
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
				<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
			</svg>
		),
		title: 'Policy Engine',
		desc: 'Define custom YAML policies: allow-lists, deny patterns, regex rules, and PII redaction. Hot-reload without restarting your app.',
	},
	{
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
				<path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
			</svg>
		),
		title: 'Full Observability',
		desc: 'Prometheus metrics, structured JSON logs, and a built-in dashboard. Know every threat, every decision, every latency.',
	},
	{
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
				<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
			</svg>
		),
		title: 'Enterprise Ready',
		desc: 'RBAC, Redis-backed rate limiting, and Helm chart for Kubernetes. SOC 2-aligned architecture.',
	},
];

/* ── Hero Section ─────────────────────────────────────────────── */
function HomepageHero() {
	return (
		<section className={styles.hero}>
			<div className={styles.heroInner}>
				<div className={styles.heroBadge}>
					<span className={styles.heroBadgeDot} />
					Documentation · MIT License
				</div>

				<h1 className={styles.heroTitle}>
					The API Firewall for{' '}
					<span className={styles.heroTitleAccent}>LLM Applications</span>
				</h1>

				<p className={styles.heroSubtitle}>
					KoreShield detects and blocks prompt injection, data exfiltration, and adversarial
					inputs before they reach your AI models  -  in under 1ms.
				</p>

				<div className={styles.heroCta}>
					<Link className={styles.ctaPrimary} to="/docs/getting-started/quick-start">
						Quick Setup →
					</Link>
					<Link
						className={styles.ctaSecondary}
						href="https://github.com/koreshield"
					>
						View on GitHub
					</Link>
				</div>
			</div>
		</section>
	);
}

/* ── Features Grid ────────────────────────────────────────────── */
function HomepageFeatures() {
	return (
		<section className={styles.features}>
			<div className={styles.featuresInner}>
				<p className={styles.featuresLabel}>Capabilities</p>
				<h2 className={styles.featuresTitle}>Everything you need to secure your LLM stack</h2>

				<div className={styles.featuresGrid}>
					{features.map(({ icon, title, desc }) => (
						<div key={title} className={styles.featureCard}>
							<div className={styles.featureIcon}>{icon}</div>
							<h3 className={styles.featureTitle}>{title}</h3>
							<p className={styles.featureDesc}>{desc}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function Home() {
	const { siteConfig } = useDocusaurusContext();
	return (
		<Layout
			title={siteConfig.title}
			description="Documentation for the KoreShield LLM security platform. The core platform is proprietary."
		>
			<main>
				<HomepageHero />
				<section className={styles.features}>
					<div className={styles.featuresInner}>
						<p className={styles.featuresLabel}>Licensing & IP</p>
						<h2 className={styles.featuresTitle}>Core proprietary, SDKs and docs MIT-licensed</h2>
						<p className={styles.featuresSubtitle}>
							KoreShield core is proprietary software. The SDKs, documentation, website, and blog are MIT-licensed
							in their respective directories and repositories. Commercial use of the core platform requires a
							valid license or agreement with KoreShield.
						</p>
					</div>
				</section>
				<HomepageFeatures />
			</main>
		</Layout>
	);
}
