import { PRIMARY_SITE_URL } from './site-url';

function upsertJsonLd(id: string, data: object) {
	if (typeof document === 'undefined') return;

	const selector = `script[type="application/ld+json"][data-schema-id="${id}"]`;
	const current = document.head.querySelector<HTMLScriptElement>(selector);
	const element = current ?? document.createElement('script');

	element.type = 'application/ld+json';
	element.dataset.schemaId = id;
	element.textContent = JSON.stringify(data);

	if (!current) {
		document.head.appendChild(element);
	}
}

function removeJsonLd(id: string) {
	if (typeof document === 'undefined') return;
	document.head
		.querySelector(`script[type="application/ld+json"][data-schema-id="${id}"]`)
		?.remove();
}

export function syncJsonLd(id: string, data?: object | null) {
	if (!data) {
		removeJsonLd(id);
		return;
	}

	upsertJsonLd(id, data);
}

export const defaultOrganizationSchema = {
	'@context': 'https://schema.org',
	'@type': 'Organization',
	'@id': `${PRIMARY_SITE_URL}/#organization`,
	name: 'Koreshield',
	legalName: 'Koreshield Labs Ltd',
	url: PRIMARY_SITE_URL,
	logo: {
		'@type': 'ImageObject',
		url: `${PRIMARY_SITE_URL}/logo.png`,
		width: 457,
		height: 482,
	},
	description: 'Runtime security for production AI applications, including prompt, RAG, agent, provider, policy, and audit controls.',
	identifier: {
		'@type': 'PropertyValue',
		propertyID: 'UK Companies House',
		value: '17057784',
	},
	address: {
		'@type': 'PostalAddress',
		streetAddress: '3rd Floor, 86-90 Paul Street',
		addressLocality: 'London',
		postalCode: 'EC2A 4NE',
		addressCountry: 'GB',
	},
	sameAs: [
		'https://github.com/koreshield',
		'https://x.com/koreshield',
		'https://www.linkedin.com/company/koreshield',
	],
};
