import { useState } from 'react';
import { FileText, Calendar, Download, Plus, Clock, Play, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api-client';


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

export function ReportsPage() {
    const [activeTab, setActiveTab] = useState<'reports' | 'builder' | 'scheduled'>('reports');
    const [showBuilderModal, setShowBuilderModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
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

    // Fetch reports
    const { data: reportsData = [], isLoading: reportsLoading } = useQuery({
        queryKey: ['reports'],
        queryFn: async () => {
            return api.getReports();
        },
    });
    const reports = reportsData as Report[];

    // Fetch report templates
    const { data: templatesData = [], isLoading: templatesLoading } = useQuery({
        queryKey: ['report-templates'],
        queryFn: async () => {
            return api.getReportTemplates();
        },
    });
    const templates = templatesData as ReportTemplate[];

    // Generate report mutation
    const generateReportMutation = useMutation({
        mutationFn: async (reportId: string) => {
            return api.generateReport(reportId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
        },
    });

    // Create report mutation
    const createReportMutation = useMutation({
        mutationFn: async (report: Partial<Report>) => {
            return api.createReport(report);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
            setShowBuilderModal(false);
            setReportConfig({
                name: '',
                description: '',
                schedule: 'manual',
                format: 'pdf',
                filters: { date_range: '30d', providers: [], tenants: [], metrics: [] },
            });
        },
    });

    // Delete report mutation
    const deleteReportMutation = useMutation({
        mutationFn: async (reportId: string) => {
            return api.deleteReport(reportId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
        },
    });

    const scheduledReports = reports.filter((r) => r.schedule !== 'manual');

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-2xl font-bold">Reports</h1>
                                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                                    Generate and schedule custom reports
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowBuilderModal(true)}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm w-full sm:w-auto justify-center"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Create Report</span>
                            <span className="sm:hidden">New Report</span>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 sm:gap-4 mt-4 sm:mt-6 border-b border-border overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={`pb-3 px-2 font-medium transition-colors relative whitespace-nowrap text-sm sm:text-base ${activeTab === 'reports'
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <div className="flex items-center gap-1 sm:gap-2">
                                <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                                All Reports
                            </div>
                            {activeTab === 'reports' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('builder')}
                            className={`pb-3 px-2 font-medium transition-colors relative ${activeTab === 'builder'
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Templates
                            </div>
                            {activeTab === 'builder' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('scheduled')}
                            className={`pb-3 px-2 font-medium transition-colors relative ${activeTab === 'scheduled'
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Scheduled ({scheduledReports.length})
                            </div>
                            {activeTab === 'scheduled' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* All Reports Tab */}
                {activeTab === 'reports' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reportsLoading ? (
                            <div className="col-span-full flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-muted-foreground">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No reports created yet. Click "Create Report" to get started.</p>
                            </div>
                        ) : (
                            reports.map((report) => (
                                <div key={report.id} className="bg-card border border-border rounded-lg p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold mb-1">{report.name}</h3>
                                            <p className="text-sm text-muted-foreground">{report.description}</p>
                                        </div>
                                        <span
                                            className={`px-2 py-1 rounded text-xs ${report.status === 'ready'
                                                ? 'bg-blue-500/10 text-blue-600'
                                                : report.status === 'running'
                                                    ? 'bg-yellow-500/10 text-yellow-600'
                                                    : report.status === 'completed'
                                                        ? 'bg-green-500/10 text-green-600'
                                                        : 'bg-red-500/10 text-red-600'
                                                }`}
                                        >
                                            {report.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            Template: {report.template}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Schedule: {report.schedule}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            Last run: {report.last_run}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => generateReportMutation.mutate(report.id)}
                                            disabled={report.status === 'running'}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Play className="w-4 h-4" />
                                            Run
                                        </button>
                                        <button
                                            disabled={report.status !== 'completed'}
                                            className="flex items-center justify-center gap-2 px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Delete this report?')) {
                                                    deleteReportMutation.mutate(report.id);
                                                }
                                            }}
                                            className="flex items-center justify-center gap-2 px-3 py-2 bg-muted rounded-lg hover:bg-red-500/10 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Templates Tab */}
                {activeTab === 'builder' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templatesLoading ? (
                            <div className="col-span-full flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            templates.map((template) => (
                                <div
                                    key={template.id}
                                    className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer"
                                    onClick={() => {
                                        setSelectedTemplate(template);
                                        setReportConfig({
                                            ...reportConfig,
                                            template: template.name,
                                        });
                                        setShowBuilderModal(true);
                                    }}
                                >
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <FileText className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-1">{template.name}</h3>
                                            <p className="text-sm text-muted-foreground">{template.description}</p>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <div className="text-xs font-medium text-muted-foreground mb-2">
                                            Category: {template.category}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {template.available_metrics.length} available metrics
                                        </div>
                                    </div>

                                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
                                        <Plus className="w-4 h-4" />
                                        Use Template
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Scheduled Reports Tab */}
                {activeTab === 'scheduled' && (
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-medium">Report Name</th>
                                        <th className="text-left py-3 px-4 font-medium">Schedule</th>
                                        <th className="text-left py-3 px-4 font-medium">Next Run</th>
                                        <th className="text-left py-3 px-4 font-medium">Last Status</th>
                                        <th className="text-left py-3 px-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scheduledReports.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No scheduled reports. Create a report with a schedule to see it here.
                                            </td>
                                        </tr>
                                    ) : (
                                        scheduledReports.map((report) => (
                                            <tr
                                                key={report.id}
                                                className="border-b border-border hover:bg-muted/50 transition-colors"
                                            >
                                                <td className="py-3 px-4">
                                                    <div className="font-medium">{report.name}</div>
                                                    <div className="text-sm text-muted-foreground">{report.template}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                                                        {report.schedule}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-muted-foreground">Tomorrow 9:00 AM</td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`px-2 py-1 rounded text-sm ${report.status === 'completed'
                                                            ? 'bg-green-500/10 text-green-600'
                                                            : report.status === 'failed'
                                                                ? 'bg-red-500/10 text-red-600'
                                                                : 'bg-blue-500/10 text-blue-600'
                                                            }`}
                                                    >
                                                        {report.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex gap-2">
                                                        <button className="p-1 hover:bg-muted rounded transition-colors">
                                                            <Play className="w-4 h-4 text-primary" />
                                                        </button>
                                                        <button className="p-1 hover:bg-muted rounded transition-colors">
                                                            <Download className="w-4 h-4 text-primary" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (confirm('Delete this scheduled report?')) {
                                                                    deleteReportMutation.mutate(report.id);
                                                                }
                                                            }}
                                                            className="p-1 hover:bg-muted rounded transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-600" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Report Builder Modal */}
            {showBuilderModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-6">
                            {selectedTemplate ? `Create Report: ${selectedTemplate.name}` : 'Create Custom Report'}
                        </h2>

                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Report Name *</label>
                                <input
                                    type="text"
                                    value={reportConfig.name}
                                    onChange={(e) => setReportConfig({ ...reportConfig, name: e.target.value })}
                                    placeholder="e.g., Monthly Security Summary"
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    rows={3}
                                    value={reportConfig.description}
                                    onChange={(e) => setReportConfig({ ...reportConfig, description: e.target.value })}
                                    placeholder="Describe what this report covers..."
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            {/* Schedule & Format */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Schedule</label>
                                    <select
                                        value={reportConfig.schedule}
                                        onChange={(e) =>
                                            setReportConfig({
                                                ...reportConfig,
                                                schedule: e.target.value as Report['schedule'],
                                            })
                                        }
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
                                        onChange={(e) =>
                                            setReportConfig({
                                                ...reportConfig,
                                                format: e.target.value as Report['format'],
                                            })
                                        }
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="pdf">PDF</option>
                                        <option value="csv">CSV</option>
                                        <option value="json">JSON</option>
                                    </select>
                                </div>
                            </div>

                            {/* Filters */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Date Range</label>
                                <select
                                    value={reportConfig.filters?.date_range}
                                    onChange={(e) =>
                                        setReportConfig({
                                            ...reportConfig,
                                            filters: {
                                                ...reportConfig.filters!,
                                                date_range: e.target.value as ReportFilters['date_range'],
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
                                        Select Metrics ({selectedTemplate.available_metrics.length} available)
                                    </label>
                                    <div className="border border-border rounded-lg p-4 max-h-40 overflow-y-auto space-y-2">
                                        {selectedTemplate.available_metrics.map((metric) => (
                                            <label key={metric} className="flex items-center gap-2">
                                                <input type="checkbox" className="rounded border-border" />
                                                <span className="text-sm">{metric}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-border">
                                <button
                                    onClick={() => {
                                        setShowBuilderModal(false);
                                        setSelectedTemplate(null);
                                        setReportConfig({
                                            name: '',
                                            description: '',
                                            schedule: 'manual',
                                            format: 'pdf',
                                            filters: { date_range: '30d', providers: [], tenants: [], metrics: [] },
                                        });
                                    }}
                                    className="flex-1 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => createReportMutation.mutate(reportConfig)}
                                    disabled={!reportConfig.name}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
