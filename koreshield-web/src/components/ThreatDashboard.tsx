import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Activity, Lock } from 'lucide-react';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';
// import { api } from '../lib/api-client';

function generateData() {
    return Array.from({ length: 20 }, (_, i) => ({
        time: i,
        threats: Math.floor(Math.random() * 50) + 10,
        requests: Math.floor(Math.random() * 200) + 100
    }));
}

export function ThreatDashboard() {
    const [data, setData] = useState(generateData());
    const [blockedCount, setBlockedCount] = useState(12849);
    const [activeThreat, setActiveThreat] = useState<string | null>(null);

    useEffect(() => {
        // Use demo data for landing page showcase
        const updateDemo = () => {
            // Animate blocked count
            setBlockedCount(prev => prev + Math.floor(Math.random() * 5));

            // Randomly show threat alerts
            if (Math.random() > 0.7) {
                const threats = ["Prompt Injection", "Data Exfiltration", "Jailbreak Attempt", "PII Leakage"];
                const randomType = threats[Math.floor(Math.random() * threats.length)];
                setActiveThreat(randomType);
                setTimeout(() => setActiveThreat(null), 3000);
            }

            // Animate chart data
            setData(prev => {
                const newData = [...prev.slice(1), {
                    time: prev[prev.length - 1].time + 1,
                    threats: Math.floor(Math.random() * 50) + 10,
                    requests: Math.floor(Math.random() * 200) + 100
                }];
                return newData;
            });
        };

        const interval = setInterval(updateDemo, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-card border border-border rounded-lg p-6 w-full max-w-4xl mx-auto shadow-2xl">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Activity className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Live Threat Monitor</h3>
                        <p className="text-sm text-muted-foreground">Real-time infrastructure analysis</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="flex items-center gap-2 text-primary font-mono bg-primary/10 px-3 py-1 rounded-full text-xs animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        ACTIVE
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                    <div className="text-sm text-muted-foreground mb-1">Threats Blocked</div>
                    <div className="text-3xl font-bold font-mono">{blockedCount.toLocaleString()}</div>
                    <div className="text-xs text-primary mt-1 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> +12% last hour
                    </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                    <div className="text-sm text-muted-foreground mb-1">Avg Latency</div>
                    <div className="text-3xl font-bold font-mono">24ms</div>
                    <div className="text-xs text-primary mt-1 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Optimized
                    </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                    <div className="text-sm text-muted-foreground mb-1">Security Score</div>
                    <div className="text-3xl font-bold font-mono text-primary">A+</div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Audited
                    </div>
                </div>
            </div>

            <div className="h-64 w-full bg-muted/20 rounded-lg p-4 mb-6 border border-border relative overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '4px' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="requests" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="threats" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>

                <AnimatePresence>
                    {activeThreat && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute top-4 right-4 bg-red-900/90 text-white px-4 py-2 rounded-md border border-red-500 flex items-center gap-2 shadow-lg z-10"
                        >
                            <AlertTriangle className="w-4 h-4 animate-bounce" />
                            <span className="font-mono text-sm font-bold">{activeThreat}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
