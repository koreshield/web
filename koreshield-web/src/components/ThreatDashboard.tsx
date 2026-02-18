import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertTriangle, Lock, Radio, Shield } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';

function generateData() {
    return Array.from({ length: 20 }, (_, i) => ({
        time: i,
        threats: Math.floor(Math.random() * 50) + 10,
        requests: Math.floor(Math.random() * 200) + 100
    }));
}

const THREAT_TYPES = [
    'Indirect Injection',
    'Prompt Injection',
    'Data Exfiltration',
    'Jailbreak Attempt',
    'PII Leakage',
    'Context Poisoning',
    'Instruction Override',
];

const CLIENT_TYPES = [
    'Healthcare Client',
    'FinTech Platform',
    'SaaS Provider',
    'E-Commerce API',
    'Legal AI Service',
    'EdTech Platform',
    'Insurance SaaS',
];

interface LogEntry {
    id: number;
    type: string;
    client: string;
    latency: number;
    timestamp: Date;
}

export function ThreatDashboard() {
    const [data, setData] = useState(generateData());
    const [blockedCount, setBlockedCount] = useState(12849);
    const [activeThreat, setActiveThreat] = useState<string | null>(null);
    const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
    const logIdRef = useRef(0);

    useEffect(() => {
        const updateDemo = () => {
            setBlockedCount(prev => prev + Math.floor(Math.random() * 5));

            if (Math.random() > 0.7) {
                const randomType = THREAT_TYPES[Math.floor(Math.random() * THREAT_TYPES.length)];
                setActiveThreat(randomType);
                setTimeout(() => setActiveThreat(null), 3000);
            }

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

    // Separate interval for log entries — faster feed
    useEffect(() => {
        const addLog = () => {
            logIdRef.current += 1;
            const entry: LogEntry = {
                id: logIdRef.current,
                type: THREAT_TYPES[Math.floor(Math.random() * THREAT_TYPES.length)],
                client: CLIENT_TYPES[Math.floor(Math.random() * CLIENT_TYPES.length)],
                latency: Math.floor(8 + Math.random() * 30),
                timestamp: new Date(),
            };
            setLogEntries(prev => [entry, ...prev].slice(0, 50));
        };

        // Seed initial entries
        for (let i = 0; i < 5; i++) {
            logIdRef.current += 1;
            const entry: LogEntry = {
                id: logIdRef.current,
                type: THREAT_TYPES[Math.floor(Math.random() * THREAT_TYPES.length)],
                client: CLIENT_TYPES[Math.floor(Math.random() * CLIENT_TYPES.length)],
                latency: Math.floor(8 + Math.random() * 30),
                timestamp: new Date(),
            };
            setLogEntries(prev => [entry, ...prev]);
        }

        const interval = setInterval(addLog, 2500 + Math.random() * 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-card border border-white/[0.08] rounded-2xl p-6 md:p-8 w-full max-w-5xl mx-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-lg">
                        <Activity className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold tracking-tight">Live Threat Monitor</h3>
                        <p className="text-sm text-muted-foreground">Real-time infrastructure analysis</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-primary font-mono bg-primary/10 px-3 py-1.5 rounded-full text-xs">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    ACTIVE
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3 md:gap-5 mb-8">
                <div className="bg-muted/50 p-4 md:p-5 rounded-lg border border-border">
                    <div className="text-xs md:text-sm text-muted-foreground mb-1">Threats Blocked</div>
                    <div className="text-2xl md:text-3xl font-bold font-mono tracking-tight">{blockedCount.toLocaleString()}</div>
                    <div className="text-xs text-primary mt-1.5 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> +12% last hour
                    </div>
                </div>
                <div className="bg-muted/50 p-4 md:p-5 rounded-lg border border-border">
                    <div className="text-xs md:text-sm text-muted-foreground mb-1">Avg Latency</div>
                    <div className="text-2xl md:text-3xl font-bold font-mono tracking-tight">24ms</div>
                    <div className="text-xs text-primary mt-1.5 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Optimized
                    </div>
                </div>
                <div className="bg-muted/50 p-4 md:p-5 rounded-lg border border-border">
                    <div className="text-xs md:text-sm text-muted-foreground mb-1">Security Score</div>
                    <div className="text-2xl md:text-3xl font-bold font-mono text-primary tracking-tight">A+</div>
                    <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Audited
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-56 md:h-64 w-full bg-muted/40 dark:bg-white/[0.03] rounded-xl p-4 mb-6 border border-white/[0.06] relative overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 8,
                                color: 'hsl(var(--popover-foreground))',
                                fontSize: 12,
                            }}
                            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        />
                        <Line type="monotone" dataKey="requests" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} dot={false} />
                        <Line type="monotone" dataKey="threats" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>

                <AnimatePresence>
                    {activeThreat && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -4 }}
                            className="absolute top-4 right-4 bg-red-900/90 text-white px-4 py-2 rounded-md border border-red-500 flex items-center gap-2 shadow-lg z-10"
                        >
                            <AlertTriangle className="w-4 h-4 animate-bounce" />
                            <span className="font-mono text-sm font-bold">{activeThreat}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Live Log Ticker */}
            <div className="border border-white/[0.08] rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 dark:bg-white/[0.03] border-b border-white/[0.06]">
                    <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Live Feed</span>
                </div>
                <div className="max-h-36 overflow-hidden relative">
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
                    <div className="divide-y divide-border">
                        <AnimatePresence initial={false}>
                            {logEntries.slice(0, 6).map((entry) => (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-mono"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 animate-pulse" />
                                    <span className="text-foreground font-semibold">Blocked</span>
                                    <span className="text-red-400">{entry.type}</span>
                                    <span className="text-muted-foreground hidden sm:inline">({entry.client})</span>
                                    <span className="ml-auto text-muted-foreground">{entry.latency}ms</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
