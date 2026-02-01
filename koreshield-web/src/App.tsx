import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary, RouteErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider, setGlobalToast, useToast } from './components/ToastNotification';
import { PageLoader, SuspenseFallback } from './components/LoadingStates';

// Lazy load pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const DocsPage = lazy(() => import('./pages/DocsPage'));
const StatusPage = lazy(() => import('./pages/StatusPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function AppContent() {
  const { addToast } = useToast();

  // Set global toast for use outside React components
  useEffect(() => {
    setGlobalToast(addToast);
  }, [addToast]);

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route 
            path="/" 
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <RouteErrorBoundary>
                  <LandingPage />
                </RouteErrorBoundary>
              </Suspense>
            } 
          />
          <Route 
            path="/docs" 
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <RouteErrorBoundary>
                  <DocsPage />
                </RouteErrorBoundary>
              </Suspense>
            } 
          />
          <Route 
            path="/docs/:slug" 
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <RouteErrorBoundary>
                  <DocsPage />
                </RouteErrorBoundary>
              </Suspense>
            } 
          />
          <Route 
            path="/status" 
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <RouteErrorBoundary>
                  <StatusPage />
                </RouteErrorBoundary>
              </Suspense>
            } 
          />
          <Route 
            path="*" 
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <NotFoundPage />
              </Suspense>
            } 
          />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <ToastProvider>
          <Suspense fallback={<PageLoader />}>
            <AppContent />
          </Suspense>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
