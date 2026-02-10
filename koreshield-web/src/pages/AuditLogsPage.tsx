import { useState, useEffect } from 'react';
import { FileText, Search, Download, AlertTriangle, Filter, User, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../components/ToastNotification';
import { SEOMeta } from '../components/SEOMeta';

interface AuditLog {
	id: string;
	timestamp: string;
	user_email: string;
	action: string;
	resource_type: string;
	resource_id: string;
	status: 'success' | 'failure';
	ip_address: string;
	user_agent: string;
	details: Record<string, any>;
	severity: 'low' | 'medium' | 'high' | 'critical';
}

export default function AuditLogsPage() {
	const [logs, setLogs] = useState<AuditLog[]>([]);
	const [search, setSearch] = useState('');
	const [filterAction, setFilterAction] = useState<string>('all');
	const [filterStatus, setFilterStatus] = useState<string>('all');
	const [filterSeverity, setFilterSeverity] = useState<string>('all');
	const [loading, setLoading] = useState(true);
	const [showFilters, setShowFilters] = useState(false);
	const toast = useToast();

	// Mock data for demonstration
	useEffect(() => {
		const mockLogs: AuditLog[] = [
			{
				id: '1',
				timestamp: new Date().toISOString(),
				user_email: 'admin@koreshield.com',
				action: 'api_key.created',
				resource_type: 'api_key',
				resource_id: 'key_abc123',
				status: 'success',
				ip_address: '192.168.1.100',
				user_agent: 'Mozilla/5.0...',
				details: { key_name: 'Production API Key', scopes: ['read', 'write'] },
				severity: 'medium',
			},
			{
				id: '2',
				timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
				user_email: 'user@example.com',
				action: 'policy.updated',
				resource_type: 'policy',
				resource_id: 'policy_def456',
				status: 'success',
				ip_address: '10.0.0.50',
				user_agent: 'Chrome/120.0',
				details: { policy_name: 'Rate Limiting Policy', changes: ['threshold'] },
				severity: 'high',
			},
			{
				id: '3',
				timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
				user_email: 'unauthorized@attacker.com',
				action: 'login.failed',
				resource_type: 'auth',
				resource_id: 'auth_session_123',
				status: 'failure',
				ip_address: '203.0.113.5',
				user_agent: 'curl/7.68.0',
				details: { reason: 'invalid_credentials', attempts: 5 },
				severity: 'critical',
			},
			{
				id: '4',
				timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
				user_email: 'admin@koreshield.com',
				action: 'tenant.created',
				resource_type: 'tenant',
				resource_id: 'tenant_ghi789',
				status: 'success',
				ip_address: '192.168.1.100',
				user_agent: 'Mozilla/5.0...',
				details: { tenant_name: 'Acme Corp', plan: 'enterprise' },
				severity: 'medium',
			},
			{
				id: '5',
				timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
				user_email: 'dev@koreshield.com',
				action: 'audit_log.exported',
				resource_type: 'audit_log',
				resource_id: 'export_jkl012',
				status: 'success',
				ip_address: '172.16.0.10',
				user_agent: 'Firefox/121.0',
				details: { format: 'csv', record_count: 1500, date_range: '30_days' },
				severity: 'low',
			},
		];
		setLogs(mockLogs);
		setLoading(false);
	}, []);

	const filteredLogs = logs.filter((log) => {
		const matchesSearch =
			log.user_email.toLowerCase().includes(search.toLowerCase()) ||
			log.action.toLowerCase().includes(search.toLowerCase()) ||
			log.resource_type.toLowerCase().includes(search.toLowerCase()) ||
			log.ip_address.includes(search);

		const matchesAction = filterAction === 'all' || log.action.includes(filterAction);
		const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
		const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;

		return matchesSearch && matchesAction && matchesStatus && matchesSeverity;
	});

	const handleExport = (format: 'csv' | 'json') => {
		toast.success(`Exporting ${filteredLogs.length} logs as ${format.toUpperCase()}...`);
		// Export logic would go here
	};

	const getStatusColor = (status: string) => {
		return status === 'success'
			? 'text-green-600 bg-green-50 border-green-200'
			: 'text-red-600 bg-red-50 border-red-200';
	};

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case 'critical': return 'text-red-600 bg-red-50';
			case 'high': return 'text-orange-600 bg-orange-50';
			case 'medium': return 'text-yellow-600 bg-yellow-50';
			case 'low': return 'text-blue-600 bg-blue-50';
			default: return 'text-gray-600 bg-gray-50';
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12">
			<SEOMeta
				title="Audit & Compliance Logs | KoreShield"
				description="View and analyze audit logs for compliance and security monitoring"
			/>

			<div className="max-w-7xl mx-auto px-6">
				{/* Header */}
				<div className="mb-8">
					<div className="flex items-center gap-3 mb-4">
						<FileText className="w-8 h-8 text-electric-green" />
						<h1 className="text-4xl font-bold text-gray-900 dark:text-white">Audit & Compliance Logs</h1>
					</div>
					<p className="text-gray-600 dark:text-gray-400">
						Monitor all system activities, track compliance requirements, and detect security anomalies.
					</p>
				</div>

				{/* Stats Cards */}
				<div className="grid md:grid-cols-4 gap-6 mb-8">
					<div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-gray-600 dark:text-gray-400">Total Events</span>
							<Activity className="w-5 h-5 text-blue-500" />
						</div>
						<div className="text-2xl font-bold text-gray-900 dark:text-white">{logs.length}</div>
					</div>
					<div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-gray-600 dark:text-gray-400">Success Rate</span>
							<Activity className="w-5 h-5 text-green-500" />
						</div>
						<div className="text-2xl font-bold text-gray-900 dark:text-white">
							{Math.round((logs.filter(l => l.status === 'success').length / logs.length) * 100)}%
						</div>
					</div>
					<div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-gray-600 dark:text-gray-400">Critical Alerts</span>
							<AlertTriangle className="w-5 h-5 text-red-500" />
						</div>
						<div className="text-2xl font-bold text-gray-900 dark:text-white">
							{logs.filter(l => l.severity === 'critical').length}
						</div>
					</div>
					<div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-gray-600 dark:text-gray-400">Unique Users</span>
							<User className="w-5 h-5 text-purple-500" />
						</div>
						<div className="text-2xl font-bold text-gray-900 dark:text-white">
							{new Set(logs.map(l => l.user_email)).size}
						</div>
					</div>
				</div>

				{/* Actions Bar */}
				<div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 mb-6">
					<div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
						<div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
							<div className="relative w-full sm:w-96">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
								<input
									type="text"
									placeholder="Search logs by user, action, IP..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-green"
								/>
							</div>
							<button
								onClick={() => setShowFilters(!showFilters)}
								className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
							>
								<Filter className="w-5 h-5" />
								Filters {showFilters && <span className="text-xs">▼</span>}
							</button>
						</div>
						<div className="flex gap-2">
							<button
								onClick={() => handleExport('csv')}
								className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
							>
								<Download className="w-5 h-5" />
								CSV
							</button>
							<button
								onClick={() => handleExport('json')}
								className="inline-flex items-center gap-2 px-4 py-2 bg-electric-green hover:bg-electric-green/90 text-black font-medium rounded-lg transition-colors"
							>
								<Download className="w-5 h-5" />
								JSON
							</button>
						</div>
					</div>

					{/* Filters Panel */}
					{showFilters && (
						<div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Action Type
								</label>
								<select
									value={filterAction}
									onChange={(e) => setFilterAction(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-green"
								>
									<option value="all">All Actions</option>
									<option value="created">Created</option>
									<option value="updated">Updated</option>
									<option value="deleted">Deleted</option>
									<option value="login">Login</option>
									<option value="exported">Exported</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Status
								</label>
								<select
									value={filterStatus}
									onChange={(e) => setFilterStatus(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-green"
								>
									<option value="all">All Statuses</option>
									<option value="success">Success</option>
									<option value="failure">Failure</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Severity
								</label>
								<select
									value={filterSeverity}
									onChange={(e) => setFilterSeverity(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-green"
								>
									<option value="all">All Severities</option>
									<option value="critical">Critical</option>
									<option value="high">High</option>
									<option value="medium">Medium</option>
									<option value="low">Low</option>
								</select>
							</div>
						</div>
					)}
				</div>

				{/* Audit Logs Table */}
				<div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
					{loading ? (
						<div className="p-12 text-center text-gray-500">Loading audit logs...</div>
					) : filteredLogs.length === 0 ? (
						<div className="p-12 text-center">
							<FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
							<p className="text-gray-500">No audit logs found</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Timestamp
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											User
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Action
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Resource
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Status
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Severity
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											IP Address
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
									{filteredLogs.map((log) => (
										<tr
											key={log.id}
											className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${log.severity === 'critical' ? 'bg-red-50/30 dark:bg-red-900/10' : ''
												}`}
										>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
												{format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center gap-2">
													<User className="w-4 h-4 text-gray-400" />
													<span className="text-sm text-gray-900 dark:text-white">{log.user_email}</span>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<code className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
													{log.action}
												</code>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
												{log.resource_type}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(log.status)}`}>
													{log.status}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getSeverityColor(log.severity)}`}>
													{log.severity}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
												{log.ip_address}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{/* Footer Info */}
				<div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
					<p>
						Showing {filteredLogs.length} of {logs.length} audit log entries.
						Retention policy: 90 days for standard logs, 365 days for compliance logs.
					</p>
				</div>
			</div>
		</div>
	);
}
