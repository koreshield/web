import { authService } from '../lib/auth';
import { useState, useEffect } from 'react';
import { Activity, Shield, AlertTriangle, CheckCircle, LogOut, Wifi, WifiOff, Rocket, Code, BookOpen, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useStats, useRecentAttacks } from '../hooks/useApi';
import { AttackDetailModal } from '../components/AttackDetailModal';
import { ThreatTypeBreakdown, ThreatTimeline, ThreatSummary } from '../components/ThreatAnalytics';
import { wsClient, type ThreatDetectedEvent } from '../lib/websocket-client';

export function DashboardPage() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const isAuthenticated = authService.isAuthenticated();
    const [selectedAttack, setSelectedAttack] = useState<any>(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [_latestThreats, setLatestThreats] = useState<ThreatDetectedEvent[]>([]);

    // Use React Query hooks
    const { data: stats, isLoading: statsLoading, error: statsError } = useStats();
    const { data: attacksData, isLoading: attacksLoading, error: _attacksError } = useRecentAttacks(10);

    const loading = statsLoading || attacksLoading;
    const recentAttacks = (attacksData as any)?.logs || [];
    
    // Check if user is new (no activity yet)
    const isNewUser = !loading && ((stats as any)?.requests_total === 0 || (stats as any)?.requests_total === undefined);

    // WebSocket real-time updates
    useEffect(() => {
        if (!isAuthenticated) return;

        // Connect to WebSocket
        wsClient.connect();
        setWsConnected(wsClient.isConnected());

        // Subscribe to threat events
        wsClient.subscribe(['threat_detected', 'provider_health_change']);

        // Listen for connection events
        const cleanupConnection = wsClient.on('connection_established', () => {
            setWsConnected(true);
        });

        // Listen for threat detection events
        const cleanupThreats = wsClient.on<ThreatDetectedEvent>('threat_detected', (event) => {
            console.log('[Dashboard] New threat detected:', event.data);
            
            // Add to latest threats list (keep last 5)
            setLatestThreats(prev => [event.data, ...prev.slice(0, 4)]);
            
            // Show toast notification for critical threats
            if (event.data.severity === 'critical' || event.data.severity === 'high') {
                // You can integrate a toast library here
                console.log(`[Dashboard] ${event.data.severity.toUpperCase()} threat: ${event.data.attack_type}`);
            }
        });

        // Cleanup on unmount
        return () => {
            cleanupConnection();
            cleanupThreats();
        };
    }, [isAuthenticated]);

    const handleLogout = () => {
        wsClient.disconnect();
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
                            {isAuthenticated ? (
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                    Welcome back, {user?.name || user?.email}
                                </p>
                            ) : (
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    Sign in to access the admin dashboard
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                            {/* WebSocket Status Indicator */}
                            {isAuthenticated && (
                                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-muted rounded-lg">
                                    {wsConnected ? (
                                        <>
                                            <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                                            <span className="text-xs font-medium text-green-600 hidden sm:inline">Live</span>
                                        </>
                                    ) : (
                                        <>
                                            <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                            <span className="text-xs font-medium text-gray-500 hidden sm:inline">Connecting...</span>
                                        </>
                                    )}
                                </div>
                            )}
                            {isAuthenticated ? (
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                                    aria-label="Logout"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            ) : (
                                <Link
                                    to="/login"
                                    className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Data Source Indicator */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3 flex items-start sm:items-center gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <span className="text-xs sm:text-sm text-green-600 font-medium">
                        <span className="hidden sm:inline">Connected to Railway API - Showing real-time data from production backend</span>
                        <span className="sm:hidden">Live data from production</span>
                    </span>
                </div>
            </div>

            {/* Getting Started Banner for New Users */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {isNewUser && (
                    <div className="mb-6 sm:mb-8 bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 border border-primary/20 rounded-lg p-4 sm:p-6">
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg flex-shrink-0">
                                <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg sm:text-xl font-bold mb-2">Welcome to KoreShield! 🎉</h2>
                                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                                    Get started by integrating KoreShield into your application. Follow these steps:
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4">
                                    <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                                            <h3 className="font-semibold text-sm sm:text-base">Get Your Token</h3>
                                        </div>
                                        <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                                            Your JWT token is ready to use. Copy it from the browser's localStorage or generate an API key.
                                        </p>
                                    </div>
                                    
                                    <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                                            <h3 className="font-semibold text-sm sm:text-base">Configure Policies</h3>
                                        </div>
                                        <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                                            Set up security policies to define what threats to block.
                                        </p>
                                        <Link 
                                            to="/policies"
                                            className="inline-flex items-center gap-1 text-xs sm:text-sm text-primary hover:underline"
                                        >
                                            Go to Policies <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                    
                                    <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                                            <h3 className="font-semibold text-sm sm:text-base">Send Requests</h3>
                                        </div>
                                        <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                                            Route your LLM requests through KoreShield's proxy.
                                        </p>
                                        <a 
                                            href="https://docs.koreshield.com/getting-started"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-xs sm:text-sm text-primary hover:underline"
                                        >
                                            View Docs <BookOpen className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-3 sm:p-4 mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Shield className="w-5 h-5 text-purple-500 flex-shrink-0" />
                                        <h3 className="font-semibold text-sm sm:text-base">🆕 Try RAG Security Scanner</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                                        Scan your retrieved documents for indirect prompt injection attacks with our new 5D taxonomy detection system.
                                    </p>
                                    <Link 
                                        to="/rag-security"
                                        className="inline-flex items-center gap-1 text-xs sm:text-sm text-purple-500 hover:underline font-medium"
                                    >
                                        Open RAG Scanner <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>

                                <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
                                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                        <Code className="w-4 h-4 text-primary flex-shrink-0" />
                                        <h3 className="font-semibold text-xs sm:text-sm">Quick Integration Example</h3>
                                    </div>
                                    <pre className="bg-muted p-2 sm:p-3 rounded text-[10px] sm:text-xs overflow-x-auto">
{`import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: '${window.location.origin}/v1/proxy/openai',
  apiKey: 'your-openai-key',
  defaultHeaders: {
    'Authorization': 'Bearer ${authService.getToken()?.substring(0, 20)}...'
  }
});

const response = await client.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }]
});`}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
                            <div className="bg-card border border-border rounded-lg p-3 sm:p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">Total Requests</span>
                                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                                </div>
                                <div className="text-xl sm:text-3xl font-bold">
                                    {((stats as any)?.statistics?.requests_total || 0).toLocaleString()}
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-3 sm:p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">Blocked</span>
                                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                                </div>
                                <div className="text-xl sm:text-3xl font-bold text-red-600">
                                    {(stats as any)?.statistics?.requests_blocked || 0}
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-3 sm:p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">Attacks</span>
                                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                                </div>
                                <div className="text-xl sm:text-3xl font-bold text-orange-600">
                                    {(stats as any)?.statistics?.attacks_detected || 0}
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-3 sm:p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">Allowed</span>
                                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                                </div>
                                <div className="text-xl sm:text-3xl font-bold text-green-600">
                                    {(stats as any)?.statistics?.requests_allowed || 0}
                                </div>
                            </div>
                        </div>

                        {/* Recent Attacks */}
                        <div className="bg-card border border-border rounded-lg p-6 mb-8">
                            <h2 className="text-lg font-semibold mb-4">Recent Threats</h2>
                            <div className="space-y-3">
                                {recentAttacks.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No threats detected yet</p>
                                    </div>
                                ) : (
                                    recentAttacks.map((attack: any) => (
                                        <div
                                            key={attack.id}
                                            onClick={() => setSelectedAttack(attack)}
                                            className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
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
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Threat Analytics */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            <ThreatTypeBreakdown data={(stats as any)?.statistics?.attack_types || {}} />
                            <ThreatSummary
                                totalRequests={(stats as any)?.statistics?.requests_total || 0}
                                blockedRequests={(stats as any)?.statistics?.requests_blocked || 0}
                                attacksDetected={(stats as any)?.statistics?.attacks_detected || 0}
                                topThreatType={getTopThreatType((stats as any)?.statistics?.attack_types || {})}
                            />
                        </div>

                        {recentAttacks.length > 0 && (
                            <ThreatTimeline attacks={recentAttacks} />
                        )}
                    </>
                )}
            </main>

            {/* Attack Detail Modal */}
            <AttackDetailModal
                attack={selectedAttack}
                isOpen={selectedAttack !== null}
                onClose={() => setSelectedAttack(null)}
            />
        </div>
    );
}

function getTopThreatType(attackTypes: Record<string, number>): string {
    const entries = Object.entries(attackTypes);
    if (entries.length === 0) return 'None';
    
    const sorted = entries.sort(([, a], [, b]) => b - a);
    return sorted[0][0];
}
