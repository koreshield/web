const SITE_URL = 'https://koreshield.ai';

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
	name: 'Koreshield',
	url: SITE_URL,
	logo: `${SITE_URL}/logo.png`,
	description: 'Enterprise-grade LLM security firewall for protecting AI infrastructure',
	sameAs: [
		'https://github.com/koreshield',
		'https://twitter.com/koreshield',
		'https://linkedin.com/company/koreshield',
	],
};
