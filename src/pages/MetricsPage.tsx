import { useState } from 'react';
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
} from '../components/AppPageLayout';

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
		<AppPage>
			<AppPageHeader
				eyebrow="Observability"
				eyebrowIcon={Activity}
				title="Prometheus Metrics"
				description="Scrape-ready metrics from /metrics"
				icon={Activity}
			/>

			<AppCallout>
				<h2 className="mb-2 font-bold">How to use</h2>
				<p className="text-sm">
					Point your Prometheus or monitoring system at <code className="rounded bg-background/60 px-1">/metrics</code> on your Koreshield API.
					The endpoint returns standard Prometheus text format.
				</p>
			</AppCallout>

			<AppPageSection
				variant="card"
				title={error ? 'Metrics unavailable' : 'Latest metrics'}
				actions={
					<div className="flex gap-2">
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
			>
				<div className="mb-4 flex items-center gap-2">
					{error ? (
						<AlertTriangle className="h-5 w-5 text-red-500" />
					) : (
						<CheckCircle className="h-5 w-5 text-electric-green" />
					)}
					<span className="text-sm font-medium">
						{error ? 'Unable to reach the metrics endpoint' : 'Endpoint responding'}
					</span>
				</div>

				{isLoading ? (
					<AppPageLoading label="Loading metrics…" />
				) : error ? (
					<AppCallout variant="warning">
						Unable to load metrics. Ensure the API is reachable and the{' '}
						<code className="rounded bg-background/60 px-1">/metrics</code> endpoint is enabled.
					</AppCallout>
				) : (
					<AppSurface className="border-0 bg-background/55 p-0">
						<pre className="overflow-auto whitespace-pre-wrap rounded-2xl p-4 text-xs sm:text-sm">
							{metrics}
						</pre>
					</AppSurface>
				)}
			</AppPageSection>
		</AppPage>
	);
}
