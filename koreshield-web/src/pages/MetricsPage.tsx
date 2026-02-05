import { useState } from 'react';
import { Activity, TrendingUp, AlertTriangle, Zap, Database, Clock } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function MetricsPage() {
    const [timeRange, setTimeRange] = useState('1h');

    // Generate time-series data for visualization
    const generateTimeSeriesData = () => {
        const now = Date.now();
        const points = 20;
        return Array.from({ length: points }, (_, i) => ({
            time: new Date(now - (points - i) * 60000).toLocaleTimeString(),
            requests: Math.floor(Math.random() * 100) + 50,
            blocked: Math.floor(Math.random() * 20),
            latency: Math.floor(Math.random() * 100) + 20,
            errors: Math.floor(Math.random() * 5),
        }));
    };

    const timeSeriesData = generateTimeSeriesData();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Activity className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Prometheus Metrics</h1>
                                <p className="text-sm text-muted-foreground">
                                    Real-time system metrics and performance monitoring
                                </p>
                            </div>
                        </div>
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="5m">Last 5 minutes</option>
                            <option value="15m">Last 15 minutes</option>
                            <option value="1h">Last hour</option>
                            <option value="6h">Last 6 hours</option>
                            <option value="24h">Last 24 hours</option>
                            <option value="7d">Last 7 days</option>
                        </select>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Requests/sec</span>
                            <Zap className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="text-3xl font-bold">24.5</div>
                        <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> +12% from last hour
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Avg Latency</span>
                            <Clock className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="text-3xl font-bold">45ms</div>
                        <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> -8ms improvement
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Error Rate</span>
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="text-3xl font-bold">0.3%</div>
                        <div className="text-xs text-green-600 mt-1">Within SLA targets</div>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">CPU Usage</span>
                            <Database className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="text-3xl font-bold">34%</div>
                        <div className="text-xs text-muted-foreground mt-1">4 cores active</div>
                    </div>
                </div>

                {/* Request Rate Chart */}
                <div className="bg-card border border-border rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold mb-4">Request Rate & Latency</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={timeSeriesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} name="Requests" />
                            <Line type="monotone" dataKey="latency" stroke="#8b5cf6" strokeWidth={2} name="Latency (ms)" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Blocked Requests & Errors */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Blocked Requests</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={timeSeriesData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                />
                                <Bar dataKey="blocked" fill="#ef4444" name="Blocked" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Error Rate</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={timeSeriesData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                />
                                <Line type="monotone" dataKey="errors" stroke="#f97316" strokeWidth={2} name="Errors" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Detailed Metrics Table */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-border">
                        <h3 className="text-lg font-semibold">Detailed Metrics</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted border-b border-border">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Metric</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Current</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Average</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Peak</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <tr>
                                    <td className="px-6 py-4 font-mono text-sm">koreshield_requests_total</td>
                                    <td className="px-6 py-4">12,458</td>
                                    <td className="px-6 py-4">24.5/sec</td>
                                    <td className="px-6 py-4">156/sec</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-green-500/10 text-green-600 rounded text-xs">Normal</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 font-mono text-sm">koreshield_requests_blocked</td>
                                    <td className="px-6 py-4">342</td>
                                    <td className="px-6 py-4">0.7/sec</td>
                                    <td className="px-6 py-4">12/sec</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-green-500/10 text-green-600 rounded text-xs">Normal</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 font-mono text-sm">koreshield_response_time_ms</td>
                                    <td className="px-6 py-4">45ms</td>
                                    <td className="px-6 py-4">52ms</td>
                                    <td className="px-6 py-4">234ms</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-green-500/10 text-green-600 rounded text-xs">Healthy</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 font-mono text-sm">koreshield_error_rate</td>
                                    <td className="px-6 py-4">0.3%</td>
                                    <td className="px-6 py-4">0.5%</td>
                                    <td className="px-6 py-4">2.1%</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-green-500/10 text-green-600 rounded text-xs">Normal</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 font-mono text-sm">koreshield_attacks_detected</td>
                                    <td className="px-6 py-4">87</td>
                                    <td className="px-6 py-4">0.2/sec</td>
                                    <td className="px-6 py-4">8/sec</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-yellow-500/10 text-yellow-600 rounded text-xs">Monitoring</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
