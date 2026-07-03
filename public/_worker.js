const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; script-src-attr 'none'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data: blob: https://koreshield.ai https://www.koreshield.ai https://koreshield.com https://www.koreshield.com https://cdn.sanity.io; font-src 'self' data:; connect-src 'self' https://api.koreshield.com wss://api.koreshield.com https://api.emailjs.com https://static.cloudflareinsights.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

const ASSET_PATH_PATTERN = /\.(js|css|png|jpg|jpeg|gif|svg|ico|json|xml|webp|woff|woff2|ttf|eot|txt|map)$/i;
const SEO_PATH_PATTERN = /^\/(robots\.txt|sitemap.*\.xml)$/i;
const HTML_CACHE = 'public, max-age=0, must-revalidate, s-maxage=300, stale-while-revalidate=86400';
const SEO_CACHE = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';
const CANONICAL_ORIGIN = 'https://koreshield.ai';
const CANONICAL_HOST = 'koreshield.ai';
const HOST_REDIRECTS = new Set([
  'koreshield.com',
  'www.koreshield.com',
  'www.koreshield.ai',
]);
const PATH_REDIRECTS = new Map([
  ['/compare', '/vs'],
  ['/compare/', '/vs'],
  ['/compare/llm-guard', '/vs/llm-guard'],
  ['/privacy', '/privacy-policy'],
  ['/terms', '/terms-of-service'],
  ['/cookies', '/cookie-policy'],
]);
const PUBLIC_EXACT_PATHS = new Set([
  '/', '/status', '/pricing', '/contact', '/about', '/vs',
  '/vs/lakera-guard', '/vs/llm-guard', '/vs/build-yourself',
  '/why-koreshield', '/faq', '/demo', '/integrations', '/changelog',
  '/privacy-policy', '/terms-of-service', '/cookie-policy', '/dpa',
  '/legal/sub-processors', '/legal/transfer-policy', '/careers', '/research',
  '/solutions', '/solutions/ai-detection-response',
  '/solutions/ai-application-protection', '/solutions/ai-agents-security',
  '/solutions/ai-usage-control', '/solutions/rag-security',
  '/solutions/korepilot', '/solutions/voice-audio-protection', '/blog', '/docs',
]);
const PRIVATE_PREFIXES = [
  '/dashboard', '/getting-started', '/profile', '/settings', '/billing', '/usage',
  '/policies', '/metrics', '/analytics', '/rules', '/alerts', '/cost-analytics',
  '/rbac', '/reports', '/teams', '/api-key-management', '/rag-security',
  '/voice-security', '/threat-monitoring', '/threat-map', '/provider-health',
  '/advanced-analytics', '/founder', '/compliance-reports', '/audit-logs',
  '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email',
  '/auth/', '/invites/',
];
const PAGE_METADATA = {
  '/': ['Koreshield | AI Security Firewall', 'Proxy-layer AI security for prompts, RAG context, provider routing, policy enforcement, and audit evidence.'],
  '/pricing': ['LLM Security Pricing | Koreshield', 'Koreshield pricing for production AI security, including protected requests, governance controls, and private deployment options.'],
  '/about': ['About Koreshield | AI Security Company', 'Learn how Koreshield is building a runtime security layer for production AI applications.'],
  '/contact': ['Contact Koreshield | AI Security Support and Sales', 'Contact Koreshield for technical support, enterprise AI security, partnerships, or product questions.'],
  '/vs': ['Compare Koreshield | LLM Security Alternatives', 'Compare Koreshield with LLM security alternatives and evaluate buying an AI firewall against building controls internally.'],
  '/why-koreshield': ['Why Koreshield | Runtime Security for Production AI', 'See how Koreshield protects prompts, RAG context, providers, policies, and audit evidence at runtime.'],
  '/faq': ['Koreshield FAQ | LLM and AI Security', 'Answers to common questions about Koreshield deployment, LLM protection, privacy, integrations, and pricing.'],
  '/demo': ['Book an AI Security Demo | Koreshield', 'Run a guided Koreshield demo against prompts, RAG, providers, alerts, and audit evidence.'],
  '/integrations': ['AI Security Integrations | Koreshield', 'Integrate Koreshield with AI models, application frameworks, providers, monitoring tools, and deployment platforms.'],
  '/blog': ['AI Security Blog | Koreshield', 'Technical articles about LLM security, prompt injection, RAG attacks, AI agents, and production defenses.'],
  '/docs': ['Koreshield Documentation | LLM Security API and SDKs', 'Koreshield API, SDK, deployment, configuration, integration, and production security documentation.'],
  '/research': ['AI Security Research | Koreshield', 'Koreshield research on prompt injection, RAG attacks, jailbreaks, data exfiltration, and production LLM defenses.'],
  '/solutions': ['AI Security Solutions | Koreshield', 'Explore Koreshield security for AI applications, agents, RAG, usage governance, detection, and response.'],
  '/solutions/ai-detection-response': ['AI Detection and Response | Koreshield', 'Detect and respond to malicious prompts, jailbreaks, data leakage, and unsafe AI behavior in real time.'],
  '/solutions/ai-application-protection': ['AI Application Protection | Koreshield', 'Protect production AI applications with runtime inspection, policy enforcement, and provider-aware controls.'],
  '/solutions/ai-agents-security': ['AI Agent Security | Koreshield', 'Protect AI agents from prompt injection, unsafe tool use, data exfiltration, and compromised context.'],
  '/solutions/ai-usage-control': ['AI Usage Control and Governance | Koreshield', 'Control model access, usage, costs, policies, and audit evidence across production AI systems.'],
  '/solutions/rag-security': ['RAG Security and Indirect Prompt Injection | Koreshield', 'Protect retrieval-augmented generation systems from poisoned documents, indirect prompt injection, and unsafe context.'],
  '/solutions/korepilot': ['KorePilot AI Security Assistant | Koreshield', 'Investigate AI security events, policies, providers, and audit evidence with KorePilot.'],
  '/solutions/voice-audio-protection': ['Voice and Audio AI Protection | Koreshield', 'Protect voice and audio AI workflows from unsafe content, adversarial input, and policy violations.'],
};
let seoManifestCache;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    const hostRedirect = canonicalHostRedirect(url);
    if (hostRedirect) {
      return hostRedirect;
    }

    const redirectedPath = PATH_REDIRECTS.get(pathname);
    if (redirectedPath) {
      url.hostname = CANONICAL_HOST;
      url.pathname = redirectedPath;
      return Response.redirect(url.toString(), 301);
    }

    if (!['GET', 'HEAD'].includes(request.method)) {
      return env.ASSETS.fetch(request);
    }

    if (SEO_PATH_PATTERN.test(pathname)) {
      const response = await env.ASSETS.fetch(request);
      return finalizeResponse(response, pathname, SEO_CACHE);
    }

    const seoManifest = await loadSeoManifest(request, env);

    if (isPublicRoute(pathname, seoManifest)) {
      return serveSpaShell(request, env, pathname, 200, false, seoManifest);
    }

    if (isPrivateRoute(pathname)) {
      return serveSpaShell(request, env, pathname, 200, true, seoManifest);
    }

    if (isSpaRoute(pathname)) {
      return serveSpaShell(request, env, pathname, 404, true, seoManifest);
    }

    const response = await env.ASSETS.fetch(request);
    return finalizeResponse(response, pathname);
  },
};

function canonicalHostRedirect(url) {
  if (url.hostname === 'blog.koreshield.com') {
    url.hostname = CANONICAL_HOST;
    url.pathname = url.pathname === '/' ? '/blog' : `/blog${url.pathname}`;
    return Response.redirect(url.toString(), 301);
  }

  if (url.hostname === 'docs.koreshield.com') {
    url.hostname = CANONICAL_HOST;
    url.pathname = url.pathname === '/' ? '/docs' : `/docs${url.pathname}`;
    return Response.redirect(url.toString(), 301);
  }

  if (HOST_REDIRECTS.has(url.hostname)) {
    url.hostname = CANONICAL_HOST;
    return Response.redirect(url.toString(), 301);
  }

  return null;
}

async function loadSeoManifest(request, env) {
  if (seoManifestCache) return seoManifestCache;
  try {
    const manifestUrl = new URL('/seo-routes.json', request.url);
    manifestUrl.hostname = CANONICAL_HOST;
    const response = await env.ASSETS.fetch(new Request(manifestUrl.toString()));
    if (!response.ok) return null;
    seoManifestCache = await response.json();
    return seoManifestCache;
  } catch {
    return null;
  }
}

function isPublicRoute(pathname, manifest) {
  return Boolean(manifest?.routes?.[pathname]) || PUBLIC_EXACT_PATHS.has(pathname);
}

function isPrivateRoute(pathname) {
  return PRIVATE_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`),
  );
}

function isSpaRoute(pathname) {
  if (pathname === '/' || pathname === '') {
    return true;
  }

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/static/')
  ) {
    return false;
  }

  if (ASSET_PATH_PATTERN.test(pathname) || pathname.includes('.')) {
    return false;
  }

  return true;
}

async function serveSpaShell(request, env, pathname, status, noindex, manifest) {
  const indexUrl = new URL('/index.html', request.url);
  const indexRequest = new Request(indexUrl.toString(), {
    method: request.method,
    headers: request.headers,
  });
  const response = await env.ASSETS.fetch(indexRequest);
  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Cache-Control', HTML_CACHE);
  if (noindex) {
    headers.set('X-Robots-Tag', 'noindex, follow');
  }

  const body = request.method === 'HEAD'
    ? null
    : injectSeoMetadata(await response.text(), pathname, noindex, manifest);

  return new Response(body, {
    status,
    headers: applySecurityHeaders(headers, pathname),
  });
}

function injectSeoMetadata(html, pathname, noindex, manifest) {
  const [title, description] = metadataForPath(pathname, noindex, manifest);
  const canonical = `${CANONICAL_ORIGIN}${pathname === '/' ? '' : pathname}`;
  const robots = noindex ? 'noindex, follow' : 'index, follow';
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);
  const escapedCanonical = escapeHtml(canonical);
  const metadata = [
    `<title>${escapedTitle}</title>`,
    `<meta name="description" content="${escapedDescription}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${escapedCanonical}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:url" content="${escapedCanonical}" />`,
    `<meta property="og:title" content="${escapedTitle}" />`,
    `<meta property="og:description" content="${escapedDescription}" />`,
    `<meta property="og:image" content="${CANONICAL_ORIGIN}/og-default.png" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta property="og:image:alt" content="Koreshield AI Security Firewall" />',
    '<meta property="og:locale" content="en_GB" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapedTitle}" />`,
    `<meta name="twitter:description" content="${escapedDescription}" />`,
    `<meta name="twitter:image" content="${CANONICAL_ORIGIN}/og-default.png" />`,
  ].join('\n\t');

  return html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+(?:name|property)="(?:description|robots|og:type|og:url|og:title|og:description|og:image|twitter:card|twitter:title|twitter:description|twitter:image)"[^>]*>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>/gi, '')
    .replace('</head>', `\t${metadata}\n</head>`);
}

function metadataForPath(pathname, noindex, manifest) {
  if (noindex) {
    return ['Page Not Found | Koreshield', 'The requested Koreshield page could not be found.'];
  }

  const manifestMetadata = manifest?.routes?.[pathname];
  if (manifestMetadata) {
    return [manifestMetadata.title, manifestMetadata.description];
  }

  if (PAGE_METADATA[pathname]) {
    return PAGE_METADATA[pathname];
  }

  const label = titleize(pathname.split('/').filter(Boolean).pop() || 'Koreshield');
  if (pathname.startsWith('/blog/')) {
    return [`${label} | Koreshield`, `Read ${label}, a Koreshield article about production AI and LLM security.`];
  }
  if (pathname.startsWith('/docs/')) {
    return [`${label} | Koreshield Documentation`, `Learn how to configure and use ${label} with Koreshield.`];
  }
  if (pathname.startsWith('/research/')) {
    return [`${label} | Koreshield Research`, `Koreshield security research: ${label}.`];
  }
  if (pathname.startsWith('/careers/')) {
    return [`${label} | Careers at Koreshield`, `Join Koreshield as ${label} and help secure production AI systems.`];
  }
  return [`${label} | Koreshield`, 'Koreshield runtime security for production AI applications.'];
}

function titleize(value) {
  return value
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function finalizeResponse(response, pathname, cacheControl) {
  const headers = applySecurityHeaders(new Headers(response.headers), pathname);

  if (cacheControl) {
    headers.set('Cache-Control', cacheControl);
  } else if (pathname.endsWith('.html')) {
    headers.set('Cache-Control', HTML_CACHE);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function applySecurityHeaders(headers, pathname) {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }

  if (!pathname.startsWith('/api/')) {
    headers.delete('Access-Control-Allow-Origin');
    headers.delete('Access-Control-Allow-Credentials');
    headers.delete('Access-Control-Allow-Methods');
    headers.delete('Access-Control-Allow-Headers');
  }

  return headers;
}
