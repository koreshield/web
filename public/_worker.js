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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (!['GET', 'HEAD'].includes(request.method)) {
      return env.ASSETS.fetch(request);
    }

    if (SEO_PATH_PATTERN.test(pathname)) {
      const response = await env.ASSETS.fetch(request);
      return finalizeResponse(response, pathname, SEO_CACHE);
    }

    if (isSpaRoute(pathname)) {
      return serveSpaShell(request, env, pathname);
    }

    const response = await env.ASSETS.fetch(request);
    return finalizeResponse(response, pathname);
  },
};

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

async function serveSpaShell(request, env, pathname) {
  const indexUrl = new URL('/index.html', request.url);
  const indexRequest = new Request(indexUrl.toString(), {
    method: request.method,
    headers: request.headers,
  });
  const response = await env.ASSETS.fetch(indexRequest);
  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Cache-Control', HTML_CACHE);

  return new Response(request.method === 'HEAD' ? null : response.body, {
    status: 200,
    headers: applySecurityHeaders(headers, pathname),
  });
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
