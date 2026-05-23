import { useMemo, useState } from 'react';
import { FileText, Calendar, Download, Plus, Clock, Play, Trash2, Pencil } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api-client';
import { useToast } from '../components/ToastNotification';
import {
	AppPage,
	AppPageHeader,
	AppPageSection,
	AppEmptyState,
	AppPrimaryButton,
	AppSecondaryButton,
	AppSurface,
	AppPageError,
	AppPageLoading,
} from '../components/AppPageLayout';

interface Report {
	id: string;
	name: string;
	description: string;
	template: string;
	schedule: 'manual' | 'daily' | 'weekly' | 'monthly';
	format: 'pdf' | 'csv' | 'json';
	created_at: string;
	last_run: string;
	status: 'ready' | 'running' | 'completed' | 'failed';
	filters: ReportFilters;
}

interface ReportFilters {
	date_range: 'today' | '7d' | '30d' | '90d' | 'custom';
	start_date?: string;
	end_date?: string;
	providers?: string[];
	tenants?: string[];
	metrics?: string[];
}

interface ReportTemplate {
	id: string;
	name: string;
	description: string;
	category: string;
	available_metrics: string[];
}

function getErrorMessage(error: unknown, fallback: string) {
	if (error instanceof Error && error.message) {
		return error.message;
	}
	return fallback;
}

function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

export function ReportsPage() {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<'reports' | 'builder' | 'scheduled'>('reports');
	const [showBuilderModal, setShowBuilderModal] = useState(false);
	const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
	const [editingReport, setEditingReport] = useState<Report | null>(null);
	const [reportConfig, setReportConfig] = useState<Partial<Report>>({
		name: '',
		description: '',
		schedule: 'manual',
		format: 'pdf',
		filters: {
			date_range: '30d',
			providers: [],
			tenants: [],
			metrics: [],
		},
	});
	const queryClient = useQueryClient();
	const { success, error } = useToast();

	const { data: reportsData = [], isLoading: reportsLoading, error: reportsError, refetch: refetchReports } = useQuery({
		queryKey: ['reports'],
		queryFn: async () => api.getReports(),
	});
	const reports = reportsData as Report[];

	const { data: templatesData = [], isLoading: templatesLoading, error: templatesError, refetch: refetchTemplates } = useQuery({
		queryKey: ['report-templates'],
		queryFn: async () => api.getReportTemplates(),
	});
	const templates = templatesData as ReportTemplate[];

	const generateReportMutation = useMutation({
		mutationFn: async (reportId: string) => api.generateReport(reportId),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['reports'] });
			success('Report generation queued');
		},
		onError: (mutationError: unknown) => {
			error(getErrorMessage(mutationError, 'Failed to run report'));
		},
	});

	const createOrUpdateReportMutation = useMutation({
		mutationFn: async (report: Partial<Report>) => {
			if (editingReport) {
				return api.updateReport(editingReport.id, report);
			}
			return api.createReport(report);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['reports'] });
			setShowBuilderModal(false);
			setSelectedTemplate(null);
			setEditingReport(null);
			setReportConfig({
				name: '',
				description: '',
				schedule: 'manual',
				format: 'pdf',
				filters: { date_range: '30d', providers: [], tenants: [], metrics: [] },
			});
			success(editingReport ? 'Report updated successfully' : 'Report created successfully');
		},
		onError: (mutationError: unknown) => {
			error(getErrorMessage(mutationError, editingReport ? 'Failed to update report' : 'Failed to create report'));
		},
	});

	const deleteReportMutation = useMutation({
		mutationFn: async (reportId: string) => api.deleteReport(reportId),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['reports'] });
			success('Report deleted');
		},
		onError: (mutationError: unknown) => {
			error(getErrorMessage(mutationError, 'Failed to delete report'));
		},
	});

	const downloadReportMutation = useMutation({
		mutationFn: async (reportId: string) => api.downloadReport(reportId),
		onSuccess: (download) => {
			downloadBlob(download.blob, download.filename);
			success('Report download started');
		},
		onError: (mutationError: unknown) => {
			error(getErrorMessage(mutationError, 'Failed to download report'));
		},
	});

	const scheduledReports = useMemo(
		() => reports.filter((report) => report.schedule !== 'manual'),
		[reports],
	);

	const resetBuilder = () => {
		setShowBuilderModal(false);
		setSelectedTemplate(null);
		setEditingReport(null);
		setReportConfig({
			name: '',
			description: '',
			schedule: 'manual',
			format: 'pdf',
			filters: { date_range: '30d', providers: [], tenants: [], metrics: [] },
		});
	};

	const openCreateModal = (template?: ReportTemplate) => {
		setEditingReport(null);
		setSelectedTemplate(template ?? null);
		setReportConfig({
			name: '',
			description: '',
			template: template?.name ?? '',
			schedule: 'manual',
			format: 'pdf',
			filters: { date_range: '30d', providers: [], tenants: [], metrics: [] },
		});
		setShowBuilderModal(true);
	};

	const openEditModal = (report: Report) => {
		setEditingReport(report);
		setSelectedTemplate(templates.find((template) => template.name === report.template) ?? null);
		setReportConfig({
			name: report.name,
			description: report.description,
			template: report.template,
			schedule: report.schedule,
			format: report.format,
			filters: report.filters,
		});
		setShowBuilderModal(true);
	};

	const reportsApiError = reportsError as (Error & { code?: number }) | null;
	const templatesApiError = templatesError as (Error & { code?: number }) | null;
	const reportsAccessDenied = reportsApiError?.code === 403 || templatesApiError?.code === 403;
	const reportsLoadError = !reportsAccessDenied && (reportsApiError || templatesApiError);

	const reportTabs = [
		{ id: 'reports' as const, label: 'All Reports' },
		{ id: 'builder' as const, label: 'Templates' },
		{ id: 'scheduled' as const, label: `Scheduled (${scheduledReports.length})` },
	];

	return (
		<AppPage>
			<AppPageHeader
				eyebrow="Reporting"
				eyebrowIcon={FileText}
				title="Reports"
				description="Generate, edit, schedule, and download customer-facing reports"
				icon={FileText}
				tabs={reportTabs}
				activeTab={activeTab}
				onTabChange={(id) => setActiveTab(id as typeof activeTab)}
				actions={
					<AppPrimaryButton onClick={() => openCreateModal()} className="w-full sm:w-auto">
						<Plus className="h-4 w-4" />
						<span className="hidden sm:inline">Create Report</span>
						<span className="sm:hidden">New Report</span>
					</AppPrimaryButton>
				}
			/>

			{reportsAccessDenied && (
				<AppEmptyState
					icon={FileText}
					title="Reports require an admin seat"
					description="Your account is signed in correctly, but this workspace only allows admin users to generate and schedule platform reports. Continue onboarding with teams, API keys, rules, alerts, and RAG scans first, or ask an admin to upgrade your role."
					action={
						<div className="flex flex-wrap items-center justify-center gap-3">
							<AppPrimaryButton onClick={() => navigate('/getting-started')}>
								Continue onboarding
							</AppPrimaryButton>
							<AppSecondaryButton onClick={() => navigate('/dashboard')}>
								Back to dashboard
							</AppSecondaryButton>
						</div>
					}
				/>
			)}

			{reportsLoadError && (
				<AppPageError
					title="Reports are not loading right now"
					message={reportsApiError?.message || templatesApiError?.message || 'Something went wrong while loading reports.'}
					onRetry={() => {
						void refetchReports();
						void refetchTemplates();
					}}
				/>
			)}

			{!reportsAccessDenied && !reportsLoadError && (
				<>
					{activeTab === 'reports' && (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{reportsLoading ? (
								<div className="col-span-full">
									<AppPageLoading label="Loading reports…" />
								</div>
							) : reports.length === 0 ? (
								<div className="col-span-full">
									<AppEmptyState
										icon={FileText}
										title="No reports created yet"
										description='Click "Create Report" to get started.'
										action={
											<AppPrimaryButton onClick={() => openCreateModal()}>
												<Plus className="h-4 w-4" />
												Create Report
											</AppPrimaryButton>
										}
									/>
								</div>
							) : (
								reports.map((report) => (
									<AppSurface key={report.id}>
										<div className="mb-3 flex items-start justify-between gap-3">
											<div className="flex-1">
												<h3 className="mb-1 text-lg font-semibold">{report.name}</h3>
												<p className="text-sm text-muted-foreground">{report.description}</p>
											</div>
											<span className={`rounded px-2 py-1 text-xs ${report.status === 'ready'
												? 'bg-blue-500/10 text-blue-600'
												: report.status === 'running'
													? 'bg-yellow-500/10 text-yellow-600'
													: report.status === 'completed'
														? 'bg-green-500/10 text-green-600'
														: 'bg-red-500/10 text-red-600'
											}`}>
												{report.status}
											</span>
										</div>

										<div className="mb-4 space-y-2 text-sm text-muted-foreground">
											<div className="flex items-center gap-2">
												<FileText className="h-4 w-4" />
												Template: {report.template}
											</div>
											<div className="flex items-center gap-2">
												<Calendar className="h-4 w-4" />
												Schedule: {report.schedule}
											</div>
											<div className="flex items-center gap-2">
												<Clock className="h-4 w-4" />
												Last run: {report.last_run}
											</div>
										</div>

										<div className="flex flex-wrap gap-2">
											<AppPrimaryButton
												onClick={() => generateReportMutation.mutate(report.id)}
												disabled={report.status === 'running'}
												className="min-w-[100px] flex-1"
											>
												<Play className="h-4 w-4" />
												Run
											</AppPrimaryButton>
											<AppSecondaryButton onClick={() => openEditModal(report)} aria-label={`Edit ${report.name}`}>
												<Pencil className="h-4 w-4" />
											</AppSecondaryButton>
											<AppSecondaryButton
												onClick={() => downloadReportMutation.mutate(report.id)}
												disabled={report.status !== 'completed' || downloadReportMutation.isPending}
												aria-label={`Download ${report.name}`}
											>
												<Download className="h-4 w-4" />
											</AppSecondaryButton>
											<AppSecondaryButton
												onClick={() => {
													if (confirm('Delete this report?')) {
														deleteReportMutation.mutate(report.id);
													}
												}}
												aria-label={`Delete ${report.name}`}
												className="hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-600"
											>
												<Trash2 className="h-4 w-4" />
											</AppSecondaryButton>
										</div>
									</AppSurface>
								))
							)}
						</div>
					)}

					{activeTab === 'builder' && (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{templatesLoading ? (
								<div className="col-span-full">
									<AppPageLoading label="Loading templates…" />
								</div>
							) : (
								templates.map((template) => (
									<div key={template.id} onClick={() => openCreateModal(template)} className="cursor-pointer">
										<AppSurface className="transition-colors hover:border-primary/50">
										<div className="mb-4 flex items-start gap-3">
											<div className="rounded-xl border border-border bg-background/60 p-2">
												<FileText className="h-5 w-5 text-primary" />
											</div>
											<div className="flex-1">
												<h3 className="mb-1 font-semibold">{template.name}</h3>
												<p className="text-sm text-muted-foreground">{template.description}</p>
											</div>
										</div>
										<div className="mb-3">
											<div className="mb-2 text-xs font-medium text-muted-foreground">
												Category: {template.category}
											</div>
											<div className="text-xs text-muted-foreground">
												{template.available_metrics.length} available metrics
											</div>
										</div>
										<AppPrimaryButton className="w-full bg-primary/10 text-primary hover:bg-primary/20">
											<Plus className="h-4 w-4" />
											Use Template
										</AppPrimaryButton>
										</AppSurface>
									</div>
								))
							)}
						</div>
					)}

					{activeTab === 'scheduled' && (
						<AppPageSection className="overflow-hidden p-0">
							<div className="overflow-x-auto p-6 pt-0">
								<table className="w-full">
									<thead className="border-b border-border bg-muted/50">
										<tr>
											<th className="px-4 py-3 text-left font-medium">Report Name</th>
											<th className="px-4 py-3 text-left font-medium">Schedule</th>
											<th className="px-4 py-3 text-left font-medium">Last Run</th>
											<th className="px-4 py-3 text-left font-medium">Last Status</th>
											<th className="px-4 py-3 text-left font-medium">Actions</th>
										</tr>
									</thead>
									<tbody>
										{scheduledReports.length === 0 ? (
											<tr>
												<td colSpan={5} className="py-8 text-center text-muted-foreground">
													No scheduled reports. Create a report with a schedule to see it here.
												</td>
											</tr>
										) : (
											scheduledReports.map((report) => (
												<tr key={report.id} className="border-b border-border transition-colors hover:bg-muted/50">
													<td className="px-4 py-3">
														<div className="font-medium">{report.name}</div>
														<div className="text-sm text-muted-foreground">{report.template}</div>
													</td>
													<td className="px-4 py-3">
														<span className="rounded bg-primary/10 px-2 py-1 text-sm text-primary">
															{report.schedule}
														</span>
													</td>
													<td className="px-4 py-3 text-sm text-muted-foreground">{report.last_run}</td>
													<td className="px-4 py-3">
														<span className={`rounded px-2 py-1 text-sm ${report.status === 'completed'
															? 'bg-green-500/10 text-green-600'
															: report.status === 'failed'
																? 'bg-red-500/10 text-red-600'
																: 'bg-blue-500/10 text-blue-600'
														}`}>
															{report.status}
														</span>
													</td>
													<td className="px-4 py-3">
														<div className="flex gap-2">
															<button onClick={() => generateReportMutation.mutate(report.id)} className="rounded p-1 transition-colors hover:bg-muted">
																<Play className="h-4 w-4 text-primary" />
															</button>
															<button
																onClick={() => downloadReportMutation.mutate(report.id)}
																disabled={report.status !== 'completed'}
																aria-label={`Download ${report.name}`}
																className="rounded p-1 transition-colors hover:bg-muted disabled:opacity-50"
															>
																<Download className="h-4 w-4 text-primary" />
															</button>
															<button
																onClick={() => {
																	if (confirm('Delete this scheduled report?')) {
																		deleteReportMutation.mutate(report.id);
																	}
																}}
																aria-label={`Delete ${report.name}`}
																className="rounded p-1 transition-colors hover:bg-muted"
															>
																<Trash2 className="h-4 w-4 text-red-600" />
															</button>
														</div>
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						</AppPageSection>
					)}
				</>
			)}

			{showBuilderModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-card border border-border rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
						<h2 className="text-xl font-bold mb-6">
							{editingReport ? `Edit Report: ${editingReport.name}` : selectedTemplate ? `Create Report: ${selectedTemplate.name}` : 'Create Custom Report'}
						</h2>

						<div className="space-y-6">
							<div>
								<label className="block text-sm font-medium mb-2">Report Name *</label>
								<input
									type="text"
									value={reportConfig.name}
									onChange={(event) => setReportConfig({ ...reportConfig, name: event.target.value })}
									placeholder="e.g., Monthly Security Summary"
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-2">Description</label>
								<textarea
									rows={3}
									value={reportConfig.description}
									onChange={(event) => setReportConfig({ ...reportConfig, description: event.target.value })}
									placeholder="Describe what this report covers..."
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-2">Template</label>
								<select
									value={reportConfig.template}
									onChange={(event) => setReportConfig({ ...reportConfig, template: event.target.value })}
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								>
									<option value="">Select template</option>
									{templates.map((template) => (
										<option key={template.id} value={template.name}>{template.name}</option>
									))}
								</select>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium mb-2">Schedule</label>
									<select
										value={reportConfig.schedule}
										onChange={(event) => setReportConfig({ ...reportConfig, schedule: event.target.value as Report['schedule'] })}
										className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
									>
										<option value="manual">Manual</option>
										<option value="daily">Daily</option>
										<option value="weekly">Weekly</option>
										<option value="monthly">Monthly</option>
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium mb-2">Format</label>
									<select
										value={reportConfig.format}
										onChange={(event) => setReportConfig({ ...reportConfig, format: event.target.value as Report['format'] })}
										className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
									>
										<option value="pdf">PDF</option>
										<option value="csv">CSV</option>
										<option value="json">JSON</option>
									</select>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium mb-2">Date Range</label>
								<select
									value={reportConfig.filters?.date_range}
									onChange={(event) =>
										setReportConfig({
											...reportConfig,
											filters: {
												...reportConfig.filters!,
												date_range: event.target.value as ReportFilters['date_range'],
											},
										})
									}
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								>
									<option value="today">Today</option>
									<option value="7d">Last 7 Days</option>
									<option value="30d">Last 30 Days</option>
									<option value="90d">Last 90 Days</option>
									<option value="custom">Custom Range</option>
								</select>
							</div>

							{selectedTemplate && (
								<div>
									<label className="block text-sm font-medium mb-2">
										Available Metrics ({selectedTemplate.available_metrics.length})
									</label>
									<div className="border border-border rounded-lg p-4 max-h-40 overflow-y-auto space-y-2">
										{selectedTemplate.available_metrics.map((metric) => (
											<label key={metric} className="flex items-center gap-2">
												<input
													type="checkbox"
													checked={reportConfig.filters?.metrics?.includes(metric) ?? false}
													onChange={(event) => {
														const metrics = new Set(reportConfig.filters?.metrics ?? []);
														if (event.target.checked) {
															metrics.add(metric);
														} else {
															metrics.delete(metric);
														}
														setReportConfig({
															...reportConfig,
															filters: {
																...reportConfig.filters!,
																metrics: [...metrics],
															},
														});
													}}
													className="rounded border-border"
												/>
												<span className="text-sm">{metric}</span>
											</label>
										))}
									</div>
								</div>
							)}

							<div className="flex gap-3 border-t border-border pt-4">
								<AppSecondaryButton onClick={resetBuilder} className="flex-1">
									Cancel
								</AppSecondaryButton>
								<AppPrimaryButton
									onClick={() => createOrUpdateReportMutation.mutate(reportConfig)}
									disabled={!reportConfig.name || !reportConfig.template}
									className="flex-1"
								>
									{editingReport ? 'Save changes' : 'Create Report'}
								</AppPrimaryButton>
							</div>
						</div>
					</div>
				</div>
			)}
		</AppPage>
	);
}
