import { useState } from 'react';
import { Key, Plus, Copy, Trash2, CheckCircle, AlertTriangle, Eye, EyeOff, Calendar, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import { ToastNotification } from '../components/ToastNotification';

interface APIKey {
    id: string;
    name: string;
    description: string | null;
    key_prefix: string;
    last_used_at: string | null;
    expires_at: string | null;
    is_revoked: boolean;
    created_at: string;
}

interface NewAPIKey extends APIKey {
    api_key: string; // Full key - only shown once
}

export function ApiKeysPage() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newKeyData, setNewKeyData] = useState<NewAPIKey | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        expires_in_days: '',
    });
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const queryClient = useQueryClient();

    // Fetch API keys
    const { data: apiKeys = [], isLoading } = useQuery({
        queryKey: ['api-keys'],
        queryFn: () => api.getApiKeys(),
    });

    // Generate API key mutation
    const generateKeyMutation = useMutation({
        mutationFn: (data: { name: string; description?: string; expires_in_days?: number }) =>
            api.generateApiKey(data),
        onSuccess: (data: NewAPIKey) => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
            setNewKeyData(data);
            setShowCreateModal(false);
            setFormData({ name: '', description: '', expires_in_days: '' });
            setToast({ message: 'API key generated successfully!', type: 'success' });
        },
        onError: () => {
            setToast({ message: 'Failed to generate API key', type: 'error' });
        },
    });

    // Revoke API key mutation
    const revokeKeyMutation = useMutation({
        mutationFn: (keyId: string) => api.revokeApiKey(keyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
            setToast({ message: 'API key revoked successfully', type: 'success' });
        },
        onError: () => {
            setToast({ message: 'Failed to revoke API key', type: 'error' });
        },
    });

    const handleCopyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
        setToast({ message: 'Copied to clipboard!', type: 'success' });
    };

    const handleCreateKey = () => {
        const data: any = {
            name: formData.name,
            description: formData.description || undefined,
        };
        if (formData.expires_in_days) {
            data.expires_in_days = parseInt(formData.expires_in_days);
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

    const isExpired = (expiresAt: string | null) => {
        if (!expiresAt) return false;
        return new Date(expiresAt) < new Date();
    };

    return (
        <div className="min-h-screen bg-background">
            {toast && (
                <ToastNotification
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Key className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">API Keys</h1>
                                <p className="text-sm text-muted-foreground">
                                    Generate and manage API keys for authentication
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Generate New Key
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* New Key Display */}
                {newKeyData && (
                    <div className="mb-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-6">
                        <div className="flex items-start gap-3 mb-4">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-green-600 mb-1">API Key Generated!</h3>
                                <p className="text-sm text-muted-foreground">
                                    Copy your API key now. For security reasons, it won't be shown again.
                                </p>
                            </div>
                        </div>
                        <div className="bg-card border border-border rounded-lg p-4">
                            <div className="flex items-center justify-between gap-4">
                                <code className="text-sm font-mono flex-1 break-all">{newKeyData.api_key}</code>
                                <button
                                    onClick={() => handleCopyKey(newKeyData.api_key)}
                                    className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                >
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
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={() => setNewKeyData(null)}
                            className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            I've saved my key securely
                        </button>
                    </div>
                )}

                {/* API Keys List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : apiKeys.length === 0 ? (
                    <div className="bg-card border border-border rounded-lg p-12 text-center">
                        <Key className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No API Keys Yet</h3>
                        <p className="text-muted-foreground mb-6">
                            Generate your first API key to start using the Koreshield API
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Generate Your First Key
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {apiKeys.map((key: APIKey) => {
                            const expired = isExpired(key.expires_at);
                            const status = key.is_revoked ? 'revoked' : expired ? 'expired' : 'active';

                            return (
                                <div
                                    key={key.id}
                                    className={`bg-card border rounded-lg p-6 ${
                                        status === 'active'
                                            ? 'border-border'
                                            : 'border-red-500/20 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold">{key.name}</h3>
                                                <span
                                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                                        status === 'active'
                                                            ? 'bg-green-500/10 text-green-600'
                                                            : status === 'expired'
                                                            ? 'bg-yellow-500/10 text-yellow-600'
                                                            : 'bg-red-500/10 text-red-600'
                                                    }`}
                                                >
                                                    {status}
                                                </span>
                                            </div>
                                            {key.description && (
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    {key.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mb-3">
                                                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                                    {key.key_prefix}...
                                                </code>
                                                <button
                                                    onClick={() => handleCopyKey(key.key_prefix)}
                                                    className="p-1 hover:bg-muted rounded transition-colors"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
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
                                                        className={`flex items-center gap-1 ${
                                                            expired ? 'text-red-600' : ''
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
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Usage Instructions */}
                <div className="mt-8 bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Using Your API Key</h3>
                    <div className="space-y-4 text-sm">
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
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
                                </code>
                            </pre>
                        </div>
                        <div className="flex items-start gap-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-yellow-600 mb-1">Security Best Practices</p>
                                <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                                    <li>Never share your API keys or commit them to version control</li>
                                    <li>Store keys securely using environment variables</li>
                                    <li>Rotate keys regularly and revoke unused keys</li>
                                    <li>Use separate keys for different environments (dev, staging, prod)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Create Key Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
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
                                    Expiration (days)
                                </label>
                                <input
                                    type="number"
                                    placeholder="Leave empty for no expiration"
                                    value={formData.expires_in_days}
                                    onChange={(e) =>
                                        setFormData({ ...formData, expires_in_days: e.target.value })
                                    }
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Optional. Key will never expire if left empty.
                                </p>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setFormData({ name: '', description: '', expires_in_days: '' });
                                    }}
                                    className="flex-1 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                    disabled={generateKeyMutation.isPending}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateKey}
                                    disabled={!formData.name || generateKeyMutation.isPending}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {generateKeyMutation.isPending ? 'Generating...' : 'Generate Key'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
