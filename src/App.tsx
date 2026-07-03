import React, { Suspense, lazy, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary, RouteErrorBoundary } from './components/ErrorBoundary';
import { AppLayout } from './components/AppLayout';
import { MarketingLayout } from './components/MarketingLayout';
import { PageLoader, SuspenseFallback } from './components/LoadingStates';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastProvider, setGlobalToast, useToast } from './components/ToastNotification';
import { ThemeProvider } from './context/ThemeContext';
import { DashboardPage } from './pages/DashboardPage';
import { ApiKeysPage } from './pages/ApiKeysPage';

// Retry dynamic imports once on chunk-load failure (stale deploy cache)
function lazyRetry<T extends { default: React.ComponentType }>(
	importFn: () => Promise<T>,
): React.LazyExoticComponent<T['default']> {
	return lazy(() =>
		importFn().catch((err: unknown) => {
			const msg = err instanceof Error ? err.message.toLowerCase() : '';
			const isChunkError =
				msg.includes('failed to fetch dynamically imported module') ||
				msg.includes('importing a module script failed') ||
				msg.includes('loading chunk') ||
				msg.includes('loading module from');
			if (isChunkError) {
				const reloaded = sessionStorage.getItem('ks:chunk-reload');
				if (!reloaded) {
					sessionStorage.setItem('ks:chunk-reload', '1');
					window.location.reload();
					return new Promise(() => {});
				}
				sessionStorage.removeItem('ks:chunk-reload');
			}
			throw err;
		}),
	);
}

// Lazy load pages for code splitting
const LandingPage = lazyRetry(() => import('./pages/LandingPage'));
const BlogPage = lazyRetry(() => import('./pages/BlogPageWrapper'));
const AuthorPage = lazyRetry(() => import('./pages/AuthorPage'));
const DocsPage = lazyRetry(() => import('./pages/DocsPage'));
const StatusPage = lazyRetry(() => import('./pages/StatusPage'));
const PricingPage = lazyRetry(() => import('./pages/PricingPage'));
const ContactPage = lazyRetry(() => import('./pages/ContactPage'));
const AboutPage = lazyRetry(() => import('./pages/AboutPage'));
const ComparisonPage = lazyRetry(() => import('./pages/ComparisonPage'));
const VsLakeraPage = lazyRetry(() => import('./pages/VsLakeraPage'));
const VsLLMGuardPage = lazyRetry(() => import('./pages/VsLLMGuardPage'));
const VsBuildYourselfPage = lazyRetry(() => import('./pages/VsBuildYourselfPage'));
const WhyKoreShieldPage = lazyRetry(() => import('./pages/WhyKoreShieldPage'));
const FAQPage = lazyRetry(() => import('./pages/FAQPage'));
const NotFoundPage = lazyRetry(() => import('./pages/NotFoundPage'));
const DemoPage = lazyRetry(() => import('./pages/DemoPage'));
const LoginPage = lazyRetry(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazyRetry(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazyRetry(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazyRetry(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const VerifyEmailPage = lazyRetry(() => import('./pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const GitHubCallbackPage = lazyRetry(() => import('./pages/GitHubCallbackPage').then(m => ({ default: m.GitHubCallbackPage })));
const GoogleCallbackPage = lazyRetry(() => import('./pages/GoogleCallbackPage').then(m => ({ default: m.GoogleCallbackPage })));
const IntegrationsPage = lazyRetry(() => import('./pages/IntegrationsPage'));
const ChangelogPage = lazyRetry(() => import('./pages/ChangelogPage'));
const PoliciesPage = lazyRetry(() => import('./pages/PoliciesPage').then(m => ({ default: m.PoliciesPage })));
const MetricsPage = lazyRetry(() => import('./pages/MetricsPage').then(m => ({ default: m.MetricsPage })));
const AnalyticsPage = lazyRetry(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const RulesPage = lazyRetry(() => import('./pages/RulesPage').then(m => ({ default: m.RulesPage })));
const AlertsPage = lazyRetry(() => import('./pages/AlertsPage').then(m => ({ default: m.AlertsPage })));
// Phase 3 pages
const CostAnalyticsPage = lazyRetry(() => import('./pages/CostAnalyticsPage').then(m => ({ default: m.CostAnalyticsPage })));
const RBACPage = lazyRetry(() => import('./pages/RBACPage').then(m => ({ default: m.RBACPage })));
const ReportsPage = lazyRetry(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const TeamsPage = lazyRetry(() => import('./pages/TeamsPage').then(m => ({ default: m.TeamsPage })));
const TeamDetailsPage = lazyRetry(() => import('./pages/TeamDetailsPage').then(m => ({ default: m.TeamDetailsPage })));
const RAGSecurityPage = lazyRetry(() => import('./pages/RAGSecurityPage').then(m => ({ default: m.RAGSecurityPage })));
const AudioSecurityPage = lazyRetry(() => import('./pages/AudioSecurityPage').then(m => ({ default: m.AudioSecurityPage })));
const ThreatMonitoringPage = lazyRetry(() => import('./pages/ThreatMonitoringPage').then(m => ({ default: m.ThreatMonitoringPage })));
const ThreatMapPage = lazyRetry(() => import('./pages/ThreatMapPage').then(m => ({ default: m.ThreatMapPage })));
const ProviderHealthPage = lazyRetry(() => import('./pages/ProviderHealthPage').then(m => ({ default: m.ProviderHealthPage })));
const ApiKeyManagementPage = lazyRetry(() => import('./pages/ApiKeyManagementPage'));
const AuditLogsPage = lazyRetry(() => import('./pages/AuditLogsPage'));
const AdvancedAnalyticsPage = lazyRetry(() => import('./pages/AdvancedAnalyticsPage').then(m => ({ default: m.AdvancedAnalyticsPage })));
const ComplianceReportsPage = lazyRetry(() => import('./pages/ComplianceReportsPage').then(m => ({ default: m.ComplianceReportsPage })));
const FounderPortalPage = lazyRetry(() => import('./pages/FounderPortalPage').then(m => ({ default: m.FounderPortalPage })));
const InviteAcceptPage = lazyRetry(() => import('./pages/InviteAcceptPage').then(m => ({ default: m.InviteAcceptPage })));
const ProfilePage = lazyRetry(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazyRetry(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const BillingPage = lazyRetry(() => import('./pages/BillingPage'));
const UsageLimitsPage = lazyRetry(() => import('./pages/UsageLimitsPage'));
const LegalPage = lazyRetry(() => import('./pages/LegalPage'));
const CareersPage = lazyRetry(() => import('./pages/CareersPage'));
const CareerRolePage = lazyRetry(() => import('./pages/CareerRolePage'));
const ResearchPage = lazyRetry(() => import('./pages/ResearchPage'));
const ResearchArticlePage = lazyRetry(() => import('./pages/ResearchArticlePage'));
// Solution pages
const SolutionDetectionResponsePage = lazyRetry(() => import('./pages/SolutionDetectionResponsePage'));
const SolutionsPage = lazyRetry(() => import('./pages/SolutionsPage'));
const SolutionApplicationProtectionPage = lazyRetry(() => import('./pages/SolutionApplicationProtectionPage'));
const SolutionAgentsSecurityPage = lazyRetry(() => import('./pages/SolutionAgentsSecurityPage'));
const SolutionUsageControlPage = lazyRetry(() => import('./pages/SolutionUsageControlPage'));
const SolutionRAGSecurityPage = lazyRetry(() => import('./pages/SolutionRAGSecurityPage'));
const SolutionKorePilotPage = lazyRetry(() => import('./pages/SolutionKorePilotPage'));
const SolutionVoiceAudioProtectionPage = lazyRetry(() => import('./pages/SolutionVoiceAudioProtectionPage'));

function ScrollToTop() {
	const { hash, pathname, search } = useLocation();

	useEffect(() => {
		if (hash) {
			window.requestAnimationFrame(() => {
				document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
			});
			return;
		}

		window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
	}, [hash, pathname, search]);

	return null;
}

function AppContent() {
	const { addToast } = useToast();

	// Set global toast for use outside React components
	useEffect(() => {
		setGlobalToast(addToast);
	}, [addToast]);

	return (
		<Router>
			<ScrollToTop />
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
						path="/vs"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ComparisonPage />
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
					<Route path="/compare" element={<Navigate to="/vs" replace />} />
					<Route path="/compare/" element={<Navigate to="/vs" replace />} />
					<Route path="/compare/llm-guard" element={<Navigate to="/vs/llm-guard" replace />} />
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
						path="/faq"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<FAQPage />
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
						path="/invites/accept"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<InviteAcceptPage />
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
						path="/verify-email"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<VerifyEmailPage />
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
						path="/careers/:slug"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<CareerRolePage />
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
						path="/solutions"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<SolutionsPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
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
					<Route
						path="/solutions/korepilot"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<SolutionKorePilotPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/solutions/voice-audio-protection"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<SolutionVoiceAudioProtectionPage />
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
						path="/blog/:slug/*"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<BlogPage />
								</RouteErrorBoundary>
							</Suspense>
						}
					/>
					<Route
						path="/authors/:slug"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<AuthorPage />
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
										<Navigate to="/dashboard" replace />
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
						path="/usage"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<UsageLimitsPage />
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
									<ProtectedRoute>
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
						path="/voice-security"
						element={
							<Suspense fallback={<SuspenseFallback />}>
								<RouteErrorBoundary>
									<ProtectedRoute>
										<AudioSecurityPage />
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
							path="/founder"
							element={
								<Suspense fallback={<SuspenseFallback />}>
									<RouteErrorBoundary>
										<ProtectedRoute requiredRole="admin">
											<FounderPortalPage />
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
