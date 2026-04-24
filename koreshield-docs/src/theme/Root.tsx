import React, { useEffect } from 'react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function Root({ children }: Props): JSX.Element {
  useEffect(() => {
    // Add dark/light mode favicon support
    const addFaviconLinks = () => {
      // Remove existing favicon links
      const existingLinks = document.querySelectorAll('link[rel="icon"]');
      existingLinks.forEach(link => {
        if (!link.hasAttribute('media')) {
          link.remove();
        }
      });

      // Add theme-aware favicon links
      const lightFavicon = document.createElement('link');
      lightFavicon.rel = 'icon';
      lightFavicon.href = '/favicon/icon-light.ico';
      lightFavicon.sizes = '96x96';
      lightFavicon.media = '(prefers-color-scheme: light)';

      const darkFavicon = document.createElement('link');
      darkFavicon.rel = 'icon';
      darkFavicon.href = '/favicon/icon-dark.ico';
      darkFavicon.sizes = '96x96';
      darkFavicon.media = '(prefers-color-scheme: dark)';

      // Fallback favicon (uses dark icon as default)
      const fallbackFavicon = document.createElement('link');
      fallbackFavicon.rel = 'icon';
      fallbackFavicon.href = '/favicon/icon-dark.ico';
      fallbackFavicon.sizes = '96x96';

      document.head.appendChild(lightFavicon);
      document.head.appendChild(darkFavicon);
      document.head.appendChild(fallbackFavicon);
    };

    addFaviconLinks();
  }, []);

  return <>{children}</>;
}
