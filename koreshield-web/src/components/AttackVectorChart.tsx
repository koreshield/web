import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AttackVectorData {
	name: string;
	value: number;
	color: string;
}

interface AttackVectorChartProps {
	data: Record<string, number>;
}

const ATTACK_VECTOR_COLORS: Record<string, string> = {
	'Prompt Injection': '#ef4444',
	'Data Exfiltration': '#f97316',
	'Jailbreak': '#eab308',
	'PII Leakage': '#3b82f6',
	'Malicious Code': '#8b5cf6',
	'Social Engineering': '#ec4899',
	'Other': '#6b7280'
};

export function AttackVectorChart({ data }: AttackVectorChartProps) {
	const chartData: AttackVectorData[] = Object.entries(data).map(([name, value]) => ({
		name,
		value,
		color: ATTACK_VECTOR_COLORS[name] || ATTACK_VECTOR_COLORS['Other']
	}));

	const total = chartData.reduce((sum, item) => sum + item.value, 0);

	return (
		<div className="bg-card border border-border rounded-lg p-6">
			<h3 className="text-lg font-semibold mb-4">Attack Vector Distribution</h3>

			{chartData.length === 0 ? (
				<div className="text-center py-12 text-muted-foreground">
					<p>No attack data available</p>
				</div>
			) : (
				<>
					<ResponsiveContainer width="100%" height={300}>
						<PieChart>
							<Pie
								data={chartData}
								cx="50%"
								cy="50%"
								labelLine={false}
								label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
								outerRadius={100}
								fill="#8884d8"
								dataKey="value"
							>
								{chartData.map((entry, index) => (
									<Cell key={`cell-${index}`} fill={entry.color} />
								))}
							</Pie>
							<Tooltip
								contentStyle={{
									backgroundColor: 'hsl(var(--card))',
									border: '1px solid hsl(var(--border))',
									borderRadius: '8px'
								}}
							/>
							<Legend />
						</PieChart>
					</ResponsiveContainer>

					<div className="mt-6 space-y-2">
						{chartData.map((item) => (
							<div key={item.name} className="flex items-center justify-between text-sm">
								<div className="flex items-center gap-2">
									<div
										className="w-3 h-3 rounded-full"
										style={{ backgroundColor: item.color }}
									/>
									<span>{item.name}</span>
								</div>
								<div className="flex items-center gap-3">
									<span className="font-semibold">{item.value}</span>
									<span className="text-muted-foreground">
										{((item.value / total) * 100).toFixed(1)}%
									</span>
								</div>
							</div>
						))}
					</div>
				</>
			)}
		</div>
	);
}
