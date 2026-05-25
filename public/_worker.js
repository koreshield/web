const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; script-src-attr 'none'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data: blob: https://koreshield.ai https://www.koreshield.ai https://cdn.sanity.io; font-src 'self' data:; connect-src 'self' https://api.koreshield.com wss://api.koreshield.com https://api.emailjs.com https://static.cloudflareinsights.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

const ASSET_PATH_PATTERN = /\.(js|css|png|jpg|jpeg|gif|svg|ico|json|xml|webp|woff|woff2|ttf|eot|txt|map)$/i;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);

    if (shouldServeSpaShell(request, url.pathname, response.status)) {
      return serveSpaShell(request, env, url.pathname);
    }

    return withSecurityHeaders(response, url.pathname);
  },
};

function shouldServeSpaShell(request, pathname, status) {
  if (status !== 404 || !['GET', 'HEAD'].includes(request.method)) {
    return false;
  }

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/static/') ||
    ASSET_PATH_PATTERN.test(pathname) ||
    pathname.includes('.')
  ) {
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
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  return new Response(request.method === 'HEAD' ? null : response.body, {
    status: 200,
    headers: applySecurityHeaders(headers, pathname),
  });
}

function withSecurityHeaders(response, pathname) {
  const headers = applySecurityHeaders(new Headers(response.headers), pathname);

  if (pathname === '/robots.txt' || pathname.endsWith('.html') || !pathname.includes('.')) {
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
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
