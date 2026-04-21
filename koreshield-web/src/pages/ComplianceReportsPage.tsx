import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Calendar, CheckCircle, AlertTriangle, Clock, Loader2, XCircle, Shield } from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';
import { api } from '../lib/api-client';
import { format } from 'date-fns';

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
			`KoreShield Compliance Report: ${framework}`,
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
		<div>
			<SEOMeta
				title="Compliance Reports | KoreShield"
				description="Real-time compliance posture assessment for SOC 2, ISO 27001, and GDPR"
			/>

			<header className="border-b border-border bg-card">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
					<div className="flex items-center gap-2 sm:gap-3">
						<div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
							<Shield className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
						</div>
						<div>
							<h1 className="text-lg sm:text-2xl font-bold">Compliance Reports</h1>
							<p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">
								Real-time compliance posture assessed from your live system state
							</p>
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{isLoading ? (
					<div className="flex items-center justify-center py-24">
						<Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
					</div>
				) : error ? (
					<div className="text-center py-24 text-muted-foreground">
						<AlertTriangle className="w-10 h-10 mx-auto mb-3 text-destructive" />
						<p>Failed to load compliance data. Please try again.</p>
					</div>
				) : (
					<>
						{/* Framework summary cards */}
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
							{postures.map(p => {
								const status = scoreToStatus(p.score);
								const passing = p.controls.filter(c => c.status === 'pass').length;
								const warning = p.controls.filter(c => c.status === 'warning').length;
								const failing = p.controls.filter(c => c.status === 'fail').length;
								return (
									<button
										key={p.framework}
										onClick={() => setSelectedFramework(
											selectedFramework === p.framework ? null : p.framework
										)}
										className={`bg-card border rounded-lg p-6 text-left transition-colors cursor-pointer ${
											selectedFramework === p.framework
												? 'border-primary ring-2 ring-primary/20'
												: 'border-border hover:border-primary/50'
										}`}
									>
										<div className="flex items-center justify-between mb-4">
											<span className="font-semibold text-base">{p.framework}</span>
											{getStatusIcon(status)}
										</div>
										<div className="space-y-2">
											<div className={`text-xs px-2 py-1 rounded-full border inline-block ${getStatusColor(status)}`}>
												{status.toUpperCase()}
											</div>
											<div className="text-3xl font-bold mt-1">{p.score}%</div>
											<div className="flex gap-3 text-xs text-muted-foreground mt-2">
												<span className="text-green-600 font-medium">{passing} passing</span>
												{warning > 0 && <span className="text-yellow-600 font-medium">{warning} warning</span>}
												{failing > 0 && <span className="text-red-600 font-medium">{failing} failing</span>}
											</div>
										</div>
									</button>
								);
							})}
						</div>

						{/* Control detail panel */}
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
							<div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
								<h2 className="text-xl font-semibold mb-4">
									{selectedFramework ? `${selectedFramework} Controls` : 'Select a framework above to view controls'}
								</h2>

								{!selectedFramework ? (
									<div className="text-center py-16 text-muted-foreground text-sm">
										<FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
										<p>Click a framework card to review individual control assessments.</p>
									</div>
								) : selectedPosture ? (
									<>
										<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
											<p className="text-sm text-muted-foreground">
												Control statuses are assessed from your live system: auth, logging, threat detection, and uptime.
											</p>
											<button
												onClick={() => exportReport(selectedFramework, selectedPosture.controls)}
												className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm whitespace-nowrap"
											>
												<Download className="w-4 h-4" />
												Export
											</button>
										</div>
										<div className="space-y-3">
											{selectedPosture.controls.map(control => (
												<div key={control.id} className="p-4 bg-muted/50 rounded-lg">
													<div className="flex items-start justify-between mb-2 gap-2">
														<div className="flex items-center gap-2">
															{getStatusIcon(control.status)}
															<span className="font-semibold text-sm">
																{control.id}: {control.name}
															</span>
														</div>
														<span className={`text-xs px-2 py-1 rounded-full border whitespace-nowrap flex-shrink-0 ${getStatusColor(control.status)}`}>
															{control.status.toUpperCase()}
														</span>
													</div>
													<p className="text-sm text-muted-foreground mb-2">{control.description}</p>
													<p className="text-xs text-muted-foreground">
														<span className="font-medium">Evidence:</span> {control.evidence}
													</p>
												</div>
											))}
										</div>
									</>
								) : null}
							</div>

							<div className="bg-card border border-border rounded-lg p-6">
								<h2 className="text-xl font-semibold mb-4">Review Schedule</h2>
								<div className="space-y-4">
									<div className="p-4 bg-muted/50 rounded-lg">
										<div className="flex items-center gap-2 mb-1">
											<Calendar className="w-4 h-4 text-primary" />
											<span className="font-semibold text-sm">SOC 2 Type II</span>
										</div>
										<p className="text-sm text-muted-foreground">Quarterly review</p>
										<p className="text-xs text-muted-foreground mt-1">Requires licensed CPA firm</p>
									</div>
									<div className="p-4 bg-muted/50 rounded-lg">
										<div className="flex items-center gap-2 mb-1">
											<Calendar className="w-4 h-4 text-primary" />
											<span className="font-semibold text-sm">ISO 27001</span>
										</div>
										<p className="text-sm text-muted-foreground">Annual surveillance audit</p>
										<p className="text-xs text-muted-foreground mt-1">Certification body required</p>
									</div>
									<div className="p-4 bg-muted/50 rounded-lg">
										<div className="flex items-center gap-2 mb-1">
											<Calendar className="w-4 h-4 text-primary" />
											<span className="font-semibold text-sm">GDPR Assessment</span>
										</div>
										<p className="text-sm text-muted-foreground">Ongoing / as-changed</p>
										<p className="text-xs text-muted-foreground mt-1">DPA review recommended quarterly</p>
									</div>
									<div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-700 dark:text-blue-400">
										Control statuses above are assessed from your live system state and update automatically as your usage grows.
									</div>
								</div>
							</div>
						</div>
					</>
				)}
			</main>
		</div>
	);
}

export default ComplianceReportsPage;
