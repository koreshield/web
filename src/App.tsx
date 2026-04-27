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
import { DashboardPage } from './pages/DashboardPage';
import GettingStartedPage from './pages/GettingStartedPage';
import { ApiKeysPage } from './pages/ApiKeysPage';

// Lazy load pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const BlogPage = lazy(() => import('./pages/BlogPageWrapper'));
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
const DemoPage = lazy(() => import('./pages/DemoPage'));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const GitHubCallbackPage = lazy(() => import('./pages/GitHubCallbackPage').then(m => ({ default: m.GitHubCallbackPage })));
const GoogleCallbackPage = lazy(() => import('./pages/GoogleCallbackPage').then(m => ({ default: m.GoogleCallbackPage })));
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage'));
const ChangelogPage = lazy(() => import('./pages/ChangelogPage'));
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
const TeamDetailsPage = lazy(() => import('./pages/TeamDetailsPage').then(m => ({ default: m.TeamDetailsPage })));
const RAGSecurityPage = lazy(() => import('./pages/RAGSecurityPage').then(m => ({ default: m.RAGSecurityPage })));
const ThreatMonitoringPage = lazy(() => import('./pages/ThreatMonitoringPage').then(m => ({ default: m.ThreatMonitoringPage })));
const ThreatMapPage = lazy(() => import('./pages/ThreatMapPage').then(m => ({ default: m.ThreatMapPage })));
const ProviderHealthPage = lazy(() => import('./pages/ProviderHealthPage').then(m => ({ default: m.ProviderHealthPage })));
const ApiKeyManagementPage = lazy(() => import('./pages/ApiKeyManagementPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
const AdvancedAnalyticsPage = lazy(() => import('./pages/AdvancedAnalyticsPage').then(m => ({ default: m.AdvancedAnalyticsPage })));
const ComplianceReportsPage = lazy(() => import('./pages/ComplianceReportsPage').then(m => ({ default: m.ComplianceReportsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const CareersPage = lazy(() => import('./pages/CareersPage'));
const ResearchPage = lazy(() => import('./pages/ResearchPage'));
const ResearchArticlePage = lazy(() => import('./pages/ResearchArticlePage'));
// Solution pages
const SolutionDetectionResponsePage = lazy(() => import('./pages/SolutionDetectionResponsePage'));
const SolutionApplicationProtectionPage = lazy(() => import('./pages/SolutionApplicationProtectionPage'));
const SolutionAgentsSecurityPage = lazy(() => import('./pages/SolutionAgentsSecurityPage'));
const SolutionUsageControlPage = lazy(() => import('./pages/SolutionUsageControlPage'));
const SolutionRAGSecurityPage = lazy(() => import('./pages/SolutionRAGSecurityPage'));

function AppContent() {
	const { addToast } = useToast();

	// Set global toast for use outside React components
	useEffect(() => {
		setGlobalToast(addToast);
	}, [addToast]);

	return (
		<Router>
			<Routes>
				{/* Marketing/Public Layout */}
				<Route element={<MarketingLayout />}>
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
						path="/demo"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<DemoPage />
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
						path="/forgot-password"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ForgotPasswordPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/reset-password"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ResetPasswordPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/auth/github-callback"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<GitHubCallbackPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/auth/google-callback"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<GoogleCallbackPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/privacy-policy"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<LegalPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/privacy"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<LegalPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/terms-of-service"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<LegalPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/terms"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<LegalPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/cookie-policy"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<LegalPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/cookies"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<LegalPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/dpa"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<LegalPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/legal/sub-processors"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<LegalPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/legal/transfer-policy"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<LegalPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					
					<Route
						path="/careers"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<CareersPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/research"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ResearchPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/research/:slug"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ResearchArticlePage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					{/* Solution pages */}
					<Route
						path="/solutions/ai-detection-response"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<SolutionDetectionResponsePage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/solutions/ai-application-protection"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<SolutionApplicationProtectionPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/solutions/ai-agents-security"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<SolutionAgentsSecurityPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/solutions/ai-usage-control"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<SolutionUsageControlPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/solutions/rag-security"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<SolutionRAGSecurityPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					{/* Blog */}
					<Route
						path="/blog"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<BlogPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/blog/*"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<BlogPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>

					{/* Documentation */}
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
						path="*"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<NotFoundPage />
							</Suspense>
						}
					/>
				</Route>

				{/* App Layout - Authenticated Routes */}
				<Route element={<AppLayout />}>
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
						path="/getting-started"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<GettingStartedPage />
									</ProtectedRoute>
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
						path="/settings"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<SettingsPage />
									</ProtectedRoute>
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/billing"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<BillingPage />
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
									<ProtectedRoute requiredRole="admin">
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
									<ProtectedRoute requiredRole="admin">
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
									<ProtectedRoute requiredRole="admin">
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
						path="/teams/:teamId"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<TeamDetailsPage />
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
									<ProtectedRoute requiredRole="admin">
										<ApiKeyManagementPage />
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
						path="/advanced-analytics"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute requiredRole="admin">
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
									<ProtectedRoute requiredRole="admin">
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
