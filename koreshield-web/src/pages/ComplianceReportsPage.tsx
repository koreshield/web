import { useState } from 'react';
import { FileText, Download, Calendar, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';
import { format } from 'date-fns';

interface ComplianceReport {
	id: string;
	type: 'SOC 2' | 'ISO 27001' | 'GDPR' | 'HIPAA' | 'Custom';
	status: 'compliant' | 'partial' | 'non-compliant';
	lastGenerated: string;
	nextDue: string;
	score: number;
}

interface ComplianceControl {
	id: string;
	name: string;
	status: 'pass' | 'fail' | 'warning';
	description: string;
	evidence: string;
}

const MOCK_REPORTS: ComplianceReport[] = [
	{ id: '1', type: 'SOC 2', status: 'compliant', lastGenerated: new Date(2026, 1, 5).toISOString(), nextDue: new Date(2026, 4, 5).toISOString(), score: 98 },
	{ id: '2', type: 'ISO 27001', status: 'compliant', lastGenerated: new Date(2026, 1, 1).toISOString(), nextDue: new Date(2026, 7, 1).toISOString(), score: 96 },
	{ id: '3', type: 'GDPR', status: 'partial', lastGenerated: new Date(2026, 0, 15).toISOString(), nextDue: new Date(2026, 3, 15).toISOString(), score: 87 },
	{ id: '4', type: 'HIPAA', status: 'compliant', lastGenerated: new Date(2026, 1, 10).toISOString(), nextDue: new Date(2026, 5, 10).toISOString(), score: 94 },
];

const MOCK_SOC2_CONTROLS: ComplianceControl[] = [
	{ id: 'CC1.1', name: 'Control Environment', status: 'pass', description: 'Organization demonstrates commitment to integrity and ethical values', evidence: 'Code of conduct, ethics training records' },
	{ id: 'CC2.1', name: 'Communication', status: 'pass', description: 'Security policies communicated to relevant parties', evidence: 'Policy distribution logs, acknowledgment records' },
	{ id: 'CC3.1', name: 'Risk Assessment', status: 'warning', description: 'Risk assessment process needs quarterly review', evidence: 'Risk register, assessment documentation' },
	{ id: 'CC6.1', name: 'Logical Access', status: 'pass', description: 'Access controls properly implemented', evidence: 'Access logs, permission matrices' },
	{ id: 'CC7.2', name: 'System Monitoring', status: 'pass', description: 'System activities monitored for anomalies', evidence: 'SIEM logs, alert configurations' },
];

const MOCK_ISO27001_CONTROLS: ComplianceControl[] = [
	{ id: 'A.5.1', name: 'Information Security Policies', status: 'pass', description: 'Policies for information security defined and approved', evidence: 'Policy documents, approval records' },
	{ id: 'A.6.1', name: 'Organization of Information Security', status: 'pass', description: 'Security roles and responsibilities assigned', evidence: 'Organizational chart, role definitions' },
	{ id: 'A.9.1', name: 'Access Control Policy', status: 'pass', description: 'Access control policy established', evidence: 'Access control policy, implementation records' },
	{ id: 'A.12.1', name: 'Operational Procedures', status: 'warning', description: 'Operational procedures documentation incomplete', evidence: 'Procedure documents, change logs' },
	{ id: 'A.18.1', name: 'Compliance Requirements', status: 'pass', description: 'Legal and regulatory requirements identified', evidence: 'Compliance register, legal reviews' },
];

const MOCK_GDPR_CONTROLS: ComplianceControl[] = [
	{ id: 'Art.5', name: 'Principles of Processing', status: 'pass', description: 'Personal data processed lawfully and transparently', evidence: 'Privacy notices, consent records' },
	{ id: 'Art.6', name: 'Lawfulness of Processing', status: 'pass', description: 'Legal basis for processing established', evidence: 'Data processing agreements, legal basis documentation' },
	{ id: 'Art.25', name: 'Data Protection by Design', status: 'warning', description: 'Privacy impact assessments need updates', evidence: 'DPIA documents, design specifications' },
	{ id: 'Art.30', name: 'Records of Processing', status: 'pass', description: 'Processing activities documented', evidence: 'Record of processing activities (ROPA)' },
	{ id: 'Art.32', name: 'Security of Processing', status: 'pass', description: 'Appropriate security measures implemented', evidence: 'Security controls, encryption policies' },
];

export function ComplianceReportsPage() {
	const [selectedReport, setSelectedReport] = useState<ComplianceReport | null>(null);
	const [selectedTemplate, setSelectedTemplate] = useState<'SOC 2' | 'ISO 27001' | 'GDPR' | null>(null);

	const getStatusColor = (status: string) => {
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
				return 'text-gray-600 bg-gray-500/10 border-gray-500/50';
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'compliant':
			case 'pass':
				return <CheckCircle className="w-5 h-5 text-green-600" />;
			case 'partial':
			case 'warning':
				return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
			case 'non-compliant':
			case 'fail':
				return <AlertTriangle className="w-5 h-5 text-red-600" />;
			default:
				return <Clock className="w-5 h-5 text-gray-600" />;
		}
	};

	const generateReport = (type: string) => {
		const csvContent = `Compliance Report - ${type}\nGenerated: ${format(new Date(), 'PPpp')}\n\n`;
		const blob = new Blob([csvContent], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `compliance-${type.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const getControlsForTemplate = (template: string) => {
		switch (template) {
			case 'SOC 2': return MOCK_SOC2_CONTROLS;
			case 'ISO 27001': return MOCK_ISO27001_CONTROLS;
			case 'GDPR': return MOCK_GDPR_CONTROLS;
			default: return [];
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<SEOMeta
				title="Compliance Reports | KoreShield"
				description="Automated compliance reporting for SOC 2, ISO 27001, GDPR, and more"
			/>

			<header className="border-b border-border bg-card">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold flex items-center gap-3">
								<FileText className="w-8 h-8 text-primary" />
								Compliance Reports
							</h1>
							<p className="text-muted-foreground mt-1">
								Automated compliance reporting and audit trails
							</p>
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					{MOCK_REPORTS.map((report) => (
						<div
							key={report.id}
							className="bg-card border border-border rounded-lg p-6 cursor-pointer hover:border-primary transition-colors"
							onClick={() => setSelectedReport(report)}
						>
							<div className="flex items-center justify-between mb-4">
								<span className="font-semibold">{report.type}</span>
								{getStatusIcon(report.status)}
							</div>
							<div className="space-y-2">
								<div className={`text-xs px-2 py-1 rounded-full border inline-block ${getStatusColor(report.status)}`}>
									{report.status.toUpperCase()}
								</div>
								<div className="text-2xl font-bold">{report.score}%</div>
								<p className="text-xs text-muted-foreground">
									Next due: {format(new Date(report.nextDue), 'MMM dd, yyyy')}
								</p>
							</div>
						</div>
					))}
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
					<div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
						<h2 className="text-xl font-semibold mb-4">Compliance Templates</h2>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
							{(['SOC 2', 'ISO 27001', 'GDPR'] as const).map((template) => (
								<button
									key={template}
									onClick={() => setSelectedTemplate(template)}
									className={`p-4 rounded-lg border-2 transition-colors ${selectedTemplate === template
											? 'border-primary bg-primary/10'
											: 'border-border hover:border-primary/50'
										}`}
								>
									<FileText className="w-8 h-8 mx-auto mb-2" />
									<div className="font-semibold">{template}</div>
								</button>
							))}
						</div>

						{selectedTemplate && (
							<div className="space-y-3">
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-lg font-semibold">{selectedTemplate} Controls</h3>
									<button
										onClick={() => generateReport(selectedTemplate)}
										className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm"
									>
										<Download className="w-4 h-4" />
										Export Report
									</button>
								</div>
								{getControlsForTemplate(selectedTemplate).map((control) => (
									<div key={control.id} className="p-4 bg-muted/50 rounded-lg">
										<div className="flex items-start justify-between mb-2">
											<div className="flex items-center gap-2">
												{getStatusIcon(control.status)}
												<span className="font-semibold">{control.id} - {control.name}</span>
											</div>
											<span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(control.status)}`}>
												{control.status.toUpperCase()}
											</span>
										</div>
										<p className="text-sm text-muted-foreground mb-2">{control.description}</p>
										<p className="text-xs text-muted-foreground">Evidence: {control.evidence}</p>
									</div>
								))}
							</div>
						)}
					</div>

					<div className="bg-card border border-border rounded-lg p-6">
						<h2 className="text-xl font-semibold mb-4">Report Schedule</h2>
						<div className="space-y-4">
							<div className="p-4 bg-muted/50 rounded-lg">
								<div className="flex items-center gap-2 mb-2">
									<Calendar className="w-4 h-4 text-primary" />
									<span className="font-semibold">SOC 2 Type II</span>
								</div>
								<p className="text-sm text-muted-foreground">Quarterly</p>
								<p className="text-xs text-muted-foreground mt-1">Next: May 5, 2026</p>
							</div>

							<div className="p-4 bg-muted/50 rounded-lg">
								<div className="flex items-center gap-2 mb-2">
									<Calendar className="w-4 h-4 text-primary" />
									<span className="font-semibold">ISO 27001</span>
								</div>
								<p className="text-sm text-muted-foreground">Annual</p>
								<p className="text-xs text-muted-foreground mt-1">Next: Aug 1, 2026</p>
							</div>

							<div className="p-4 bg-muted/50 rounded-lg">
								<div className="flex items-center gap-2 mb-2">
									<Calendar className="w-4 h-4 text-primary" />
									<span className="font-semibold">GDPR Audit</span>
								</div>
								<p className="text-sm text-muted-foreground">Quarterly</p>
								<p className="text-xs text-muted-foreground mt-1">Next: Apr 15, 2026</p>
							</div>

							<div className="p-4 bg-muted/50 rounded-lg">
								<div className="flex items-center gap-2 mb-2">
									<Calendar className="w-4 h-4 text-primary" />
									<span className="font-semibold">HIPAA Review</span>
								</div>
								<p className="text-sm text-muted-foreground">Bi-annual</p>
								<p className="text-xs text-muted-foreground mt-1">Next: Jun 10, 2026</p>
							</div>
						</div>
					</div>
				</div>

				{selectedReport && (
					<div
						className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
						onClick={() => setSelectedReport(null)}
					>
						<div
							className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
							onClick={(e) => e.stopPropagation()}
						>
							<h3 className="text-2xl font-bold mb-4">{selectedReport.type} Report Details</h3>
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<span className="text-sm text-muted-foreground">Status</span>
										<div className={`mt-1 text-sm px-3 py-1 rounded-full border inline-block ${getStatusColor(selectedReport.status)}`}>
											{selectedReport.status.toUpperCase()}
										</div>
									</div>
									<div>
										<span className="text-sm text-muted-foreground">Compliance Score</span>
										<p className="text-2xl font-bold mt-1">{selectedReport.score}%</p>
									</div>
								</div>
								<div>
									<span className="text-sm text-muted-foreground">Last Generated</span>
									<p className="font-medium">{format(new Date(selectedReport.lastGenerated), 'PPpp')}</p>
								</div>
								<div>
									<span className="text-sm text-muted-foreground">Next Due</span>
									<p className="font-medium">{format(new Date(selectedReport.nextDue), 'PPpp')}</p>
								</div>
								<div className="flex gap-3 mt-6">
									<button
										onClick={() => generateReport(selectedReport.type)}
										className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
									>
										<Download className="w-4 h-4" />
										Download CSV
									</button>
									<button
										onClick={() => setSelectedReport(null)}
										className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
									>
										Close
									</button>
								</div>
							</div>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}

export default ComplianceReportsPage;
