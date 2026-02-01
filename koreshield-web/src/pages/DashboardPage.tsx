import { useUser, SignedIn, SignedOut, UserButton } from '../lib/auth';
import { useEffect, useState } from 'react';
import { api } from '../lib/api-client';
import { Activity, Shield, Clock, TrendingUp, AlertTriangle, CheckCircle, Copy, Key } from 'lucide-react';

export function DashboardPage() {
    const { user } = useUser();
    const [stats, setStats] = useState<any>(null);
    const [recentAttacks, setRecentAttacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiKeyVisible, setApiKeyVisible] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);

    // Mock API key for demo
    const mockApiKey = 'sk_test_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [statsData, attacksData] = await Promise.all([
                api.getStats(),
                api.getRecentAttacks(10)
            ]);
            setStats(statsData);
            setRecentAttacks(attacksData.attacks || []);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyApiKey = () => {
        navigator.clipboard.writeText(mockApiKey);
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Dashboard</h1>
                            <SignedIn>
                                <p className="text-sm text-muted-foreground">
                                    Welcome back, {user?.firstName || user?.username || 'User'}
                                </p>
                            </SignedIn>
                        </div>
                        <div className="flex items-center gap-4">
                            <SignedIn>
                                <UserButton afterSignOutUrl="/" />
                            </SignedIn>
                            <SignedOut>
                                <a href="/login" className="text-sm text-primary hover:underline">
                                    Sign In
                                </a>
                            </SignedOut>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-muted-foreground">Total Requests</span>
                                    <Activity className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="text-3xl font-bold">{stats?.total_requests.toLocaleString()}</div>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-muted-foreground">Threats Blocked</span>
                                    <Shield className="w-5 h-5 text-red-500" />
                                </div>
                                <div className="text-3xl font-bold text-red-600">{stats?.blocked_requests}</div>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-muted-foreground">Avg Latency</span>
                                    <Clock className="w-5 h-5 text-green-500" />
                                </div>
                                <div className="text-3xl font-bold">{stats?.latency_p95}ms</div>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-muted-foreground">Active Threats</span>
                                    <TrendingUp className="w-5 h-5 text-orange-500" />
                                </div>
                                <div className="text-3xl font-bold text-orange-600">{stats?.active_threats}</div>
                            </div>
                        </div>

                        {/* API Key Section */}
                        <div className="bg-card border border-border rounded-lg p-6 mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-semibold flex items-center gap-2">
                                        <Key className="w-5 h-5" />
                                        API Key
                                    </h2>
                                    <p className="text-sm text-muted-foreground">Use this key to authenticate your API requests</p>
                                </div>
                                <button
                                    onClick={() => setApiKeyVisible(!apiKeyVisible)}
                                    className="text-sm text-primary hover:underline"
                                >
                                    {apiKeyVisible ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-muted px-4 py-2 rounded-lg font-mono text-sm">
                                    {apiKeyVisible ? mockApiKey : '••••••••••••••••••••••••••••••••••••'}
                                </code>
                                <button
                                    onClick={copyApiKey}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                                >
                                    <Copy className="w-4 h-4" />
                                    {copiedKey ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        {/* Recent Attacks */}
                        <div className="bg-card border border-border rounded-lg p-6">
                            <h2 className="text-lg font-semibold mb-4">Recent Threats</h2>
                            <div className="space-y-3">
                                {recentAttacks.map((attack) => (
                                    <div
                                        key={attack.id}
                                        className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <div className="mt-1">
                                            {attack.action_taken === 'blocked' ? (
                                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                            ) : (
                                                <CheckCircle className="w-5 h-5 text-yellow-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium">{attack.threat_type}</span>
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                    attack.action_taken === 'blocked'
                                                        ? 'bg-red-500/10 text-red-600'
                                                        : 'bg-yellow-500/10 text-yellow-600'
                                                }`}>
                                                    {attack.action_taken}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {attack.confidence.toFixed(0)}% confidence
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {attack.content_preview}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(attack.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
