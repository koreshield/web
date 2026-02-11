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
const SignupPage = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage'));
const ChangelogPage = lazy(() => import('./pages/ChangelogPage'));
const TenantsPage = lazy(() => import('./pages/TenantsPage').then(m => ({ default: m.TenantsPage })));
const PoliciesPage = lazy(() => import('./pages/PoliciesPage').then(m => ({ default: m.PoliciesPage })));
const MetricsPage = lazy(() => import('./pages/MetricsPage').then(m => ({ default: m.MetricsPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const RulesPage = lazy(() => import('./pages/RulesPage').then(m => ({ default: m.RulesPage })));
const AlertsPage = lazy(() => import('./pages/AlertsPage').then(m => ({ default: m.AlertsPage })));
// Phase 3 pages
const CostAnalyticsPage = lazy(() => import('./pages/CostAnalyticsPage').then(m => ({ default: m.CostAnalyticsPage })));
const RBACPage = lazy(() => import('./pages/RBACPage').then(m => ({ default: m.RBACPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const TeamsPage = lazy(() => import('./pages/TeamsPage').then(m => ({ default: m.TeamsPage })));
const ApiKeysPage = lazy(() => import('./pages/ApiKeysPage').then(m => ({ default: m.ApiKeysPage })));
const RAGSecurityPage = lazy(() => import('./pages/RAGSecurityPage').then(m => ({ default: m.RAGSecurityPage })));
const ThreatMonitoringPage = lazy(() => import('./pages/ThreatMonitoringPage').then(m => ({ default: m.ThreatMonitoringPage })));
const ThreatMapPage = lazy(() => import('./pages/ThreatMapPage').then(m => ({ default: m.ThreatMapPage })));
const ProviderHealthPage = lazy(() => import('./pages/ProviderHealthPage').then(m => ({ default: m.ProviderHealthPage })));
const ApiKeyManagementPage = lazy(() => import('./pages/ApiKeyManagementPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
const AdvancedAnalyticsPage = lazy(() => import('./pages/AdvancedAnalyticsPage').then(m => ({ default: m.AdvancedAnalyticsPage })));
const ComplianceReportsPage = lazy(() => import('./pages/ComplianceReportsPage').then(m => ({ default: m.ComplianceReportsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));

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
						path="/profile"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<ProfilePage />
									</ProtectedRoute>
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
						path="/signup"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<SignupPage />
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
						path="/analytics"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<AnalyticsPage />
									</ProtectedRoute>
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/rules"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<RulesPage />
									</ProtectedRoute>
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/alerts"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<AlertsPage />
									</ProtectedRoute>
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/cost-analytics"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<CostAnalyticsPage />
									</ProtectedRoute>
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/rbac"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<RBACPage />
									</ProtectedRoute>
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/reports"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<ReportsPage />
									</ProtectedRoute>
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/teams"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<TeamsPage />
									</ProtectedRoute>
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/settings/api-keys"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<ApiKeysPage />
									</ProtectedRoute>
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/rag-security"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<RAGSecurityPage />
									</ProtectedRoute>
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/threat-monitoring"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<ThreatMonitoringPage />
									</ProtectedRoute>
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/threat-map"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<ThreatMapPage />
									</ProtectedRoute>
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/provider-health"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<ProviderHealthPage />
									</ProtectedRoute>
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/api-key-management"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<ApiKeyManagementPage />
									</ProtectedRoute>
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/advanced-analytics"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<AdvancedAnalyticsPage />
									</ProtectedRoute>
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/compliance-reports"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<ComplianceReportsPage />
									</ProtectedRoute>
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/audit-logs"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<AuditLogsPage />
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
