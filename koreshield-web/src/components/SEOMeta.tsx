import { Helmet } from 'react-helmet-async';

interface SEOMetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  canonicalUrl?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  structuredData?: object;
}

const DEFAULT_TITLE = 'KoreShield';
const DEFAULT_DESCRIPTION = 'The industry-standard LLM security solution. Protect your AI applications from prompt injection, jailbreaks, and data exfiltration with 95%+ detection accuracy.';
const DEFAULT_KEYWORDS = 'LLM security, AI security, prompt injection, jailbreak detection, GPT security, OpenAI security, LLM firewall, AI safety';
const DEFAULT_OG_IMAGE = 'https://koreshield.com/og-image.png';
const SITE_URL = 'https://koreshield.com';

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
}: SEOMetaProps) {
  const fullTitle = title ? `${title} | ${DEFAULT_TITLE}` : DEFAULT_TITLE;
  const canonical = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : SITE_URL);

  // Default organization structured data
  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'KoreShield',
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    applicationCategory: 'SecurityApplication',
    operatingSystem: 'Cross-platform',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'GBP',
    },
    provider: {
      '@type': 'Organization',
      name: 'KoreShield',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: 'https://koreshield.com/logo/PNG/White.png',
      },
      sameAs: [
        'https://github.com/koreshield/koreshield',
        'https://twitter.com/koreshield',
        'https://linkedin.com/company/koreshield',
      ],
    },
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {author && <meta name="author" content={author} />}

      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="KoreShield" />
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

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="theme-color" content="#0EA5E9" />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>
    </Helmet>
  );
}

// Specific SEO configurations for different pages
export const SEOConfig = {
  home: {
    title: 'LLM Security & AI Firewall',
    description: 'Industry-standard LLM security solution protecting AI applications from prompt injection, jailbreaks, and data exfiltration. 95%+ detection accuracy. Open source.',
    keywords: 'LLM security, AI security, prompt injection, jailbreak detection, GPT security, OpenAI security, LLM firewall, AI safety, machine learning security',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'KoreShield',
      url: 'https://koreshield.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://koreshield.com/docs?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  },
  pricing: {
    title: 'Pricing',
    description: 'Transparent pricing for KoreShield LLM security. Start free with open-source tier. Affordable plans for startups and enterprises. UK-based support.',
    keywords: 'LLM security pricing, AI security cost, prompt injection protection pricing, enterprise LLM security',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does the pricing work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Our pricing is based on the number of API requests per month and the level of support you need. The Open Source tier is completely free for self-hosted deployments.',
          },
        },
      ],
    },
  },
  about: {
    title: 'About Us',
    description: 'KoreShield is pioneering the next generation of LLM security. Built in the UK, we\'re making AI-powered applications safer for everyone.',
    keywords: 'KoreShield team, AI security company, LLM security research, UK AI startup, innovation visa',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'KoreShield',
      url: 'https://koreshield.com',
      logo: 'https://koreshield.com/logo/PNG/White.png',
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
