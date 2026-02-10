import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { useState } from 'react';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

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
			case 'critical': return '#ef4444';
			case 'high': return '#f97316';
			case 'medium': return '#eab308';
			case 'low': return '#3b82f6';
			default: return '#6b7280';
		}
	};

	const getSeveritySize = (severity: string) => {
		switch (severity) {
			case 'critical': return 8;
			case 'high': return 6;
			case 'medium': return 4;
			case 'low': return 3;
			default: return 2;
		}
	};

	return (
		<div className="relative w-full h-full bg-card rounded-lg border border-border overflow-hidden">
			<ComposableMap
				projection="geoMercator"
				projectionConfig={{
					scale: 147,
					center: [0, 20]
				}}
				className="w-full h-full"
			>
				<Geographies geography={geoUrl}>
					{({ geographies }: any) =>
						geographies.map((geo: any) => (
							<Geography
								key={geo.rsmKey}
								geography={geo}
								fill="hsl(var(--muted))"
								stroke="hsl(var(--border))"
								strokeWidth={0.5}
								style={{
									default: { outline: 'none' },
									hover: { outline: 'none', fill: 'hsl(var(--muted) / 0.8)' },
									pressed: { outline: 'none' }
								}}
							/>
						))
					}
				</Geographies>

				{threats.map((threat) => (
					<Marker
						key={threat.id}
						coordinates={threat.coordinates}
						onMouseEnter={() => setHoveredThreat(threat.id)}
						onMouseLeave={() => setHoveredThreat(null)}
						onClick={() => onMarkerClick?.(threat)}
						style={{ cursor: 'pointer' }}
					>
						<circle
							r={getSeveritySize(threat.severity)}
							fill={getSeverityColor(threat.severity)}
							fillOpacity={hoveredThreat === threat.id ? 1 : 0.7}
							stroke="#fff"
							strokeWidth={hoveredThreat === threat.id ? 2 : 1}
							className="transition-all duration-200"
						/>
						{hoveredThreat === threat.id && (
							<g>
								<circle
									r={getSeveritySize(threat.severity) + 4}
									fill={getSeverityColor(threat.severity)}
									fillOpacity={0.2}
									className="animate-ping"
								/>
							</g>
						)}
					</Marker>
				))}
			</ComposableMap>

			{hoveredThreat && threats.find(t => t.id === hoveredThreat) && (
				<div className="absolute bottom-4 left-4 bg-card border border-border rounded-lg p-3 shadow-lg max-w-xs">
					{(() => {
						const threat = threats.find(t => t.id === hoveredThreat)!;
						return (
							<>
								<div className="flex items-center gap-2 mb-1">
									<div
										className="w-3 h-3 rounded-full"
										style={{ backgroundColor: getSeverityColor(threat.severity) }}
									/>
									<span className="font-semibold text-sm">{threat.country}</span>
								</div>
								<p className="text-xs text-muted-foreground">{threat.threatType}</p>
								<p className="text-xs text-muted-foreground mt-1">
									Severity: <span className="capitalize">{threat.severity}</span>
								</p>
							</>
						);
					})()}
				</div>
			)}
		</div>
	);
}
