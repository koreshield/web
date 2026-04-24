import React, { useEffect } from 'react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function Root({ children }: Props): JSX.Element {
  useEffect(() => {
    // Add theme-aware favicons to document head
    const updateFavicons = () => {
      // Remove any existing favicon links that we're about to replace
      const existingFavicons = Array.from(document.querySelectorAll('link[rel="icon"]'));
      existingFavicons.forEach(link => {
        // Keep only the fallback (no media attribute), we'll manage the rest
        if (!link.hasAttribute('media')) {
          link.remove();
        }
      });

      const head = document.head;

      // Create light mode favicons
      const lightIco = document.createElement('link');
      lightIco.rel = 'icon';
      lightIco.href = '/logo/light/1x/White.png';
      lightIco.sizes = '32x32';
      lightIco.media = '(prefers-color-scheme: light)';
      head.appendChild(lightIco);

      const light192 = document.createElement('link');
      light192.rel = 'icon';
      light192.type = 'image/png';
      light192.href = '/logo/light/2x/White@2x.jpg';
      light192.sizes = '192x192';
      light192.media = '(prefers-color-scheme: light)';
      head.appendChild(light192);

      const light512 = document.createElement('link');
      light512.rel = 'icon';
      light512.type = 'image/png';
      light512.href = '/logo/light/4x/White@4x.png';
      light512.sizes = '512x512';
      light512.media = '(prefers-color-scheme: light)';
      head.appendChild(light512);

      // Create dark mode favicons
      const darkIco = document.createElement('link');
      darkIco.rel = 'icon';
      darkIco.href = '/logo/dark/1x/Black.png';
      darkIco.sizes = '32x32';
      darkIco.media = '(prefers-color-scheme: dark)';
      head.appendChild(darkIco);

      const dark192 = document.createElement('link');
      dark192.rel = 'icon';
      dark192.type = 'image/png';
      dark192.href = '/logo/dark/2x/Black@2x.jpg';
      dark192.sizes = '192x192';
      dark192.media = '(prefers-color-scheme: dark)';
      head.appendChild(dark192);

      const dark512 = document.createElement('link');
      dark512.rel = 'icon';
      dark512.type = 'image/png';
      dark512.href = '/logo/dark/4x/Black@4x.png';
      dark512.sizes = '512x512';
      dark512.media = '(prefers-color-scheme: dark)';
      head.appendChild(dark512);

      // Fallback (dark mode icon)
      const fallback = document.createElement('link');
      fallback.rel = 'icon';
      fallback.href = '/logo/dark/1x/Black.png';
      fallback.sizes = '32x32';
      head.appendChild(fallback);
    };

    updateFavicons();
  }, []);

  return <>{children}</>;
}
