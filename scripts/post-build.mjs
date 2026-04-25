#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('Running post-build setup...');

// Create a root _redirects file for Cloudflare if needed
const redirects = `
# Redirect /app to /app/
/app /app/ 301

# Catch-all for SPA routing (if needed)
/* /index.html 200
`;

fs.writeFileSync(path.join('dist', '_redirects'), redirects.trim());
console.log('[OK] Created _redirects for Cloudflare routing');

// Ensure index.html exists in subdirectories for proper routing
const dirs = ['blog', 'docs'];
for (const dir of dirs) {
  const indexPath = path.join('dist', dir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.log(`[WARN] No index.html in dist/${dir}/`);
  } else {
    console.log(`[OK] Verified dist/${dir}/index.html`);
  }
}

console.log('[DONE] Post-build setup complete!');
