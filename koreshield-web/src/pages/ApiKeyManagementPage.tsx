import { useState, useEffect } from 'react';
import { Key, Plus, Search, Trash2, Copy, AlertCircle, BarChart3, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../components/ToastNotification';
import { SEOMeta } from '../components/SEOMeta';

interface ApiKey {
	id: string;
	name: string;
	key: string;
	created_at: string;
	expires_at: string | null;
	last_used_at: string | null;
	status: 'active' | 'expired' | 'revoked';
	scopes: string[];
	rate_limit: number;
	request_count: number;
}

export default function ApiKeyManagementPage() {
	const [keys, setKeys] = useState<ApiKey[]>([]);
	const [search, setSearch] = useState('');
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [loading, setLoading] = useState(true);
	const toast = useToast();

	// Mock data for demonstration
	useEffect(() => {
		const mockKeys: ApiKey[] = [
			{
				id: '1',
				name: 'Production API Key',
				key: 'ks_prod_abc123***************xyz',
				created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
				expires_at: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(),
				last_used_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
				status: 'active',
				scopes: ['read', 'write'],
				rate_limit: 1000,
				request_count: 45230,
			},
			{
				id: '2',
				name: 'Development Key',
				key: 'ks_dev_def456***************abc',
				created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
				expires_at: null,
				last_used_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
				status: 'active',
				scopes: ['read'],
				rate_limit: 100,
				request_count: 1205,
			},
			{
				id: '3',
				name: 'Staging Key',
				key: 'ks_stg_ghi789***************def',
				created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
				expires_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
				last_used_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
				status: 'expired',
				scopes: ['read', 'write'],
				rate_limit: 500,
				request_count: 8934,
			},
		];
		setKeys(mockKeys);
		setLoading(false);
	}, []);

	const filteredKeys = keys.filter((key) =>
		key.name.toLowerCase().includes(search.toLowerCase()) ||
		key.key.toLowerCase().includes(search.toLowerCase())
	);

	const handleCopyKey = (key: string) => {
		navigator.clipboard.writeText(key);
		toast.success('API Key copied to clipboard');
	};

	const handleRevokeKey = (keyId: string) => {
		setKeys(keys.map(k => k.id === keyId ? { ...k, status: 'revoked' as const } : k));
		toast.success('API key revoked successfully');
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'active': return 'text-green-600 bg-green-50 border-green-200';
			case 'expired': return 'text-orange-600 bg-orange-50 border-orange-200';
			case 'revoked': return 'text-red-600 bg-red-50 border-red-200';
			default: return 'text-gray-600 bg-gray-50 border-gray-200';
		}
	};

	const getExpirationWarning = (expiresAt: string | null) => {
		if (!expiresAt) return null;
		const daysUntilExpiry = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
		if (daysUntilExpiry <= 0) return null;
		if (daysUntilExpiry <= 7) return { days: daysUntilExpiry, severity: 'critical' };
		if (daysUntilExpiry <= 14) return { days: daysUntilExpiry, severity: 'warning' };
		if (daysUntilExpiry <= 30) return { days: daysUntilExpiry, severity: 'info' };
		return null;
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12">
			<SEOMeta
				title="API Key Management | KoreShield"
				description="Manage your API keys, configure permissions, and monitor usage"
			/>

			<div className="max-w-7xl mx-auto px-6">
				{/* Header */}
				<div className="mb-8">
					<div className="flex items-center gap-3 mb-4">
						<Key className="w-8 h-8 text-electric-green" />
						<h1 className="text-4xl font-bold text-gray-900 dark:text-white">API Key Management</h1>
					</div>
					<p className="text-gray-600 dark:text-gray-400">
						Create, manage, and monitor your API keys with comprehensive access control and usage analytics.
					</p>
				</div>

				{/* Stats Cards */}
				<div className="grid md:grid-cols-4 gap-6 mb-8">
					<div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-gray-600 dark:text-gray-400">Total Keys</span>
							<Key className="w-5 h-5 text-blue-500" />
						</div>
						<div className="text-2xl font-bold text-gray-900 dark:text-white">{keys.length}</div>
					</div>
					<div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-gray-600 dark:text-gray-400">Active Keys</span>
							<Shield className="w-5 h-5 text-green-500" />
						</div>
						<div className="text-2xl font-bold text-gray-900 dark:text-white">
							{keys.filter(k => k.status === 'active').length}
						</div>
					</div>
					<div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-gray-600 dark:text-gray-400">Total Requests</span>
							<BarChart3 className="w-5 h-5 text-purple-500" />
						</div>
						<div className="text-2xl font-bold text-gray-900 dark:text-white">
							{keys.reduce((sum, k) => sum + k.request_count, 0).toLocaleString()}
						</div>
					</div>
					<div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-gray-600 dark:text-gray-400">Expiring Soon</span>
							<AlertCircle className="w-5 h-5 text-orange-500" />
						</div>
						<div className="text-2xl font-bold text-gray-900 dark:text-white">
							{keys.filter(k => {
								const warning = getExpirationWarning(k.expires_at);
								return warning && warning.days <= 30;
							}).length}
						</div>
					</div>
				</div>

				{/* Actions Bar */}
				<div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 mb-6">
					<div className="flex flex-col md:flex-row gap-4 justify-between items-center">
						<div className="relative w-full md:w-96">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
							<input
								type="text"
								placeholder="Search API keys..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-green"
							/>
						</div>
						<button
							onClick={() => setShowCreateModal(true)}
							className="inline-flex items-center gap-2 px-4 py-2 bg-electric-green hover:bg-electric-green/90 text-black font-medium rounded-lg transition-colors"
						>
							<Plus className="w-5 h-5" />
							Create New Key
						</button>
					</div>
				</div>

				{/* API Keys Table */}
				<div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
					{loading ? (
						<div className="p-12 text-center text-gray-500">Loading API keys...</div>
					) : filteredKeys.length === 0 ? (
						<div className="p-12 text-center">
							<Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
							<p className="text-gray-500">No API keys found</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Name
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											API Key
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Status
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Scopes
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Rate Limit
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Requests
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Last Used
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
									{filteredKeys.map((key) => {
										const expirationWarning = getExpirationWarning(key.expires_at);
										return (
											<tr key={key.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="flex flex-col">
														<span className="font-medium text-gray-900 dark:text-white">{key.name}</span>
														<span className="text-xs text-gray-500 dark:text-gray-400">
															Created {format(new Date(key.created_at), 'MMM d, yyyy')}
														</span>
														{expirationWarning && (
															<span className={`text-xs mt-1 ${expirationWarning.severity === 'critical' ? 'text-red-600' :
																expirationWarning.severity === 'warning' ? 'text-orange-600' : 'text-blue-600'
																}`}>
																Expires in {expirationWarning.days} days
															</span>
														)}
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="flex items-center gap-2">
														<code className="text-sm text-gray-600 dark:text-gray-400 font-mono">
															{key.key}
														</code>
														<button
															onClick={() => handleCopyKey(key.key)}
															className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
														>
															<Copy className="w-4 h-4 text-gray-500" />
														</button>
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(key.status)}`}>
														{key.status}
													</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="flex gap-1">
														{key.scopes.map((scope) => (
															<span
																key={scope}
																className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded"
															>
																{scope}
															</span>
														))}
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
													{key.rate_limit}/min
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
													{key.request_count.toLocaleString()}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
													{key.last_used_at ? format(new Date(key.last_used_at), 'MMM d, HH:mm') : 'Never'}
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="flex items-center gap-2">
														<button
															onClick={() => handleRevokeKey(key.id)}
															disabled={key.status === 'revoked'}
															className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
															title="Revoke key"
														>
															<Trash2 className="w-4 h-4 text-red-500" />
														</button>
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{/* Create Modal Placeholder */}
				{showCreateModal && (
					<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
						<div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6">
							<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Create New API Key</h2>
							<p className="text-gray-600 dark:text-gray-400 mb-6">
								This feature requires backend implementation. API key creation will be available soon.
							</p>
							<button
								onClick={() => setShowCreateModal(false)}
								className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors"
							>
								Close
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
