import { Helmet } from 'react-helmet-async';
import { useEffect, useMemo } from 'react';
import { syncJsonLd } from '../lib/seoSchema';

interface SEOMetaProps {
	title?: string;
	description?: string;
	keywords?: string;
	ogImage?: string;
	ogType?: 'website' | 'article' | 'product';
	twitterCard?: 'summary' | 'summary_large_image';
	canonicalUrl?: string;
	author?: string;
	publishedTime?: string;
	modifiedTime?: string;
	section?: string;
	structuredData?: object;
	robots?: string;
	noindex?: boolean;
	nofollow?: boolean;
	breadcrumbs?: Array<{ name: string; url: string }>;
}

const DEFAULT_TITLE = 'Koreshield | AI Security Firewall';
const DEFAULT_DESCRIPTION = 'Proxy-layer AI security for prompts, RAG context, provider routing, policy enforcement, and audit evidence.';
const DEFAULT_KEYWORDS = 'LLM security, AI security, prompt injection, jailbreak detection, GPT security, OpenAI security, LLM firewall, AI safety, AI infrastructure protection, threat detection';
const DEFAULT_OG_IMAGE = 'https://koreshield.ai/og-image.png';
const SITE_URL = 'https://koreshield.ai';

export function SEOMeta({
	title,
	description = DEFAULT_DESCRIPTION,
	keywords = DEFAULT_KEYWORDS,
	ogImage = DEFAULT_OG_IMAGE,
	ogType = 'website',
	twitterCard = 'summary_large_image',
	canonicalUrl,
	author,
	publishedTime,
	modifiedTime,
	section,
	structuredData,
	robots = 'index, follow',
	noindex = false,
	nofollow = false,
	breadcrumbs,
}: SEOMetaProps) {
	const fullTitle = title ? `${title} | Koreshield` : DEFAULT_TITLE;
	const canonical = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : SITE_URL);
	
	const robotsContent = noindex ? 'noindex, nofollow' : nofollow ? 'index, nofollow' : robots;

	// Breadcrumb schema
	const breadcrumbSchema = useMemo(() => breadcrumbs ? {
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: breadcrumbs.map((item, index) => ({
				'@type': 'ListItem',
				position: index + 1,
				name: item.name,
				item: item.url,
			})),
		} : null,
		[breadcrumbs],
	);

	const defaultStructuredData = useMemo(
		() => ({
			'@context': 'https://schema.org',
			'@type': 'SoftwareApplication',
			name: 'Koreshield',
			description: DEFAULT_DESCRIPTION,
			url: SITE_URL,
			applicationCategory: 'SecurityApplication',
			operatingSystem: 'Cross-platform',
			offers: {
				'@type': 'Offer',
				price: '0',
				priceCurrency: 'USD',
			},
			provider: {
				'@type': 'Organization',
				name: 'Koreshield',
				url: SITE_URL,
				logo: {
					'@type': 'ImageObject',
					url: 'https://koreshield.ai/logo/light/1x/White.png',
				},
				sameAs: [
					'https://github.com/koreshield/',
					'https://twitter.com/koreshield',
					'https://linkedin.com/company/koreshield',
				],
			},
			screenshot: ogImage,
			aggregateRating: {
				'@type': 'AggregateRating',
				ratingValue: '4.8',
				ratingCount: '156',
			},
		}),
		[ogImage],
	);

	const finalStructuredData = useMemo(
		() => structuredData || defaultStructuredData,
		[structuredData, defaultStructuredData],
	);
	useEffect(() => {
		syncJsonLd('page', finalStructuredData);
		syncJsonLd('breadcrumbs', breadcrumbSchema);
		return () => {
			syncJsonLd('page', null);
			syncJsonLd('breadcrumbs', null);
		};
	}, [finalStructuredData, breadcrumbSchema]);

	return (
		<Helmet>
			{/* Primary Meta Tags */}
			<title>{fullTitle}</title>
			<meta name="title" content={fullTitle} />
			<meta name="description" content={description} />
			<meta name="keywords" content={keywords} />
			{author && <meta name="author" content={author} />}

			{/* Robots & Indexing */}
			<meta name="robots" content={robotsContent} />
			<meta name="googlebot" content={robotsContent} />
			<meta name="bingbot" content={robotsContent} />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />

			{/* Canonical URL */}
			<link rel="canonical" href={canonical} />

			{/* Alternate Links */}
			<link rel="alternate" hrefLang="en-US" href={canonical} />

			{/* Open Graph / Facebook */}
			<meta property="og:type" content={ogType} />
			<meta property="og:url" content={canonical} />
			<meta property="og:title" content={fullTitle} />
			<meta property="og:description" content={description} />
			<meta property="og:image" content={ogImage} />
			<meta property="og:image:width" content="1200" />
			<meta property="og:image:height" content="630" />
			<meta property="og:site_name" content="Koreshield" />
			{publishedTime && <meta property="article:published_time" content={publishedTime} />}
			{modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
			{section && <meta property="article:section" content={section} />}

			{/* Twitter */}
			<meta property="twitter:card" content={twitterCard} />
			<meta property="twitter:url" content={canonical} />
			<meta property="twitter:title" content={fullTitle} />
			<meta property="twitter:description" content={description} />
			<meta property="twitter:image" content={ogImage} />
			<meta name="twitter:site" content="@koreshield" />
			<meta name="twitter:creator" content="@koreshield" />
			<meta name="twitter:domain" content="koreshield.ai" />

			{/* Additional Meta Tags */}
			<meta name="language" content="English" />
			<meta name="revisit-after" content="7 days" />
			<meta name="theme-color" content="#0EA5E9" />
			<meta name="apple-mobile-web-app-capable" content="yes" />
			<meta name="format-detection" content="telephone=no" />

		</Helmet>
	);
}
