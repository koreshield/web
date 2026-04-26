import { useState } from 'react';

interface ThreatLocation {
	id: string;
	coordinates: [number, number];
	country: string;
	threatType: string;
	severity: 'critical' | 'high' | 'medium' | 'low';
	timestamp: string;
}

interface ThreatMapProps {
	threats: ThreatLocation[];
	onMarkerClick?: (threat: ThreatLocation) => void;
}

export function ThreatMap({ threats, onMarkerClick }: ThreatMapProps) {
	const [hoveredThreat, setHoveredThreat] = useState<string | null>(null);

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case 'critical': return 'bg-red-500';
			case 'high': return 'bg-orange-500';
			case 'medium': return 'bg-yellow-500';
			case 'low': return 'bg-blue-500';
			default: return 'bg-gray-500';
		}
	};

	const getSeverityBorder = (severity: string) => {
		switch (severity) {
			case 'critical': return 'border-red-400';
			case 'high': return 'border-orange-400';
			case 'medium': return 'border-yellow-400';
			case 'low': return 'border-blue-400';
			default: return 'border-gray-400';
		}
	};

	return (
		<div className="w-full bg-gradient-to-b from-slate-950 to-black rounded-lg border border-slate-800 p-6">
			<div className="mb-6">
				<h3 className="text-lg font-semibold text-white mb-2">Threat Locations</h3>
				<p className="text-sm text-gray-400">Real-time visualization of detected threats by location:</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{threats && threats.length > 0 ? (
					threats.map((threat) => (
						<div
							key={threat.id}
							className={`p-4 rounded-lg border-2 ${getSeverityBorder(threat.severity)} bg-slate-900/50 cursor-pointer transition-all hover:bg-slate-800/70 ${
								hoveredThreat === threat.id ? 'ring-2 ring-electric-green' : ''
							}`}
							onMouseEnter={() => setHoveredThreat(threat.id)}
							onMouseLeave={() => setHoveredThreat(null)}
							onClick={() => onMarkerClick?.(threat)}
						>
							<div className="flex items-start justify-between mb-3">
								<div>
									<h4 className="font-semibold text-white">{threat.country}</h4>
									<p className="text-xs text-gray-400">{threat.coordinates.join(', ')}</p>
								</div>
								<span className={`px-2 py-1 rounded text-xs font-bold text-black ${getSeverityColor(threat.severity)}`}>
									{threat.severity.toUpperCase()}
								</span>
							</div>
							<div className="space-y-1 text-sm text-gray-300">
								<p><span className="text-gray-500">Type:</span> {threat.threatType}</p>
								<p><span className="text-gray-500">Time:</span> {new Date(threat.timestamp).toLocaleString()}</p>
							</div>
						</div>
					))
				) : (
					<div className="col-span-full text-center py-12">
						<p className="text-gray-400">No active threats detected</p>
					</div>
				)}
			</div>

			<div className="mt-6 pt-6 border-t border-slate-800">
				<p className="text-xs text-gray-500">
					Threat monitoring enables real-time detection and visualization of security incidents across your monitored resources.
				</p>
			</div>
		</div>
	);
}
