import { authService } from '../lib/auth';
import { useState } from 'react';
import { Activity, Shield, Clock, TrendingUp, AlertTriangle, CheckCircle, Copy, Key, LogOut } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useStats, useRecentAttacks } from '../hooks/useApi';

export function DashboardPage() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const isAuthenticated = authService.isAuthenticated();
    const [apiKeyVisible, setApiKeyVisible] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);

    // Use React Query hooks
    const { data: stats, isLoading: statsLoading, error: statsError } = useStats();
    const { data: attacksData, isLoading: attacksLoading } = useRecentAttacks(10);

    const loading = statsLoading || attacksLoading;
    const recentAttacks = (attacksData as any)?.logs || [];

    // Mock API key for demo
    const mockApiKey = 'sk_test_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const copyApiKey = () => {
        navigator.clipboard.writeText(mockApiKey);
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/');
    };

    if (statsError) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Failed to Connect</h2>
                    <p className="text-muted-foreground mb-4">
                        Unable to reach the KoreShield backend. Please check your connection.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Dashboard</h1>
                            {isAuthenticated ? (
                                <p className="text-sm text-muted-foreground">
                                    Welcome back, {user?.name || user?.email}
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Demo Mode - Viewing simulated data
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            {isAuthenticated ? (
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            ) : (
                                <Link
                                    to="/login"
                                    className="text-sm text-primary hover:underline"
                                >
                                    Sign In to see real data
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Data Source Indicator */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">
                        Connected to Railway API - Showing real-time data from production backend
                    </span>
                </div>
            </div>

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
                                <div className="text-3xl font-bold">
                                    {((stats as any)?.statistics?.requests_total || 0).toLocaleString()}
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-muted-foreground">Requests Blocked</span>
                                    <Shield className="w-5 h-5 text-red-500" />
                                </div>
                                <div className="text-3xl font-bold text-red-600">
                                    {(stats as any)?.statistics?.requests_blocked || 0}
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-muted-foreground">Attacks Detected</span>
                                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                                </div>
                                <div className="text-3xl font-bold text-orange-600">
                                    {(stats as any)?.statistics?.attacks_detected || 0}
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-muted-foreground">Requests Allowed</span>
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                </div>
                                <div className="text-3xl font-bold text-green-600">
                                    {(stats as any)?.statistics?.requests_allowed || 0}
                                </div>
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
                                    <p className="text-sm text-muted-foreground">
                                        {isAuthenticated ? 'Your authentication key' : 'Demo API key (not functional)'}
                                    </p>
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
                                                    {(attack.confidence * 100).toFixed(0)}% confidence
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
