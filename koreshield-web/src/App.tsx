import { Suspense, lazy, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ErrorBoundary, RouteErrorBoundary } from './components/ErrorBoundary';
import { AppLayout } from './components/AppLayout';
import { MarketingLayout } from './components/MarketingLayout';
import { PageLoader, SuspenseFallback } from './components/LoadingStates';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastProvider, setGlobalToast, useToast } from './components/ToastNotification';
import { ThemeProvider } from './context/ThemeContext';

// ── Marketing / public pages ─────────────────────────────────────────────────
const LandingPage         = lazy(() => import('./pages/LandingPage'));
const StatusPage          = lazy(() => import('./pages/StatusPage'));
const PlaygroundPage      = lazy(() => import('./pages/PlaygroundPage'));
const PricingPage         = lazy(() => import('./pages/PricingPage'));
const ContactPage         = lazy(() => import('./pages/ContactPage'));
const AboutPage           = lazy(() => import('./pages/AboutPage'));
const VsLakeraPage        = lazy(() => import('./pages/VsLakeraPage'));
const VsLLMGuardPage      = lazy(() => import('./pages/VsLLMGuardPage'));
const VsBuildYourselfPage = lazy(() => import('./pages/VsBuildYourselfPage'));
const WhyKoreShieldPage   = lazy(() => import('./pages/WhyKoreShieldPage'));
const DemoPage            = lazy(() => import('./pages/DemoPage'));
const NotFoundPage        = lazy(() => import('./pages/NotFoundPage'));
const LoginPage           = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage          = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })));
const ForgotPasswordPage  = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage   = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const IntegrationsPage    = lazy(() => import('./pages/IntegrationsPage'));
const ChangelogPage       = lazy(() => import('./pages/ChangelogPage'));
const LegalPage           = lazy(() => import('./pages/LegalPage'));
const CareersPage         = lazy(() => import('./pages/CareersPage'));

// ── Authenticated app pages ───────────────────────────────────────────────────
const DashboardPage         = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const GettingStartedPage    = lazy(() => import('./pages/GettingStartedPage'));
const ProfilePage           = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const BillingPage           = lazy(() => import('./pages/BillingPage'));
const PoliciesPage          = lazy(() => import('./pages/PoliciesPage').then(m => ({ default: m.PoliciesPage })));
const MetricsPage           = lazy(() => import('./pages/MetricsPage').then(m => ({ default: m.MetricsPage })));
const AnalyticsPage         = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const RulesPage             = lazy(() => import('./pages/RulesPage').then(m => ({ default: m.RulesPage })));
const AlertsPage            = lazy(() => import('./pages/AlertsPage').then(m => ({ default: m.AlertsPage })));
const CostAnalyticsPage     = lazy(() => import('./pages/CostAnalyticsPage').then(m => ({ default: m.CostAnalyticsPage })));
const RBACPage              = lazy(() => import('./pages/RBACPage').then(m => ({ default: m.RBACPage })));
const ReportsPage           = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const TeamsPage             = lazy(() => import('./pages/TeamsPage').then(m => ({ default: m.TeamsPage })));
const TeamDetailsPage       = lazy(() => import('./pages/TeamDetailsPage').then(m => ({ default: m.TeamDetailsPage })));
const ApiKeyManagementPage  = lazy(() => import('./pages/ApiKeyManagementPage'));
const RAGSecurityPage       = lazy(() => import('./pages/RAGSecurityPage').then(m => ({ default: m.RAGSecurityPage })));
const ThreatMonitoringPage  = lazy(() => import('./pages/ThreatMonitoringPage').then(m => ({ default: m.ThreatMonitoringPage })));
const ThreatMapPage         = lazy(() => import('./pages/ThreatMapPage').then(m => ({ default: m.ThreatMapPage })));
const ProviderHealthPage    = lazy(() => import('./pages/ProviderHealthPage').then(m => ({ default: m.ProviderHealthPage })));
const AdvancedAnalyticsPage = lazy(() => import('./pages/AdvancedAnalyticsPage').then(m => ({ default: m.AdvancedAnalyticsPage })));
const ComplianceReportsPage = lazy(() => import('./pages/ComplianceReportsPage').then(m => ({ default: m.ComplianceReportsPage })));
const AuditLogsPage         = lazy(() => import('./pages/AuditLogsPage'));

// ── Helpers ──────────────────────────────────────────────────────────────────

function Wrap({ children }: { children: React.ReactNode }) {
	return (
		<Suspense fallback={<SuspenseFallback />}>
			<RouteErrorBoundary>{children}</RouteErrorBoundary>
		</Suspense>
	);
}

function Protected({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'admin' }) {
	return (
		<Wrap>
			<ProtectedRoute requiredRole={requiredRole}>{children}</ProtectedRoute>
		</Wrap>
	);
}

// ── Router ───────────────────────────────────────────────────────────────────

function AppContent() {
	const { addToast } = useToast();
	useEffect(() => { setGlobalToast(addToast); }, [addToast]);

	return (
		<Router>
			<Routes>

				{/* ── Marketing layout (public pages) ────────────────────── */}
				<Route element={<MarketingLayout />}>
					<Route path="/"                  element={<Wrap><LandingPage /></Wrap>} />
					<Route path="/status"            element={<Wrap><StatusPage /></Wrap>} />
					<Route path="/playground"        element={<Wrap><PlaygroundPage /></Wrap>} />
					<Route path="/pricing"           element={<Wrap><PricingPage /></Wrap>} />
					<Route path="/contact"           element={<Wrap><ContactPage /></Wrap>} />
					<Route path="/about"             element={<Wrap><AboutPage /></Wrap>} />
					<Route path="/vs/lakera-guard"   element={<Wrap><VsLakeraPage /></Wrap>} />
					<Route path="/vs/llm-guard"      element={<Wrap><VsLLMGuardPage /></Wrap>} />
					<Route path="/vs/build-yourself" element={<Wrap><VsBuildYourselfPage /></Wrap>} />
					<Route path="/why-koreshield"    element={<Wrap><WhyKoreShieldPage /></Wrap>} />
					<Route path="/demo"              element={<Wrap><DemoPage /></Wrap>} />
					<Route path="/integrations"      element={<Wrap><IntegrationsPage /></Wrap>} />
					<Route path="/changelog"         element={<Wrap><ChangelogPage /></Wrap>} />
					<Route path="/login"             element={<Wrap><LoginPage /></Wrap>} />
					<Route path="/signup"            element={<Wrap><SignupPage /></Wrap>} />
					<Route path="/forgot-password"   element={<Wrap><ForgotPasswordPage /></Wrap>} />
					<Route path="/reset-password"    element={<Wrap><ResetPasswordPage /></Wrap>} />
					<Route path="/privacy-policy"    element={<Wrap><LegalPage /></Wrap>} />
					<Route path="/terms-of-service"  element={<Wrap><LegalPage /></Wrap>} />
					<Route path="/cookie-policy"     element={<Wrap><LegalPage /></Wrap>} />
					<Route path="/careers"           element={<Wrap><CareersPage /></Wrap>} />
					<Route path="*"                  element={<Wrap><NotFoundPage /></Wrap>} />
				</Route>

				{/* ── App layout (authenticated pages) ───────────────────── */}
				<Route element={<AppLayout />}>
					<Route path="/dashboard"          element={<Protected><DashboardPage /></Protected>} />
					<Route path="/getting-started"    element={<Protected><GettingStartedPage /></Protected>} />
					<Route path="/profile"            element={<Protected><ProfilePage /></Protected>} />
					<Route path="/billing"            element={<Protected><BillingPage /></Protected>} />
					<Route path="/policies"           element={<Protected requiredRole="admin"><PoliciesPage /></Protected>} />
					<Route path="/metrics"            element={<Protected><MetricsPage /></Protected>} />
					<Route path="/analytics"          element={<Protected><AnalyticsPage /></Protected>} />
					<Route path="/rules"              element={<Protected><RulesPage /></Protected>} />
					<Route path="/alerts"             element={<Protected><AlertsPage /></Protected>} />
					<Route path="/cost-analytics"     element={<Protected requiredRole="admin"><CostAnalyticsPage /></Protected>} />
					<Route path="/rbac"               element={<Protected requiredRole="admin"><RBACPage /></Protected>} />
					<Route path="/reports"            element={<Protected><ReportsPage /></Protected>} />
					<Route path="/teams"              element={<Protected><TeamsPage /></Protected>} />
					<Route path="/teams/:teamId"      element={<Protected><TeamDetailsPage /></Protected>} />
					{/* Canonical API key route; /settings/api-keys kept as alias */}
					<Route path="/api-key-management" element={<Protected><ApiKeyManagementPage /></Protected>} />
					<Route path="/settings/api-keys"  element={<Protected><ApiKeyManagementPage /></Protected>} />
					<Route path="/rag-security"       element={<Protected><RAGSecurityPage /></Protected>} />
					<Route path="/threat-monitoring"  element={<Protected><ThreatMonitoringPage /></Protected>} />
					<Route path="/threat-map"         element={<Protected><ThreatMapPage /></Protected>} />
					<Route path="/provider-health"    element={<Protected><ProviderHealthPage /></Protected>} />
					<Route path="/advanced-analytics" element={<Protected requiredRole="admin"><AdvancedAnalyticsPage /></Protected>} />
					<Route path="/compliance-reports" element={<Protected requiredRole="admin"><ComplianceReportsPage /></Protected>} />
					<Route path="/audit-logs"         element={<Protected><AuditLogsPage /></Protected>} />
				</Route>

			</Routes>
		</Router>
	);
}

// ── App root ─────────────────────────────────────────────────────────────────

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
