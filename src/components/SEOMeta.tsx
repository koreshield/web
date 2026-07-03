import { Helmet } from 'react-helmet-async';
import { useEffect, useMemo } from 'react';
import { syncJsonLd } from '../lib/seoSchema';
import { PRIMARY_SITE_URL, resolveCanonicalUrl } from '../lib/site-url';

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
const DEFAULT_OG_IMAGE = 'https://koreshield.ai/og-default.png';

export function SEOMeta({
	title,
	description = DEFAULT_DESCRIPTION,
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
	const canonical = resolveCanonicalUrl(canonicalUrl);
	
	const robotsContent = noindex ? 'noindex, follow' : nofollow ? 'index, nofollow' : robots;

	const resolvedBreadcrumbs = useMemo(() => {
		if (noindex) return null;
		if (breadcrumbs) return breadcrumbs;
		const pathname = new URL(canonical).pathname;
		const segments = pathname.split('/').filter(Boolean);
		if (segments.length === 0) return null;
		return [
			{ name: 'Home', url: PRIMARY_SITE_URL },
			...segments.map((segment, index) => ({
				name: segment
					.split('-')
					.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
					.join(' '),
				url: `${PRIMARY_SITE_URL}/${segments.slice(0, index + 1).join('/')}`,
			})),
		];
	}, [breadcrumbs, canonical, noindex]);

	const breadcrumbSchema = useMemo(() => resolvedBreadcrumbs ? {
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: resolvedBreadcrumbs.map((item, index) => ({
				'@type': 'ListItem',
				position: index + 1,
				name: item.name,
				item: item.url,
			})),
		} : null,
		[resolvedBreadcrumbs],
	);

	const defaultStructuredData = useMemo(
		() => ({
			'@context': 'https://schema.org',
			'@type': 'WebPage',
			'@id': `${canonical}#webpage`,
			url: canonical,
			name: fullTitle,
			description,
			isPartOf: {
				'@type': 'WebSite',
				'@id': `${PRIMARY_SITE_URL}/#website`,
				url: PRIMARY_SITE_URL,
				name: 'Koreshield',
			},
			about: { '@id': `${PRIMARY_SITE_URL}/#organization` },
			primaryImageOfPage: {
				'@type': 'ImageObject',
				url: ogImage,
			},
		}),
		[canonical, description, fullTitle, ogImage],
	);

	const finalStructuredData = useMemo(
		() => noindex ? null : (structuredData || defaultStructuredData),
		[noindex, structuredData, defaultStructuredData],
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
			{author && <meta name="author" content={author} />}

			{/* Robots & Indexing */}
			<meta name="robots" content={robotsContent} />
			<meta name="googlebot" content={robotsContent} />
			<meta name="bingbot" content={robotsContent} />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />

			{/* Canonical URL */}
			<link rel="canonical" href={canonical} />

			{/* Alternate Links */}
			{/* Open Graph / Facebook */}
			<meta property="og:type" content={ogType} />
			<meta property="og:url" content={canonical} />
			<meta property="og:title" content={fullTitle} />
			<meta property="og:description" content={description} />
			<meta property="og:image" content={ogImage} />
			<meta property="og:image:alt" content={`${fullTitle} social preview`} />
			<meta property="og:image:width" content="1200" />
			<meta property="og:image:height" content="630" />
			<meta property="og:site_name" content="Koreshield" />
			<meta property="og:locale" content="en_GB" />
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
			<meta name="theme-color" content="#0EA5E9" />
			<meta name="apple-mobile-web-app-capable" content="yes" />
			<meta name="format-detection" content="telephone=no" />

		</Helmet>
	);
}
