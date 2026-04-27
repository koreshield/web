export const SEOConfig = {
	home: {
		title: 'LLM Security & AI Firewall',
		description: 'Industry-standard LLM security solution protecting AI applications from prompt injection, jailbreaks, and data exfiltration. 95%+ detection accuracy.',
		keywords: 'LLM security, AI security, prompt injection, jailbreak detection, GPT security, OpenAI security, LLM firewall, AI safety, machine learning security',
		structuredData: {
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: 'KoreShield',
			url: 'https://koreshield.com',
			potentialAction: {
				'@type': 'SearchAction',
				target: '/docs?q={search_term_string}',
				'query-input': 'required name=search_term_string',
			},
		},
	},
	pricing: {
		title: 'Pricing',
		description: 'KoreShield pricing for protected AI requests. Start free, scale with overages, and unlock enterprise security and deployment controls when you need them.',
		keywords: 'LLM security pricing, protected requests pricing, AI security cost, prompt screening pricing, enterprise LLM security',
		structuredData: {
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: [
				{
					'@type': 'Question',
					name: 'How does the pricing work?',
					acceptedAnswer: {
						'@type': 'Answer',
						text: 'KoreShield charges a platform fee plus included protected requests each month. Hosted overages scale with usage, while enterprise plans are sold contractually with advanced governance and deployment controls.',
					},
				},
			],
		},
	},
	about: {
		title: 'About Us',
		description: 'KoreShield is pioneering the next generation of LLM security. Built in the UK, we\'re making AI-powered applications safer for everyone.',
		keywords: 'KoreShield team, AI security company, LLM security research, UK AI startup',
		structuredData: {
			'@context': 'https://schema.org',
			'@type': 'Organization',
			name: 'KoreShield',
			url: 'https://koreshield.com',
			logo: 'https://koreshield.com/logo/light/1x/White.png',
			description: 'Securing the AI-powered future with industry-standard LLM security solutions.',
			foundingDate: '2023',
			founders: [
				{
					'@type': 'Person',
					name: 'Dr. Sarah Chen',
				},
			],
			address: {
				'@type': 'PostalAddress',
				streetAddress: '123 Tech Street, Shoreditch',
				addressLocality: 'London',
				postalCode: 'EC2A 4BX',
				addressCountry: 'GB',
			},
		},
	},
	contact: {
		title: 'Contact Us',
		description: 'Get in touch with the KoreShield team. Technical support, enterprise sales, or general enquiries. UK office hours: Mon-Fri 9am-6pm GMT/BST.',
		keywords: 'contact KoreShield, LLM security support, enterprise sales, technical support',
	},
	docs: {
		title: 'Documentation',
		description: 'Complete documentation for KoreShield LLM security platform. Installation guides, API reference, SDKs, and integration examples.',
		keywords: 'KoreShield documentation, LLM security docs, API reference, SDK guide, installation guide',
	},
};
