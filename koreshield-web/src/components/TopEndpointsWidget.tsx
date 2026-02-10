import { TrendingUp, Globe, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface EndpointData {
	endpoint: string;
	attackCount: number;
	lastAttack: string;
	severity: 'critical' | 'high' | 'medium' | 'low';
	blockedCount: number;
}

interface TopEndpointsWidgetProps {
	endpoints: EndpointData[];
	limit?: number;
}

export function TopEndpointsWidget({ endpoints, limit = 10 }: TopEndpointsWidgetProps) {
	const topEndpoints = endpoints.slice(0, limit);

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case 'critical': return 'text-red-500 bg-red-500/10';
			case 'high': return 'text-orange-500 bg-orange-500/10';
			case 'medium': return 'text-yellow-500 bg-yellow-500/10';
			case 'low': return 'text-blue-500 bg-blue-500/10';
			default: return 'text-gray-500 bg-gray-500/10';
		}
	};

	return (
		<div className="bg-card border border-border rounded-lg p-6">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold flex items-center gap-2">
					<Globe className="w-5 h-5" />
					Top Targeted Endpoints
				</h3>
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<TrendingUp className="w-4 h-4" />
					<span>Last 24h</span>
				</div>
			</div>

			{topEndpoints.length === 0 ? (
				<div className="text-center py-12 text-muted-foreground">
					<Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
					<p>No endpoint data available</p>
				</div>
			) : (
				<div className="space-y-3">
					{topEndpoints.map((endpoint, index) => (
						<div
							key={endpoint.endpoint}
							className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
						>
							<div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
								{index + 1}
							</div>

							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-1">
									<code className="text-sm font-mono truncate">{endpoint.endpoint}</code>
									<span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(endpoint.severity)}`}>
										{endpoint.severity}
									</span>
								</div>
								<div className="flex items-center gap-4 text-xs text-muted-foreground">
									<span>Last: {format(new Date(endpoint.lastAttack), 'MMM dd, HH:mm')}</span>
									<span>{endpoint.blockedCount} blocked</span>
								</div>
							</div>

							<div className="text-right">
								<div className="text-2xl font-bold">{endpoint.attackCount}</div>
								<div className="text-xs text-muted-foreground">attacks</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
