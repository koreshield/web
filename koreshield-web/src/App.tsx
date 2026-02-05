import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Layout } from './components/Layout';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary, RouteErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider, setGlobalToast, useToast } from './components/ToastNotification';
import { PageLoader, SuspenseFallback } from './components/LoadingStates';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy load pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const DocsPage = lazy(() => import('./pages/DocsPage'));
const StatusPage = lazy(() => import('./pages/StatusPage'));
const PlaygroundPage = lazy(() => import('./pages/PlaygroundPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const VsLakeraPage = lazy(() => import('./pages/VsLakeraPage'));
const VsLLMGuardPage = lazy(() => import('./pages/VsLLMGuardPage'));
const VsBuildYourselfPage = lazy(() => import('./pages/VsBuildYourselfPage'));
const WhyKoreShieldPage = lazy(() => import('./pages/WhyKoreShieldPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage'));
const ChangelogPage = lazy(() => import('./pages/ChangelogPage'));
const TenantsPage = lazy(() => import('./pages/TenantsPage').then(m => ({ default: m.TenantsPage })));
const PoliciesPage = lazy(() => import('./pages/PoliciesPage').then(m => ({ default: m.PoliciesPage })));
const MetricsPage = lazy(() => import('./pages/MetricsPage').then(m => ({ default: m.MetricsPage })));

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
            path="/integrations"
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <RouteErrorBoundary>
                  <IntegrationsPage />
                </RouteErrorBoundary>
              </Suspense>
            }
          />
          <Route
            path="/changelog"
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <RouteErrorBoundary>
                  <ChangelogPage />
                </RouteErrorBoundary>
              </Suspense>
            }
          />
          <Route
            path="/docs/*"
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
            path="/playground"
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <RouteErrorBoundary>
                  <PlaygroundPage />
                </RouteErrorBoundary>
              </Suspense>
            }
          />
          <Route
            path="/pricing"
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <RouteErrorBoundary>
                  <PricingPage />
                </RouteErrorBoundary>
              </Suspense>
            }
          />
          <Route
            path="/contact"
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <RouteErrorBoundary>
                  <ContactPage />
                </RouteErrorBoundary>
              </Suspense>
            }
          />
          <Route
            path="/about"
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <RouteErrorBoundary>
                  <AboutPage />
                </RouteErrorBoundary>
              </Suspense>
            }
          />
          <Route
            path="/vs/lakera-guard"
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <RouteErrorBoundary>
                  <VsLakeraPage />
                </RouteErrorBoundary>
              </Suspense>
            }
          />
          <Route
            path="/vs/llm-guard"
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <RouteErrorBoundary>
                  <VsLLMGuardPage />
                </RouteErrorBoundary>
              </Suspense>
            }
          />
          <Route
            path="/vs/build-yourself"
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <RouteErrorBoundary>
                  <VsBuildYourselfPage />
                </RouteErrorBoundary>
              </Suspense>
            }
          />
          <Route
            path="/why-koreshield"
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <RouteErrorBoundary>
                  <WhyKoreShieldPage />
                </RouteErrorBoundary>
              </Suspense>
            }
          />
          <Route
            path="/login"
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <RouteErrorBoundary>
                  <LoginPage />
                </RouteErrorBoundary>
              </Suspense>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <RouteErrorBoundary>
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                </RouteErrorBoundary>
              </Suspense>
            }
          />
          <Route
            path="/tenants"
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <RouteErrorBoundary>
                  <ProtectedRoute>
                    <TenantsPage />
                  </ProtectedRoute>
                </RouteErrorBoundary>
              </Suspense>
            }
          />
          <Route
            path="/policies"
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <RouteErrorBoundary>
                  <ProtectedRoute>
                    <PoliciesPage />
                  </ProtectedRoute>
                </RouteErrorBoundary>
              </Suspense>
            }
          />
          <Route
            path="/metrics"
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <RouteErrorBoundary>
                  <ProtectedRoute>
                    <MetricsPage />
                  </ProtectedRoute>
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
      <HelmetProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <ToastProvider>
            <Suspense fallback={<PageLoader />}>
              <AppContent />
            </Suspense>
          </ToastProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
