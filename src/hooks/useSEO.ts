import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

export interface SEOMetadata {
	title: string;
	description: string;
	keywords?: string[];
	canonical?: string;
	ogTitle?: string;
	ogDescription?: string;
	ogImage?: string;
	ogType?: 'website' | 'article' | 'product';
	twitterCard?: 'summary' | 'summary_large_image';
	twitterTitle?: string;
	twitterDescription?: string;
	twitterImage?: string;
	author?: string;
	publishDate?: string;
	modifiedDate?: string;
	schema?: Record<string, unknown>;
	robots?: string;
	noindex?: boolean;
}

/**
 * Hook to manage SEO metadata for a page using React Helmet
 * Updates document head with meta tags for search engines and social sharing
 * 
 * @param metadata - SEO metadata object
 */
export function useSEO(metadata: SEOMetadata) {
	const baseUrl = 'https://koreshield.ai';
	const defaultOgImage = '/logo.png';

	useEffect(() => {
		// Validate required fields
		if (!metadata.title || !metadata.description) {
			console.warn('useSEO: Missing required title or description');
		}
	}, [metadata.title, metadata.description]);

	const canonicalUrl = metadata.canonical || (typeof window !== 'undefined' ? window.location.href : '');
	const ogImage = metadata.ogImage || defaultOgImage;
	const schemaJson = metadata.schema || defaultSchema(metadata);

	return (
		<Helmet>
			<title>{metadata.title}</title>
			<meta name="description" content={metadata.description} />
			{metadata.keywords && (
				<meta name="keywords" content={metadata.keywords.join(', ')} />
			)}
			{metadata.robots && <meta name="robots" content={metadata.robots} />}
			{metadata.noindex && <meta name="robots" content="noindex, nofollow" />}
			{metadata.author && <meta name="author" content={metadata.author} />}

			{/* Canonical URL */}
			{canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

			{/* Open Graph Tags */}
			<meta property="og:title" content={metadata.ogTitle || metadata.title} />
			<meta
				property="og:description"
				content={metadata.ogDescription || metadata.description}
			/>
			{ogImage && <meta property="og:image" content={ogImage} />}
			<meta property="og:type" content={metadata.ogType || 'website'} />
			<meta property="og:url" content={canonicalUrl || baseUrl} />

			{/* Twitter Card Tags */}
			<meta name="twitter:card" content={metadata.twitterCard || 'summary_large_image'} />
			<meta name="twitter:title" content={metadata.twitterTitle || metadata.title} />
			<meta
				name="twitter:description"
				content={metadata.twitterDescription || metadata.description}
			/>
			{metadata.twitterImage && <meta name="twitter:image" content={metadata.twitterImage} />}
			<meta name="twitter:site" content="@koreshield" />

			{/* Structured Data (JSON-LD) */}
			{schemaJson && (
				<script type="application/ld+json">
					{JSON.stringify(schemaJson)}
				</script>
			)}

			{/* Article-specific metadata */}
			{metadata.ogType === 'article' && metadata.publishDate && (
				<meta property="article:published_time" content={metadata.publishDate} />
			)}
			{metadata.ogType === 'article' && metadata.modifiedDate && (
				<meta property="article:modified_time" content={metadata.modifiedDate} />
			)}
		</Helmet>
	);
}

/**
 * Generate default structured data (schema.org) for a page
 */
function defaultSchema(metadata: SEOMetadata): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': metadata.ogType === 'article' ? 'Article' : 'WebPage',
		name: metadata.title,
		description: metadata.description,
		url: typeof window !== 'undefined' ? window.location.href : '',
		image: metadata.ogImage || '/logo.png',
		...(metadata.ogType === 'article' && {
			author: {
				'@type': 'Organization',
				name: metadata.author || 'KoreShield',
			},
			datePublished: metadata.publishDate,
			dateModified: metadata.modifiedDate,
		}),
	};
}

/**
 * Generate breadcrumb schema for nested pages
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: item.url,
		})),
	};
}

/**
 * Generate product schema
 */
export function generateProductSchema(product: {
	name: string;
	description: string;
	image: string;
	price?: string;
	currency?: string;
	rating?: number;
	ratingCount?: number;
	availability?: string;
}) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: product.name,
		description: product.description,
		image: product.image,
		...(product.price && {
			offers: {
				'@type': 'Offer',
				price: product.price,
				priceCurrency: product.currency || 'USD',
				availability: product.availability || 'https://schema.org/InStock',
			},
		}),
		...(product.rating && {
			aggregateRating: {
				'@type': 'AggregateRating',
				ratingValue: product.rating,
				reviewCount: product.ratingCount || 0,
			},
		}),
	};
}

/**
 * Generate organization schema
 */
export function generateOrganizationSchema() {
	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'KoreShield',
		url: 'https://koreshield.com',
		logo: 'https://koreshield.com/logo.png',
		description: 'Enterprise-grade LLM security firewall. Secure your AI infrastructure.',
		sameAs: [
			'https://github.com/koreshield',
			'https://twitter.com/koreshield',
			'https://linkedin.com/company/koreshield',
		],
		contactPoint: {
			'@type': 'ContactPoint',
			telephone: '+1-XXX-XXX-XXXX',
			contactType: 'Customer Service',
		},
	};
}
