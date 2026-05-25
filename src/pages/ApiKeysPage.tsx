import { useState } from 'react';
import { Key, Plus, Copy, Trash2, CheckCircle, AlertTriangle, Calendar, Clock, Globe, Lock, Zap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api-client';
import { useToast } from '../components/ToastNotification';
import { normalizePlanSlug, PLAN_API_KEY_LIMITS, PLAN_NAMES } from '../lib/entitlements';
import {
	AppPage,
	AppPageHeader,
	AppStatGrid,
	AppStatCard,
	AppCallout,
	AppEmptyState,
	AppPrimaryButton,
	AppSecondaryButton,
	AppSurface,
} from '../components/AppPageLayout';

interface APIKey {
	id: string;
	name: string;
	description: string | null;
	key_prefix: string;
	last_used_at: string | null;
	expires_at: string | null;
	is_revoked: boolean;
	created_at: string;
	rate_limit_rpm: number | null;
	allowed_origins: string[] | null;
	environment: 'dev' | 'staging' | 'prod' | null;
	monthly_ceiling: number | null;
}

interface NewAPIKey extends APIKey {
	api_key: string; // Full key - only shown once
}

type CreateAPIKeyPayload = {
	name: string;
	description?: string;
	expires_at?: string;
	rate_limit_rpm?: number;
	allowed_origins?: string[];
	environment?: string;
	monthly_ceiling?: number;
};

function isExpired(expiresAt: string | null) {
	if (!expiresAt) return false;
	return new Date(expiresAt) < new Date();
}

export function ApiKeysPage() {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showKeyLimitPrompt, setShowKeyLimitPrompt] = useState(false);
	const [newKeyData, setNewKeyData] = useState<NewAPIKey | null>(null);
	const [formData, setFormData] = useState<{
		name: string;
		description: string;
		expires_at: string;
		environment: string;
		rate_limit_rpm: string;
		monthly_ceiling: string;
		allowed_origins: string;
	}>({
		name: '',
		description: '',
		expires_at: '',
		environment: '',
		rate_limit_rpm: '',
		monthly_ceiling: '',
		allowed_origins: '',
	});
	const [copiedKey, setCopiedKey] = useState<string | null>(null);
	const { success, error } = useToast();

	const queryClient = useQueryClient();

	const billingQuery = useQuery({
		queryKey: ['billing-account-entitlements'],
		queryFn: () => api.getBillingAccount() as Promise<{ plan_slug?: string | null }>,
		staleTime: 60 * 1000,
		retry: false,
	});
	const planSlug = normalizePlanSlug(billingQuery.data?.plan_slug);
	const keyLimit = PLAN_API_KEY_LIMITS[planSlug];
	const planName = PLAN_NAMES[planSlug];

	// Fetch API keys
	const { data: apiKeys = [], isLoading } = useQuery<APIKey[]>({
		queryKey: ['api-keys'],
		queryFn: () => api.getApiKeys() as Promise<APIKey[]>,
	});

	const activeKeyCount = apiKeys.filter((k) => !k.is_revoked && !isExpired(k.expires_at)).length;
	const atKeyLimit = keyLimit !== null && activeKeyCount >= keyLimit;

	const handleGenerateClick = () => {
		if (atKeyLimit) {
			setShowKeyLimitPrompt(true);
		} else {
			setShowCreateModal(true);
		}
	};

	// Generate API key mutation
	const generateKeyMutation = useMutation<NewAPIKey, Error, CreateAPIKeyPayload>({
		mutationFn: (data: CreateAPIKeyPayload) =>
			api.generateApiKey(data) as Promise<NewAPIKey>,
		onSuccess: (data: NewAPIKey) => {
			queryClient.invalidateQueries({ queryKey: ['api-keys'] });
			setNewKeyData(data);
			setShowCreateModal(false);
			setFormData({ name: '', description: '', expires_at: '', environment: '', rate_limit_rpm: '', monthly_ceiling: '', allowed_origins: '' });
			success('API key generated successfully!');
		},
		onError: (err) => {
			error('Failed to generate API key', err?.message || 'Please check your input and try again.');
		},
	});

	// Revoke API key mutation
	const revokeKeyMutation = useMutation({
		mutationFn: (keyId: string) => api.revokeApiKey(keyId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['api-keys'] });
			success('API key revoked successfully');
		},
		onError: () => {
			error('Failed to revoke API key');
		},
	});

	const handleCopyKey = (key: string) => {
		navigator.clipboard.writeText(key);
		setCopiedKey(key);
		setTimeout(() => setCopiedKey(null), 2000);
		success('Copied to clipboard!');
	};

	const handleCreateKey = () => {
		if (!formData.name.trim()) {
			error('Name is required', 'Provide a name for the API key before generating.');
			return;
		}

		let rate_limit_rpm: number | undefined;
		if (formData.rate_limit_rpm) {
			rate_limit_rpm = parseInt(formData.rate_limit_rpm, 10);
			if (isNaN(rate_limit_rpm) || rate_limit_rpm <= 0) {
				error('Invalid rate limit', 'Rate limit must be a positive integer.');
				return;
			}
		}

		let monthly_ceiling: number | undefined;
		if (formData.monthly_ceiling) {
			monthly_ceiling = parseInt(formData.monthly_ceiling, 10);
			if (isNaN(monthly_ceiling) || monthly_ceiling <= 0) {
				error('Invalid monthly ceiling', 'Monthly ceiling must be a positive integer.');
				return;
			}
		}

		const allowed_origins: string[] | undefined = formData.allowed_origins
			? formData.allowed_origins.split(',').map((s) => s.trim()).filter(Boolean)
			: undefined;

		const data: CreateAPIKeyPayload = {
			name: formData.name.trim(),
			description: formData.description || undefined,
			environment: formData.environment || undefined,
			rate_limit_rpm,
			monthly_ceiling,
			allowed_origins,
		};

		if (formData.expires_at) {
			// Set to end of day in UTC to avoid timezone-related shifts
			const [yearStr, monthStr, dayStr] = formData.expires_at.split('-');
			const year = Number(yearStr);
			const month = Number(monthStr); // 1-based
			const day = Number(dayStr);

			// Construct UTC date at 23:59:59.999
			const utcEndOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
			data.expires_at = utcEndOfDay.toISOString();
		}

		generateKeyMutation.mutate(data);
	};

	const handleRevokeKey = (keyId: string, keyName: string) => {
		if (confirm(`Are you sure you want to revoke "${keyName}"? This action cannot be undone.`)) {
			revokeKeyMutation.mutate(keyId);
		}
	};

	const formatDate = (dateString: string | null) => {
		if (!dateString) return 'Never';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const revokedKeyCount = apiKeys.filter((key) => key.is_revoked).length;
	const expiredKeyCount = apiKeys.filter((key) => !key.is_revoked && isExpired(key.expires_at)).length;

	return (
		<>
			<AppPage>
				<AppPageHeader
					eyebrow="Credentials"
					eyebrowIcon={Key}
					title="API Keys"
					description="Generate and manage API keys for authentication"
					icon={Key}
					actions={
						<AppPrimaryButton onClick={handleGenerateClick} className="w-full sm:w-auto">
							<Plus className="w-4 h-4" />
							<span className="hidden sm:inline">Generate New Key</span>
							<span className="sm:hidden">New Key</span>
						</AppPrimaryButton>
					}
				/>

				{!isLoading && apiKeys.length > 0 && (
					<AppStatGrid>
						<AppStatCard label="Total Keys" value={apiKeys.length} icon={Key} />
						<AppStatCard label="Active" value={activeKeyCount} icon={CheckCircle} tone="text-electric-green" />
						<AppStatCard label="Revoked" value={revokedKeyCount} icon={Trash2} tone="text-red-400" />
						<AppStatCard label="Expired" value={expiredKeyCount} icon={AlertTriangle} tone="text-amber-400" />
					</AppStatGrid>
				)}

				{newKeyData && (
					<AppCallout variant="success" className="p-6">
						<div className="flex items-start gap-3 mb-4">
							<CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
							<div className="flex-1">
								<h3 className="font-bold mb-1">API Key Generated!</h3>
								<p className="text-sm opacity-90">
									Copy your API key now. For security reasons, it won't be shown again.
								</p>
							</div>
						</div>
						<AppSurface className="border-0 bg-background/60 p-4">
							<div className="flex items-center justify-between gap-4">
								<code className="text-sm font-mono flex-1 break-all">{newKeyData.api_key}</code>
								<AppPrimaryButton onClick={() => handleCopyKey(newKeyData.api_key)}>
									{copiedKey === newKeyData.api_key ? (
										<>
											<CheckCircle className="w-4 h-4" />
											Copied!
										</>
									) : (
										<>
											<Copy className="w-4 h-4" />
											Copy
										</>
									)}
								</AppPrimaryButton>
							</div>
						</AppSurface>
						<button
							type="button"
							onClick={() => setNewKeyData(null)}
							className="mt-4 text-sm opacity-80 hover:opacity-100 transition-opacity"
						>
							I've saved my key securely
						</button>
					</AppCallout>
				)}

				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
					</div>
				) : apiKeys.length === 0 ? (
					<AppEmptyState
						icon={Key}
						title="No API Keys Yet"
						description="Generate your first API key to start using the Koreshield API"
						action={
							<AppPrimaryButton onClick={handleGenerateClick}>
								<Plus className="w-4 h-4" />
								Generate Your First Key
							</AppPrimaryButton>
						}
					/>
				) : (
					<div className="space-y-4">
						{apiKeys.map((key: APIKey) => {
							const expired = isExpired(key.expires_at);
							const status = key.is_revoked ? 'revoked' : expired ? 'expired' : 'active';

							return (
								<AppSurface
									key={key.id}
									className={`p-6 ${status === 'active' ? '' : 'border-red-500/20 opacity-60'}`}
								>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="flex items-center gap-3 mb-2">
												<h3 className="text-lg font-semibold">{key.name}</h3>
												<span
													className={`px-2 py-1 rounded text-xs font-medium ${status === 'active'
														? 'bg-green-500/10 text-green-600'
														: status === 'expired'
															? 'bg-yellow-500/10 text-yellow-600'
															: 'bg-red-500/10 text-red-600'
														}`}
												>
													{status}
												</span>
											{key.environment && (
												<span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-600">
													{key.environment}
												</span>
											)}
										</div>
										{(key.rate_limit_rpm || key.monthly_ceiling || key.allowed_origins?.length) ? (
											<div className="flex flex-wrap gap-2 mb-2">
												{key.rate_limit_rpm && (
													<span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-purple-500/10 text-purple-600">
														<Zap className="w-3 h-3" />{key.rate_limit_rpm} RPM
													</span>
												)}
												{key.monthly_ceiling && (
													<span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-orange-500/10 text-orange-600">
														<Clock className="w-3 h-3" />{key.monthly_ceiling.toLocaleString()} / mo
													</span>
												)}
												{key.allowed_origins?.length ? (
													<span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-teal-500/10 text-teal-600">
														<Globe className="w-3 h-3" />{key.allowed_origins.length} origin{key.allowed_origins.length !== 1 ? 's' : ''}
													</span>
												) : null}
											</div>
										) : null}
											{key.description && (
												<p className="text-sm text-muted-foreground mb-4">
													{key.description}
												</p>
											)}
											<div className="flex items-center gap-2 mb-3">
												<code className="text-sm font-mono bg-muted px-2 py-1 rounded">
													{key.key_prefix}...
												</code>
											</div>
											<div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
												<div className="flex items-center gap-1">
													<Calendar className="w-4 h-4" />
													Created: {formatDate(key.created_at)}
												</div>
												{key.last_used_at && (
													<div className="flex items-center gap-1">
														<Clock className="w-4 h-4" />
														Last used: {formatDate(key.last_used_at)}
													</div>
												)}
												{key.expires_at && (
													<div
														className={`flex items-center gap-1 ${expired ? 'text-red-600' : ''
															}`}
													>
														<AlertTriangle className="w-4 h-4" />
														{expired ? 'Expired' : 'Expires'}: {formatDate(key.expires_at)}
													</div>
												)}
											</div>
										</div>
										{status === 'active' && (
											<button
												onClick={() => handleRevokeKey(key.id, key.name)}
												className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-500/10 rounded transition-colors"
											>
												<Trash2 className="w-4 h-4" />
												Revoke
											</button>
										)}
									</div>
								</AppSurface>
							);
						})}
					</div>
				)}

				<AppSurface className="mt-8">
					<h3 className="text-lg font-black tracking-[-0.03em] mb-4">Using Your API Key</h3>
					<div className="space-y-4 text-sm">
						<div className="rounded-lg border border-border bg-muted/30 p-4">
							<div className="font-medium mb-2">What happens next</div>
							<ol className="list-decimal ml-5 space-y-1 text-muted-foreground">
								<li>Create one key for your backend, worker, or gateway.</li>
								<li>Store it in an environment variable, not in browser code.</li>
								<li>Send one protected request through Koreshield.</li>
								<li>Run one malicious prompt or RAG scan so you can see the detection in the dashboard.</li>
							</ol>
						</div>
						<div>
							<p className="text-muted-foreground mb-2">
								Include your API key in the Authorization header:
							</p>
							<pre className="bg-muted p-4 rounded-lg overflow-x-auto">
								<code className="text-xs">
									{`curl https://api.koreshield.com/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
								</code>
							</pre>
						</div>
						<AppCallout variant="warning">
							<div className="flex items-start gap-2">
								<AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
								<div>
									<p className="font-bold mb-1">Security Best Practices</p>
									<ul className="space-y-1 ml-4 list-disc opacity-90">
										<li>Never share your API keys or commit them to version control</li>
										<li>Store keys securely using environment variables</li>
										<li>Rotate keys regularly and revoke unused keys</li>
										<li>Use separate keys for different environments (dev, staging, prod)</li>
										<li>Only the newly generated full key is usable. The list view shows prefixes for identification only.</li>
									</ul>
								</div>
							</div>
						</AppCallout>
					</div>
				</AppSurface>
			</AppPage>

			{showCreateModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="dashboard-modal bg-card border border-border rounded-2xl max-w-md w-full p-6">
						<h2 className="text-xl font-bold mb-4">Generate New API Key</h2>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-2">
									Name <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									placeholder="Production API Key"
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Description</label>
								<textarea
									placeholder="Used for production API calls"
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
									rows={3}
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">
									Expiration Date
								</label>
								<input
									type="date"
									min={new Date().toLocaleDateString('en-CA')} // YYYY-MM-DD in local time
									value={formData.expires_at || ''}
									onChange={(e) =>
										setFormData({ ...formData, expires_at: e.target.value })
									}
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								/>
								<p className="text-xs text-muted-foreground mt-1">
									Optional. Key will never expire if left empty.
								</p>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Environment</label>
								<select
									value={formData.environment}
									onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								>
									<option value="">None</option>
									<option value="dev">dev</option>
									<option value="staging">staging</option>
									<option value="prod">prod</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Rate Limit (requests/min)</label>
								<input
									type="number"
									min="1"
									placeholder="e.g. 60"
									value={formData.rate_limit_rpm}
									onChange={(e) => setFormData({ ...formData, rate_limit_rpm: e.target.value })}
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								/>
								<p className="text-xs text-muted-foreground mt-1">Optional per-key RPM cap (overrides plan limit if lower).</p>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Monthly Ceiling</label>
								<input
									type="number"
									min="1"
									placeholder="e.g. 10000"
									value={formData.monthly_ceiling}
									onChange={(e) => setFormData({ ...formData, monthly_ceiling: e.target.value })}
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								/>
								<p className="text-xs text-muted-foreground mt-1">Optional monthly request ceiling for this key.</p>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Allowed Origins</label>
								<textarea
									placeholder="https://app.example.com, https://staging.example.com"
									value={formData.allowed_origins}
									onChange={(e) => setFormData({ ...formData, allowed_origins: e.target.value })}
									rows={2}
									className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								/>
								<p className="text-xs text-muted-foreground mt-1">Optional. Comma-separated list of allowed request origins.</p>
							</div>
							<div className="flex gap-3 mt-6">
								<AppSecondaryButton
									onClick={() => {
										setShowCreateModal(false);
										setFormData({ name: '', description: '', expires_at: '', environment: '', rate_limit_rpm: '', monthly_ceiling: '', allowed_origins: '' });
									}}
									className="flex-1"
									disabled={generateKeyMutation.isPending}
								>
									Cancel
								</AppSecondaryButton>
								<AppPrimaryButton
									onClick={handleCreateKey}
									disabled={!formData.name || generateKeyMutation.isPending}
									className="flex-1"
								>
									{generateKeyMutation.isPending ? 'Generating...' : 'Generate Key'}
								</AppPrimaryButton>
							</div>
						</div>
					</div>
				</div>
			)}

			{showKeyLimitPrompt && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="dashboard-modal bg-card border border-border rounded-2xl max-w-md w-full p-6 text-center">
						<div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
							<Lock className="w-6 h-6 text-amber-500" />
						</div>
						<h2 className="text-xl font-bold mb-2">API Key Limit Reached</h2>
						<p className="text-muted-foreground mb-1">
							Your <span className="font-semibold text-foreground">{planName}</span> plan includes{' '}
							<span className="font-semibold text-foreground">{keyLimit}</span> active API key{keyLimit === 1 ? '' : 's'}.
						</p>
						<p className="text-sm text-muted-foreground mb-6">
							Upgrade your plan to generate additional keys, or revoke an existing key to free up a slot.
						</p>
						<div className="flex gap-3">
							<AppSecondaryButton
								onClick={() => setShowKeyLimitPrompt(false)}
								className="flex-1"
							>
								Close
							</AppSecondaryButton>
							<Link
								to="/billing?feature=API+Keys"
								className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-0 bg-primary text-primary-foreground font-bold px-4 py-2.5 text-sm hover:bg-primary/90 transition-colors"
							>
								<Zap className="w-4 h-4" />
								Upgrade Plan
							</Link>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
