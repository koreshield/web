export type ConsentCategory = 'functional' | 'analytics' | 'performance' | 'advertisement' | 'uncategorised';

export type ConsentState = {
  functional: boolean;
  analytics: boolean;
  performance: boolean;
  advertisement: boolean;
  uncategorised: boolean;
};

const STORAGE_KEY = 'koreshield_cookie_consent_v1';

const defaultConsent: ConsentState = {
  functional: false,
  analytics: false,
  performance: false,
  advertisement: false,
  uncategorised: false,
};

type Listener = (s: ConsentState) => void;
const listeners: Listener[] = [];

export function loadConsent(): ConsentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsentState) : defaultConsent;
  } catch {
    return defaultConsent;
  }
}

export function saveConsent(state: ConsentState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    listeners.forEach((l) => l(state));
  } catch {
    // ignore
  }
}

export function onConsentChange(cb: Listener) {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function hasConsent(category: ConsentCategory) {
  const s = loadConsent();
  return Boolean((s as any)[category]);
}

export async function loadScriptWhenConsented(options: {
  src: string;
  category: ConsentCategory;
  id?: string;
  attrs?: Record<string, string>;
  async?: boolean;
  defer?: boolean;
}) {
  const { src, category, id, attrs, async = true, defer = false } = options;

  // If already present, return existing
  if (id) {
    const el = document.getElementById(id) as HTMLScriptElement | null;
    if (el) return el;
  }

  const inject = () => {
    const s = document.createElement('script');
    if (id) s.id = id;
    s.src = src;
    s.async = async;
    if (defer) s.defer = true;
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
    }
    document.head.appendChild(s);
    return s;
  };

  if (hasConsent(category)) return inject();

  const unsub = onConsentChange((s) => {
    if ((s as any)[category]) {
      inject();
      unsub();
    }
  });

  return null;
}

export { defaultConsent };
