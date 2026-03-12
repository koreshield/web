import { useState } from 'react';
import { Activity, Copy, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { useMetrics } from '../hooks/useApi';

export function MetricsPage() {
    const { data: metrics, isLoading, error } = useMetrics();
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!metrics) return;
        try {
            await navigator.clipboard.writeText(metrics);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy metrics', err);
        }
    };

    const handleDownload = () => {
        if (!metrics) return;
        const blob = new Blob([metrics], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'koreshield-metrics.prom';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Activity className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Prometheus Metrics</h1>
                            <p className="text-sm text-muted-foreground">
                                Scrape-ready metrics from <code>/metrics</code>
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-2">How to use</h2>
                    <p className="text-sm text-muted-foreground">
                        Point your Prometheus or monitoring system at <code>/metrics</code> on your KoreShield API.
                        The endpoint returns standard Prometheus text format.
                    </p>
                </div>

                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-b border-border">
                        <div className="flex items-center gap-2">
                            {error ? (
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            ) : (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                            <span className="font-medium">
                                {error ? 'Metrics unavailable' : 'Latest metrics'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCopy}
                                disabled={!metrics}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-muted border border-border rounded-lg text-sm hover:bg-muted/80 disabled:opacity-50"
                            >
                                <Copy className="w-4 h-4" />
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={!metrics}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {isLoading ? (
                            <div className="text-sm text-muted-foreground">Loading metrics...</div>
                        ) : error ? (
                            <div className="text-sm text-red-600">
                                Unable to load metrics. Ensure the API is reachable and the <code>/metrics</code>
                                endpoint is enabled.
                            </div>
                        ) : (
                            <pre className="text-xs sm:text-sm bg-muted/40 border border-border rounded-lg p-4 overflow-auto whitespace-pre-wrap">
                                {metrics}
                            </pre>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
