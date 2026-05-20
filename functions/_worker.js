/**
 * Cloudflare Pages Functions Worker
 * Handles SPA routing by redirecting 404s to index.html
 */

export async function onRequest(context) {
  try {
    const response = await context.next();
    const url = new URL(context.request.url);
    const pathname = url.pathname;
    
    // If 404 and not an API/asset request, serve index.html
    if (response.status === 404) {
      // Don't redirect API calls, static assets, or actual files
      if (
        !pathname.startsWith('/api/') &&
        !pathname.startsWith('/assets/') &&
        !pathname.startsWith('/static/') &&
        !pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|json|xml|webp|woff|woff2|ttf|eot)$/i) &&
        !pathname.includes('.')
      ) {
        // Serve index.html for SPA routes (including /docs/*)
        return new Response(await context.env.ASSETS.get('index.html'), {
          status: 200,
          headers: withSecurityHeaders(new Headers({
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }), pathname)
        });
      }
    }
    
    const headers = withSecurityHeaders(new Headers(response.headers), pathname);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  } catch (error) {
    // Pass through on error
    return await context.next();
  }
}

function withSecurityHeaders(headers, pathname) {
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; script-src-attr 'none'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data: blob: https://koreshield.ai https://www.koreshield.ai https://cdn.sanity.io; font-src 'self' data:; connect-src 'self' https://api.koreshield.com wss://api.koreshield.com https://api.emailjs.com https://static.cloudflareinsights.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"
  );
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  if (!pathname.startsWith('/api/')) {
    headers.delete('Access-Control-Allow-Origin');
    headers.delete('Access-Control-Allow-Credentials');
    headers.delete('Access-Control-Allow-Methods');
    headers.delete('Access-Control-Allow-Headers');
  }

  if (pathname === '/robots.txt' || pathname.endsWith('.html') || !pathname.includes('.')) {
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  }

  return headers;
}
