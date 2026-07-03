export const SEOConfig = {
	home: {
		title: 'AI Security Firewall',
		description: 'Proxy-layer AI security for prompts, RAG context, provider routing, policy enforcement, and audit evidence.',
		keywords: 'LLM security, AI security, prompt injection, jailbreak detection, GPT security, OpenAI security, LLM firewall, AI safety, machine learning security, AI infrastructure protection, self-hosted LLM security, air-gapped AI firewall, on-premise AI security, data residency',
		ogImage: 'https://koreshield.ai/logo.png',
		ogType: 'website' as const,
		structuredData: {
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: 'Koreshield',
			url: 'https://koreshield.ai',
			description: 'Enterprise-grade LLM security firewall',
			image: 'https://koreshield.ai/logo.png',
			logo: 'https://koreshield.ai/logo.png',
			sameAs: [
				'https://github.com/koreshield',
				'https://twitter.com/koreshield',
				'https://linkedin.com/company/koreshield',
			],
		},
	},
	features: {
		title: 'Features',
		description: 'Discover Koreshield\'s advanced LLM security features including real-time threat detection, prompt injection prevention, jailbreak detection, comprehensive threat monitoring, and flexible deployment options.',
		keywords: 'LLM security features, prompt injection detection, jailbreak detection, threat monitoring, security controls, API filtering, self-hosted deployment, air-gapped AI security',
		ogImage: 'https://koreshield.ai/og-features.png',
		ogType: 'website' as const,
		breadcrumbs: [
			{ name: 'Home', url: 'https://koreshield.ai' },
			{ name: 'Features', url: 'https://koreshield.ai/features' },
		],
	},
	pricing: {
		title: 'Pricing Plans',
		description: 'Koreshield pricing plans for teams of all sizes. Growth and Scale plans with pay-as-you-grow requests, plus custom Enterprise self-hosted and air-gapped options.',
		keywords: 'LLM security pricing, protected requests pricing, AI security cost, enterprise LLM security pricing, pricing plans, self-hosted AI security pricing, air-gapped deployment',
		ogImage: 'https://koreshield.ai/og-pricing.png',
		ogType: 'website' as const,
		breadcrumbs: [
			{ name: 'Home', url: 'https://koreshield.ai' },
			{ name: 'Pricing', url: 'https://koreshield.ai/pricing' },
		],
		structuredData: {
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: [
				{
					'@type': 'Question',
					name: 'How does Koreshield pricing work?',
					acceptedAnswer: {
						'@type': 'Answer',
						text: 'Koreshield charges a platform fee plus included protected requests each month. Additional requests scale with usage. Enterprise plans are available with advanced governance and deployment controls.',
					},
				},
			],
		},
	},
	docs: {
		title: 'Documentation',
		description: 'Complete documentation for Koreshield LLM security platform. API reference, SDK guides, installation instructions, and integration examples.',
		keywords: 'Koreshield documentation, LLM security docs, API reference, SDK guide, installation guide, integration',
		ogImage: 'https://koreshield.ai/og-docs.png',
		ogType: 'website' as const,
		breadcrumbs: [
			{ name: 'Home', url: 'https://koreshield.ai' },
			{ name: 'Documentation', url: 'https://koreshield.ai/docs' },
		],
	},
	blog: {
		title: 'Blog',
		description: 'Latest insights on LLM security, AI threat detection, and enterprise AI infrastructure. Technical articles and security research.',
		keywords: 'LLM security blog, AI security articles, threat detection research, prompt injection prevention',
		ogImage: 'https://koreshield.ai/og-blog.png',
		ogType: 'website' as const,
		breadcrumbs: [
			{ name: 'Home', url: 'https://koreshield.ai' },
			{ name: 'Blog', url: 'https://koreshield.ai/blog' },
		],
	},
	demo: {
		title: 'Request a Demo',
		description: 'See Koreshield in action. Request a personalized demo to learn how we protect your AI applications from LLM threats.',
		keywords: 'Koreshield demo, LLM security demo, AI firewall demo, request demo',
		ogImage: 'https://koreshield.ai/og-demo.png',
		ogType: 'website' as const,
		breadcrumbs: [
			{ name: 'Home', url: 'https://koreshield.ai' },
			{ name: 'Demo', url: 'https://koreshield.ai/demo' },
		],
	},
	about: {
		title: 'About',
		description: 'Koreshield is building the runtime security layer for production AI applications, with protection for prompts, RAG context, providers, policy decisions, and audit evidence.',
		keywords: 'Koreshield team, AI security company, LLM security research, UK AI startup, about',
		ogImage: 'https://koreshield.ai/og-about.png',
		ogType: 'website' as const,
		breadcrumbs: [
			{ name: 'Home', url: 'https://koreshield.ai' },
			{ name: 'About', url: 'https://koreshield.ai/about' },
		],
		structuredData: {
			'@context': 'https://schema.org',
			'@type': 'Organization',
			name: 'Koreshield',
			url: 'https://koreshield.ai',
			logo: 'https://koreshield.ai/logo.png',
			description: 'Runtime AI security for production AI applications.',
			address: {
				'@type': 'PostalAddress',
				streetAddress: 'London',
				addressCountry: 'GB',
			},
			sameAs: [
				'https://github.com/koreshield',
				'https://twitter.com/koreshield',
				'https://linkedin.com/company/koreshield',
			],
		},
	},
	contact: {
		title: 'Contact',
		description: 'Contact the Koreshield team. Technical support, enterprise sales, or general enquiries. We\'re here to help.',
		keywords: 'contact Koreshield, LLM security support, enterprise sales, technical support, contact',
		ogImage: 'https://koreshield.ai/og-contact.png',
		ogType: 'website' as const,
		breadcrumbs: [
			{ name: 'Home', url: 'https://koreshield.ai' },
			{ name: 'Contact', url: 'https://koreshield.ai/contact' },
		],
	},
	faq: {
		title: 'FAQ',
		description: 'Answers to common questions about Koreshield — security, privacy, deployment, pricing, compliance, and troubleshooting for LLM security.',
		keywords: 'Koreshield FAQ, LLM security questions, AI firewall FAQ, self-hosted FAQ, air-gapped deployment FAQ, prompt injection FAQ',
		ogImage: 'https://koreshield.ai/og-faq.png',
		ogType: 'website' as const,
		breadcrumbs: [
			{ name: 'Home', url: 'https://koreshield.ai' },
			{ name: 'FAQ', url: 'https://koreshield.ai/faq' },
		],
		structuredData: {
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: [
				{
					'@type': 'Question',
					name: 'What is Koreshield?',
					acceptedAnswer: {
						'@type': 'Answer',
						text: 'Koreshield is a proxy-layer security firewall for LLM-powered applications. It sits between your app and your AI providers, scanning every prompt, response, and RAG context for threats.',
					},
				},
				{
					'@type': 'Question',
					name: 'Does Koreshield store my prompts or responses?',
					acceptedAnswer: {
						'@type': 'Answer',
						text: 'No. Koreshield is zero-log by default. Requests and responses are inspected in memory and discarded immediately.',
					},
				},
				{
					'@type': 'Question',
					name: 'Can I self-host Koreshield?',
					acceptedAnswer: {
						'@type': 'Answer',
						text: 'Yes. Enterprise customers can deploy Koreshield on their own infrastructure using Docker Compose with offline licence validation.',
					},
				},
				{
					'@type': 'Question',
					name: 'Do you support air-gapped environments?',
					acceptedAnswer: {
						'@type': 'Answer',
						text: 'Yes. Koreshield supports fully air-gapped deployment with no outbound internet, offline licence validation, and bundled threat corpus updates.',
					},
				},
			],
		},
	},
};
