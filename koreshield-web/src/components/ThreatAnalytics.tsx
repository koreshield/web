import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Shield, AlertTriangle, TrendingUp } from 'lucide-react';

interface ThreatData {
    name: string;
    value: number;
}

interface ThreatTypeBreakdownProps {
    data: Record<string, number>;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6'];

export function ThreatTypeBreakdown({ data }: ThreatTypeBreakdownProps) {
    const chartData: ThreatData[] = Object.entries(data).map(([name, value]) => ({
        name,
        value,
    }));

    const total = chartData.reduce((acc, item) => acc + item.value, 0);

    if (total === 0) {
        return (
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Threat Type Distribution</h3>
                        <p className="text-sm text-muted-foreground">No threats detected yet</p>
                    </div>
                </div>
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                        <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>All systems secure</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">Threat Type Distribution</h3>
                    <p className="text-sm text-muted-foreground">{total.toLocaleString()} total threats detected</p>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                {chartData.map((item, index) => (
                    <div key={item.name} className="bg-muted/50 p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-2 mb-1">
                            <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-xs text-muted-foreground">{item.name}</span>
                        </div>
                        <div className="text-lg font-bold">{item.value.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                            {((item.value / total) * 100).toFixed(1)}% of total
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface TimelineData {
    timestamp: string;
    count: number;
}

interface ThreatTimelineProps {
    attacks: Array<{
        timestamp: string;
        threat_type: string;
    }>;
}

export function ThreatTimeline({ attacks }: ThreatTimelineProps) {
    // Group attacks by hour
    const hourlyData = attacks.reduce((acc, attack) => {
        const hour = new Date(attack.timestamp).getHours();
        const key = `${hour}:00`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const timelineData: TimelineData[] = Array.from({ length: 24 }, (_, i) => {
        const key = `${i}:00`;
        return {
            timestamp: key,
            count: hourlyData[key] || 0,
        };
    });

    const maxCount = Math.max(...timelineData.map(d => d.count), 1);

    return (
        <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">24-Hour Threat Timeline</h3>
                    <p className="text-sm text-muted-foreground">Hourly attack distribution</p>
                </div>
            </div>

            <div className="space-y-2">
                {timelineData.map((item) => (
                    <div key={item.timestamp} className="flex items-center gap-3">
                        <div className="w-16 text-xs text-muted-foreground font-mono">
                            {item.timestamp}
                        </div>
                        <div className="flex-1">
                            <div className="bg-muted/30 rounded-full h-6 relative overflow-hidden">
                                <div
                                    className="bg-primary h-full rounded-full transition-all duration-300"
                                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                                />
                                {item.count > 0 && (
                                    <div className="absolute inset-0 flex items-center px-3 text-xs font-medium text-foreground">
                                        {item.count} {item.count === 1 ? 'threat' : 'threats'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface ThreatSummaryProps {
    totalRequests: number;
    blockedRequests: number;
    attacksDetected: number;
    topThreatType: string;
}

export function ThreatSummary({ totalRequests, blockedRequests, attacksDetected, topThreatType }: ThreatSummaryProps) {
    const blockRate = totalRequests > 0 ? (blockedRequests / totalRequests) * 100 : 0;

    return (
        <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">Security Summary</h3>
                    <p className="text-sm text-muted-foreground">Current period overview</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                    <div className="text-sm text-muted-foreground mb-1">Block Rate</div>
                    <div className="text-3xl font-bold">{blockRate.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {blockedRequests.toLocaleString()} of {totalRequests.toLocaleString()} requests
                    </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                    <div className="text-sm text-muted-foreground mb-1">Attacks Detected</div>
                    <div className="text-3xl font-bold text-red-500">{attacksDetected.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        Identified threats
                    </div>
                </div>

                <div className="col-span-2 bg-muted/50 p-4 rounded-lg border border-border">
                    <div className="text-sm text-muted-foreground mb-1">Top Threat Type</div>
                    <div className="text-xl font-bold">{topThreatType || 'None'}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        Most common attack pattern
                    </div>
                </div>
            </div>

            <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                        <div className="font-medium text-sm mb-1">Security Status: Active</div>
                        <div className="text-xs text-muted-foreground">
                            All protection layers are operational. Real-time monitoring and threat detection enabled.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
