export const SEOConfig = {
	home: {
		title: 'LLM Security & AI Firewall',
		description: 'Enterprise-grade LLM security firewall protecting AI applications from prompt injection, jailbreaks, and data exfiltration with 95%+ detection accuracy.',
		keywords: 'LLM security, AI security, prompt injection, jailbreak detection, GPT security, OpenAI security, LLM firewall, AI safety, machine learning security, AI infrastructure protection',
		ogImage: 'https://koreshield.ai/og-home.png',
		ogType: 'website' as const,
		structuredData: {
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: 'KoreShield',
			url: 'https://koreshield.ai',
			description: 'Enterprise-grade LLM security firewall',
			potentialAction: {
				'@type': 'SearchAction',
				target: 'https://koreshield.ai/docs?q={search_term_string}',
				'query-input': 'required name=search_term_string',
			},
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
		description: 'Discover KoreShield\'s advanced LLM security features including real-time threat detection, prompt injection prevention, jailbreak detection, and comprehensive threat monitoring.',
		keywords: 'LLM security features, prompt injection detection, jailbreak detection, threat monitoring, security controls, API filtering',
		ogImage: 'https://koreshield.ai/og-features.png',
		ogType: 'website' as const,
		breadcrumbs: [
			{ name: 'Home', url: 'https://koreshield.ai' },
			{ name: 'Features', url: 'https://koreshield.ai/features' },
		],
	},
	pricing: {
		title: 'Pricing Plans',
		description: 'KoreShield pricing plans for teams of all sizes. Start free with 10,000 protected requests/month, then pay-as-you-grow. Enterprise plans available.',
		keywords: 'LLM security pricing, protected requests pricing, AI security cost, enterprise LLM security pricing, pricing plans',
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
					name: 'How does KoreShield pricing work?',
					acceptedAnswer: {
						'@type': 'Answer',
						text: 'KoreShield charges a platform fee plus included protected requests each month. Additional requests scale with usage. Enterprise plans are available with advanced governance and deployment controls.',
					},
				},
				{
					'@type': 'Question',
					name: 'Can I start for free?',
					acceptedAnswer: {
						'@type': 'Answer',
						text: 'Yes! The Dev tier includes 10,000 protected requests per month, which is ideal for evaluation and early prototypes.',
					},
				},
			],
		},
	},
	docs: {
		title: 'Documentation',
		description: 'Complete documentation for KoreShield LLM security platform. API reference, SDK guides, installation instructions, and integration examples.',
		keywords: 'KoreShield documentation, LLM security docs, API reference, SDK guide, installation guide, integration',
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
		description: 'See KoreShield in action. Request a personalized demo to learn how we protect your AI applications from LLM threats.',
		keywords: 'KoreShield demo, LLM security demo, AI firewall demo, request demo',
		ogImage: 'https://koreshield.ai/og-demo.png',
		ogType: 'website' as const,
		breadcrumbs: [
			{ name: 'Home', url: 'https://koreshield.ai' },
			{ name: 'Demo', url: 'https://koreshield.ai/demo' },
		],
	},
	about: {
		title: 'About Us',
		description: 'KoreShield is pioneering enterprise-grade LLM security. Built in the UK, we\'re making AI-powered applications safer for everyone.',
		keywords: 'KoreShield team, AI security company, LLM security research, UK AI startup, about',
		ogImage: 'https://koreshield.ai/og-about.png',
		ogType: 'website' as const,
		breadcrumbs: [
			{ name: 'Home', url: 'https://koreshield.ai' },
			{ name: 'About', url: 'https://koreshield.ai/about' },
		],
		structuredData: {
			'@context': 'https://schema.org',
			'@type': 'Organization',
			name: 'KoreShield',
			url: 'https://koreshield.ai',
			logo: 'https://koreshield.ai/logo.png',
			description: 'Enterprise-grade LLM security firewall protecting AI applications.',
			foundingDate: '2023',
			founders: [
				{
					'@type': 'Person',
					name: 'KoreShield Team',
				},
			],
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
		description: 'Contact the KoreShield team. Technical support, enterprise sales, or general enquiries. We\'re here to help.',
		keywords: 'contact KoreShield, LLM security support, enterprise sales, technical support, contact',
		ogImage: 'https://koreshield.ai/og-contact.png',
		ogType: 'website' as const,
		breadcrumbs: [
			{ name: 'Home', url: 'https://koreshield.ai' },
			{ name: 'Contact', url: 'https://koreshield.ai/contact' },
		],
	},
};
