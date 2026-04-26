/**
 * Cloudflare Pages Functions Worker
 * Handles SPA routing by redirecting 404s to index.html
 */

export async function onRequest(context) {
  try {
    const response = await context.next();
    
    // If 404 and not an API/asset request, serve index.html
    if (response.status === 404) {
      const url = new URL(context.request.url);
      const pathname = url.pathname;
      
      // Don't redirect API calls, static assets, or known non-page routes
      if (
        !pathname.startsWith('/api/') &&
        !pathname.startsWith('/assets/') &&
        !pathname.startsWith('/static/') &&
        !pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|json|xml|webp|woff|woff2|ttf|eot)$/i) &&
        !pathname.includes('.')
      ) {
        // Serve index.html for SPA routes
        return new Response(await context.env.ASSETS.get('index.html'), {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=0, must-revalidate'
          }
        });
      }
    }
    
    return response;
  } catch (error) {
    // Pass through on error
    return await context.next();
  }
}
