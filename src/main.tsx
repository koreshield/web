import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query-client'
import '@fontsource/geist-sans/400.css';
import '@fontsource/geist-sans/500.css';
import '@fontsource/geist-sans/600.css';
import '@fontsource/geist-sans/700.css';
import './index.css'
import App from './App.tsx'

const SPA_REDIRECT_KEY = 'koreshield-spa-redirect';

const pendingRedirect = window.sessionStorage.getItem(SPA_REDIRECT_KEY);
if (pendingRedirect) {
  window.sessionStorage.removeItem(SPA_REDIRECT_KEY);
  if (window.location.pathname === '/' && pendingRedirect.startsWith('/')) {
    window.history.replaceState(null, '', pendingRedirect);
  }
}

if (import.meta.env.PROD) {
  const originalWarn = console.warn;
  const originalError = console.error;
  const ignoredSnippets = [
    'lockdown-install.js',
    'Removing intrinsics',
    'Promised response from onMessage listener went out of scope',
  ];

  const shouldIgnore = (args: unknown[]) => {
    const message = args.map(String).join(' ');
    return ignoredSnippets.some((snippet) => message.includes(snippet));
  };

  console.warn = (...args: unknown[]) => {
    if (shouldIgnore(args)) return;
    originalWarn(...args);
  };

  console.error = (...args: unknown[]) => {
    if (shouldIgnore(args)) return;
    originalError(...args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
