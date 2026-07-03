import { loadScriptWhenConsented } from './consent';

export function initThirdPartyScripts() {
  // Google Analytics (GA4) — set VITE_GA_ID in env to enable
  const gaId = import.meta.env.VITE_GA_ID as string | undefined;
  if (gaId) {
    loadScriptWhenConsented({
      src: `https://www.googletagmanager.com/gtag/js?id=${gaId}`,
      category: 'analytics',
      id: 'koreshield-gtag',
      async: true,
    }).then((el) => {
      if (el) {
        // Initialize gtag when script is injected
        (window as any).dataLayer = (window as any).dataLayer || [];
        function gtag(...args: any[]) { ((window as any).dataLayer as any[]).push(...args); }
        (window as any).gtag = (window as any).gtag || gtag;
        (window as any).gtag('js', new Date());
        (window as any).gtag('config', gaId, { anonymize_ip: true });
      }
    });
  }

  // Hotjar — set VITE_HOTJAR_ID and VITE_HOTJAR_SV to enable
  const hjId = import.meta.env.VITE_HOTJAR_ID as string | undefined;
  const hjSv = import.meta.env.VITE_HOTJAR_SV as string | undefined;
  if (hjId && hjSv) {
    loadScriptWhenConsented({
      src: `https://static.hotjar.com/c/hotjar-${hjId}.js?sv=${hjSv}`,
      category: 'analytics',
      id: 'koreshield-hotjar',
      async: true,
    });
  }

  // Additional providers can be added here similarly.
}

export default initThirdPartyScripts;
