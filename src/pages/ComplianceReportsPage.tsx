import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Calendar, CheckCircle, AlertTriangle, Clock, XCircle, Shield } from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';
import { api } from '../lib/api-client';
import { format } from 'date-fns';
import {
	AppPage,
	AppPageHeader,
	AppPageSection,
	AppEmptyState,
	AppPrimaryButton,
	AppCallout,
	AppSurface,
	AppPageError,
	AppPageLoading,
} from '../components/AppPageLayout';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ComplianceControl {
	id: string;
	name: string;
	status: 'pass' | 'warning' | 'fail';
	description: string;
	evidence: string;
}

interface CompliancePosture {
	framework: string;
	score: number;
	controls: ComplianceControl[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getStatusColor(status: string) {
	switch (status) {
		case 'compliant':
		case 'pass':
			return 'text-green-600 bg-green-500/10 border-green-500/50';
		case 'partial':
		case 'warning':
			return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/50';
		case 'non-compliant':
		case 'fail':
			return 'text-red-600 bg-red-500/10 border-red-500/50';
		default:
			return 'text-muted-foreground bg-muted border-border';
	}
}

function getStatusIcon(status: string) {
	switch (status) {
		case 'compliant':
		case 'pass':
			return <CheckCircle className="w-5 h-5 text-green-600" />;
		case 'partial':
		case 'warning':
			return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
		case 'non-compliant':
		case 'fail':
			return <XCircle className="w-5 h-5 text-red-600" />;
		default:
			return <Clock className="w-5 h-5 text-muted-foreground" />;
	}
}

function scoreToStatus(score: number): string {
	if (score >= 90) return 'compliant';
	if (score >= 70) return 'partial';
	return 'non-compliant';
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ComplianceReportsPage() {
	const [selectedFramework, setSelectedFramework] = useState<string | null>(null);

	// Real compliance posture from backend, derived from actual system state
	const {
		data: postureDataRaw,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['compliance-posture'],
		queryFn: () => api.getCompliancePosture(),
		refetchInterval: 5 * 60_000, // refresh every 5 minutes
		retry: false,
	});

	const postures: CompliancePosture[] = Array.isArray(postureDataRaw)
		? (postureDataRaw as CompliancePosture[])
		: [];

	const selectedPosture = postures.find(p => p.framework === selectedFramework) ?? null;

	const exportReport = (framework: string, controls: ComplianceControl[]) => {
		const lines = [
			`Koreshield Compliance Report: ${framework}`,
			`Generated: ${format(new Date(), 'PPpp')}`,
			'',
			'CONTROLS:',
			...controls.map(
				c => `[${c.status.toUpperCase()}] ${c.id}: ${c.name}\n  ${c.description}\n  Evidence: ${c.evidence}`
			),
		];
		const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `compliance-${framework.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<AppPage>
			<SEOMeta
				title="Compliance Reports | Koreshield"
				description="Real-time compliance posture assessment for SOC 2, ISO 27001, and GDPR"
			/>

			<AppPageHeader
				eyebrow="Governance"
				eyebrowIcon={Shield}
				title="Compliance Reports"
				description="Real-time compliance posture assessed from your live system state"
				icon={Shield}
			/>

			{isLoading ? (
				<AppPageLoading label="Loading compliance data…" />
			) : error ? (
				<AppPageError title="Failed to load compliance data" message="Please try again." />
			) : (
				<>
					<div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
						{postures.map((p) => {
							const status = scoreToStatus(p.score);
							const passing = p.controls.filter((c) => c.status === 'pass').length;
							const warning = p.controls.filter((c) => c.status === 'warning').length;
							const failing = p.controls.filter((c) => c.status === 'fail').length;
							return (
								<button
									key={p.framework}
									onClick={() => setSelectedFramework(
										selectedFramework === p.framework ? null : p.framework,
									)}
									className={`dashboard-card rounded-2xl p-6 text-left transition-colors ${
										selectedFramework === p.framework
											? 'border-primary ring-2 ring-primary/20'
											: 'hover:border-primary/50'
									}`}
								>
									<div className="mb-4 flex items-center justify-between">
										<span className="text-base font-semibold">{p.framework}</span>
										{getStatusIcon(status)}
									</div>
									<div className="space-y-2">
										<div className={`inline-block rounded-full border px-2 py-1 text-xs ${getStatusColor(status)}`}>
											{status.toUpperCase()}
										</div>
										<div className="mt-1 text-3xl font-black tracking-[-0.04em]">{p.score}%</div>
										<div className="mt-2 flex gap-3 text-xs text-muted-foreground">
											<span className="font-medium text-green-600">{passing} passing</span>
											{warning > 0 && <span className="font-medium text-yellow-600">{warning} warning</span>}
											{failing > 0 && <span className="font-medium text-red-600">{failing} failing</span>}
										</div>
									</div>
								</button>
							);
						})}
					</div>

					<div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
						<AppPageSection
							className="lg:col-span-2"
							title={selectedFramework ? `${selectedFramework} Controls` : 'Select a framework above to view controls'}
						>
							{!selectedFramework ? (
								<AppEmptyState
									icon={FileText}
									title="No framework selected"
									description="Click a framework card to review individual control assessments."
								/>
							) : selectedPosture ? (
								<>
									<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
										<p className="text-sm text-muted-foreground">
											Control statuses are assessed from your live system: auth, logging, threat detection, and uptime.
										</p>
										<AppPrimaryButton onClick={() => exportReport(selectedFramework, selectedPosture.controls)}>
											<Download className="h-4 w-4" />
											Export
										</AppPrimaryButton>
									</div>
									<div className="space-y-3">
										{selectedPosture.controls.map((control) => (
											<AppSurface key={control.id} className="border-0 bg-background/55">
												<div className="mb-2 flex items-start justify-between gap-2">
													<div className="flex items-center gap-2">
														{getStatusIcon(control.status)}
														<span className="text-sm font-semibold">
															{control.id}: {control.name}
														</span>
													</div>
													<span className={`flex-shrink-0 whitespace-nowrap rounded-full border px-2 py-1 text-xs ${getStatusColor(control.status)}`}>
														{control.status.toUpperCase()}
													</span>
												</div>
												<p className="mb-2 text-sm text-muted-foreground">{control.description}</p>
												<p className="text-xs text-muted-foreground">
													<span className="font-medium">Evidence:</span> {control.evidence}
												</p>
											</AppSurface>
										))}
									</div>
								</>
							) : null}
						</AppPageSection>

						<AppPageSection variant="card" title="Review Schedule">
							<div className="space-y-4">
								<AppSurface className="border-0 bg-background/55">
									<div className="mb-1 flex items-center gap-2">
										<Calendar className="h-4 w-4 text-primary" />
										<span className="text-sm font-semibold">SOC 2 Type II</span>
									</div>
									<p className="text-sm text-muted-foreground">Quarterly review</p>
									<p className="mt-1 text-xs text-muted-foreground">Requires licensed CPA firm</p>
								</AppSurface>
								<AppSurface className="border-0 bg-background/55">
									<div className="mb-1 flex items-center gap-2">
										<Calendar className="h-4 w-4 text-primary" />
										<span className="text-sm font-semibold">ISO 27001</span>
									</div>
									<p className="text-sm text-muted-foreground">Annual surveillance audit</p>
									<p className="mt-1 text-xs text-muted-foreground">Certification body required</p>
								</AppSurface>
								<AppSurface className="border-0 bg-background/55">
									<div className="mb-1 flex items-center gap-2">
										<Calendar className="h-4 w-4 text-primary" />
										<span className="text-sm font-semibold">GDPR Assessment</span>
									</div>
									<p className="text-sm text-muted-foreground">Ongoing / as-changed</p>
									<p className="mt-1 text-xs text-muted-foreground">DPA review recommended quarterly</p>
								</AppSurface>
								<AppCallout variant="info">
									Control statuses above are assessed from your live system state and update automatically as your usage grows.
								</AppCallout>
							</div>
						</AppPageSection>
					</div>
				</>
			)}
		</AppPage>
	);
}

export default ComplianceReportsPage;
