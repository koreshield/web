import { useMemo, useState } from 'react';
import { Activity, Copy, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { useMetrics } from '../hooks/useApi';
import {
	AppPage,
	AppPageHeader,
	AppPageSection,
	AppCallout,
	AppPrimaryButton,
	AppSecondaryButton,
	AppSurface,
	AppPageLoading,
	AppStatGrid,
	AppStatCard,
} from '../components/AppPageLayout';

export function MetricsPage() {
	const { data: metrics, isLoading, error } = useMetrics();
	const [copied, setCopied] = useState(false);

	const metricLineCount = useMemo(() => {
		if (!metrics) return 0;
		return metrics.split('\n').filter((line) => line.trim().length > 0).length;
	}, [metrics]);

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
		<AppPage>
			<AppPageHeader
				eyebrow="Observability"
				eyebrowIcon={Activity}
				title="Prometheus Metrics"
				description="Scrape-ready metrics from your Koreshield API endpoint."
				icon={Activity}
				actions={
					<div className="flex flex-wrap gap-2">
						<AppSecondaryButton onClick={handleCopy} disabled={!metrics}>
							<Copy className="h-4 w-4" />
							{copied ? 'Copied' : 'Copy'}
						</AppSecondaryButton>
						<AppPrimaryButton onClick={handleDownload} disabled={!metrics}>
							<Download className="h-4 w-4" />
							Download
						</AppPrimaryButton>
					</div>
				}
			/>

			<AppStatGrid columns={3}>
				<AppStatCard
					label="Endpoint"
					value="/metrics"
					icon={Activity}
					detail="Prometheus text exposition format"
				/>
				<AppStatCard
					label="Status"
					value={error ? 'Unavailable' : isLoading ? 'Loading' : 'Live'}
					icon={error ? AlertTriangle : CheckCircle}
					tone={error ? 'text-red-400' : 'text-electric-green'}
				/>
				<AppStatCard
					label="Series lines"
					value={metricLineCount || '—'}
					icon={Activity}
					detail="Non-empty metric lines in latest scrape"
				/>
			</AppStatGrid>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
				<AppCallout>
					<h2 className="mb-2 font-bold">How to scrape</h2>
					<p className="text-sm leading-6">
						Point Prometheus or Grafana Alloy at{' '}
						<code className="rounded bg-background/60 px-1">/metrics</code>{' '}
						on your Koreshield API host. The response is standard Prometheus text format.
					</p>
					<pre className="mt-4 overflow-x-auto rounded-xl bg-background/55 p-3 text-[11px] text-muted-foreground">
{`scrape_configs:
  - job_name: koreshield
    metrics_path: /metrics
    static_configs:
      - targets: ['api.koreshield.com']`}
					</pre>
				</AppCallout>

				<AppPageSection variant="card" title="Latest scrape">
					{isLoading ? (
						<AppPageLoading label="Loading metrics…" />
					) : error ? (
						<AppCallout variant="warning">
							Unable to load metrics. Ensure the API is reachable and the{' '}
							<code className="rounded bg-background/60 px-1">/metrics</code> endpoint is enabled.
						</AppCallout>
					) : (
						<AppSurface className="max-h-[32rem] overflow-auto border-0 bg-background/55 p-0">
							<pre className="whitespace-pre-wrap p-4 text-xs sm:text-sm">{metrics}</pre>
						</AppSurface>
					)}
				</AppPageSection>
			</div>
		</AppPage>
	);
}
