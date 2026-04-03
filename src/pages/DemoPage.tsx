import * as LucideIcons from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/ToastNotification';
import { api } from '../lib/api-client';
import { authService } from '../lib/auth';
import { PRESET_ATTACKS, type ThreatLogEntry, type ThreatResult, type ThreatSignal } from '../lib/threat-engine';

const Icon = ({ name, className }: { name: string; className?: string }) => {
	const LucideIcon = (LucideIcons as any)[name];
	if (!LucideIcon) return null;
	return <LucideIcon className={className} />;
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ScanState = 'idle' | 'scanning' | 'done';

type ScanApiIndicator = {
	type: string;
	severity: string;
	confidence: number;
	description: string;
	metadata?: Record<string, any>;
};

type ScanApiResult = {
	is_safe: boolean;
	threat_level: string;
	confidence: number;
	indicators: ScanApiIndicator[];
	processing_time_ms: number;
	metadata: Record<string, any>;
	scan_id?: string;
};

type ScanApiResponse = {
	result: ScanApiResult;
	request_id: string;
	timestamp: string;
	version: string;
};

const threatLevelToSeverity: Record<string, ThreatResult['severity']> = {
	safe: 'none',
	low: 'low',
	medium: 'medium',
	high: 'high',
	critical: 'critical',
};

const indicatorTypeToCategory: Record<string, ThreatResult['category']> = {
	keyword: 'Prompt Injection',
	rule: 'Prompt Injection',
	blocklist: 'Data Exfiltration',
	allowlist: 'Clean',
	ml: 'Adversarial Input',
	code_block_injection: 'Prompt Injection',
	role_manipulation: 'Jailbreak Attempt',
	encoding_attempt: 'Payload Obfuscation',
	prompt_leaking: 'System Prompt Leak',
	data_exfiltration: 'Data Exfiltration',
};

const mapConfidenceLevel = (confidence: number): ThreatResult['confidence'] => {
	if (confidence >= 0.9) return 'definite';
	if (confidence >= 0.75) return 'high';
	if (confidence >= 0.5) return 'moderate';
	return 'low';
};

const remediationBySeverity: Record<ThreatResult['severity'], string> = {
	critical: 'Block the request, isolate the payload, and require a new user session. Audit downstream access immediately.',
	high: 'Block the request and require re-authentication or a clean prompt rewrite before retrying.',
	medium: 'Require user confirmation and sanitize prompt/context before forwarding.',
	low: 'Log the signal and allow with monitoring. Consider adding a policy rule if it repeats.',
	none: 'No remediation required. Continue monitoring with standard policies.',
};

const mitreRefBySeverity: Record<ThreatResult['severity'], string> = {
	critical: 'ATLAS AML.T0051',
	high: 'ATLAS AML.T0051',
	medium: 'ATLAS AML.T0051',
	low: 'ATLAS AML.T0000',
	none: 'ATLAS AML.T0000',
};

const buildThreatResult = (scan: ScanApiResult): ThreatResult => {
	const indicators = scan.indicators || [];
	const severity = threatLevelToSeverity[scan.threat_level] || (scan.is_safe ? 'none' : 'low');
	const signals: ThreatSignal[] = indicators.map((indicator, index) => {
		const rawType = indicator.metadata?.type || indicator.type;
		const category = indicatorTypeToCategory[rawType] || indicatorTypeToCategory[indicator.type] || (scan.is_safe ? 'Clean' : 'Adversarial Input');
		const ruleId = indicator.metadata?.rule_id || indicator.metadata?.keyword || `KRS-${String(index + 1).padStart(3, '0')}`;
		return {
			ruleId,
			category,
			severity,
			score: Math.round((indicator.confidence ?? scan.confidence) * 100),
			matchedPattern: indicator.description || indicator.type,
			explanation: `Matched indicator: ${indicator.description || indicator.type}.`,
			remediation: remediationBySeverity[severity],
			mitreRef: mitreRefBySeverity[severity],
		};
	});

	const primarySignal = signals[0];
	const scanIdShort = scan.scan_id ? `SCAN-${scan.scan_id.slice(0, 6).toUpperCase()}` : 'SCAN-000';

	return {
		blocked: !scan.is_safe,
		category: primarySignal?.category || (scan.is_safe ? 'Clean' : 'Adversarial Input'),
		severity,
		score: Math.round(scan.confidence * 100),
		confidence: mapConfidenceLevel(scan.confidence),
		explanation: scan.is_safe
			? 'No threats detected. Prompt cleared for downstream processing.'
			: `Detected ${signals.length} indicator${signals.length === 1 ? '' : 's'} across ${scan.threat_level} severity.`,
		matchedPattern: primarySignal?.matchedPattern || null,
		processingMs: Math.round(scan.processing_time_ms),
		ruleId: primarySignal?.ruleId || scanIdShort,
		signalCount: signals.length,
		signals,
		remediation: remediationBySeverity[severity],
		mitreRef: mitreRefBySeverity[severity],
		entropyFlag: indicators.some((indicator) => indicator.type === 'ml' || indicator.metadata?.type === 'ml_detection'),
	};
};

// ─── Severity Badge ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
	const map: Record<string, string> = {
		critical: 'bg-red-600 text-white',
		high: 'bg-orange-500 text-white',
		medium: 'bg-yellow-500 text-black',
		low: 'bg-blue-500 text-white',
		none: 'bg-emerald-600 text-white',
	};
	return (
		<span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${map[severity] || 'bg-muted text-foreground'}`}>
			{severity === 'none' ? 'CLEAN' : severity}
		</span>
	);
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, blocked }: { score: number; blocked: boolean }) {
	const r = 40;
	const circ = 2 * Math.PI * r;
	const dash = circ * (score / 100);
	const color = blocked ? (score > 85 ? '#ef4444' : score > 65 ? '#f97316' : '#eab308') : '#10b981';

	return (
		<div className="relative flex items-center justify-center mx-auto" style={{ width: 100, height: 100 }}>
			<svg width="100" height="100" className="-rotate-90">
				<circle cx="50" cy="50" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
				<circle
					cx="50" cy="50" r={r} fill="none"
					stroke={color} strokeWidth="8"
					strokeDasharray={`${dash} ${circ - dash}`}
					strokeLinecap="round"
					style={{ transition: 'stroke-dasharray 0.8s ease' }}
				/>
			</svg>
			<div className="absolute text-center">
				<div className="text-2xl font-bold" style={{ color }}>{score}</div>
				<div className="text-xs text-slate-400 uppercase tracking-widest">Score</div>
			</div>
		</div>
	);
}

// ─── Scanning Animation ───────────────────────────────────────────────────────

function ScanAnimation() {
	return (
		<div className="relative w-full h-1 bg-slate-800 rounded overflow-hidden">
			<div
				className="absolute top-0 left-0 h-full w-1/3 rounded"
				style={{
					background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
					animation: 'scan 1.2s ease-in-out infinite',
				}}
			/>
		</div>
	);
}

// ─── Firewall Pane ────────────────────────────────────────────────────────────

function FirewallPane({ result, state }: { result: ThreatResult | null; state: ScanState }) {
	return (
		<div className="flex flex-col h-full bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden">
			{/* Header */}
			<div className="px-5 py-4 border-b border-slate-700/50 flex items-center gap-3">
				<div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
				<span className="text-sm font-semibold text-slate-200">KoreShield Firewall</span>
				<span className="ml-auto text-xs text-slate-500 font-mono">v3.0.0</span>
			</div>

			<div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-8">
				{state === 'idle' && (
					<div className="text-center space-y-3">
						<div className="w-16 h-16 mx-auto rounded-full border-2 border-slate-700 flex items-center justify-center">
							<svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
									d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-2.069-.524-4.02-1.453-5.722A11.955 11.955 0 0112 2.964z" />
							</svg>
						</div>
						<p className="text-slate-400 text-sm">Awaiting input<br />Send a prompt to begin analysis</p>
					</div>
				)}

				{state === 'scanning' && (
					<div className="w-full text-center space-y-5">
						<div className="w-16 h-16 mx-auto relative">
							<div className="w-full h-full rounded-full border-2 border-blue-500/30 animate-ping absolute" />
							<div className="w-full h-full rounded-full border-2 border-blue-500 flex items-center justify-center">
								<svg className="w-6 h-6 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
								</svg>
							</div>
						</div>
						<p className="text-blue-400 text-sm font-mono">Analyzing threat signatures...</p>
						<ScanAnimation />
						<div className="grid grid-cols-2 gap-2 text-xs text-slate-500 font-mono text-left">
							{['Prompt Injection → Checking', 'Jailbreak Patterns → Checking', 'Token Smuggling → Checking', 'Privilege Escalation → Checking', 'Social Engineering → Checking', 'Entropy Analysis → Running'].map(t => (
								<div key={t} className="flex items-center gap-1.5">
									<div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
									{t}
								</div>
							))}
						</div>
					</div>
				)}

				{state === 'done' && result && (
					<div className="w-full space-y-5 text-center">
						{/* Block / Allow Banner */}
						<div className={`rounded-xl px-4 py-3 border ${result.blocked
							? 'border-red-500/40 bg-red-500/10'
							: 'border-emerald-500/40 bg-emerald-500/10'}`}>
							<div className={`text-2xl font-bold flex items-center justify-center gap-2 ${result.blocked ? 'text-red-400' : 'text-emerald-400'}`}>
								{result.blocked ? (
									<><LucideIcons.XCircle className="w-6 h-6" /> BLOCKED</>
								) : (
									<><LucideIcons.CheckCircle2 className="w-6 h-6" /> ALLOWED</>
								)}
							</div>
							<div className={`text-xs mt-1 font-mono ${result.blocked ? 'text-red-400/70' : 'text-emerald-400/70'}`}>
								Rule {result.ruleId} • {result.processingMs}ms • {result.signalCount} signal{result.signalCount !== 1 ? 's' : ''}
							</div>
						</div>

						{/* Score Ring */}
						<ScoreRing score={result.score} blocked={result.blocked} />

						{/* Category + Severity + Confidence */}
						<div className="space-y-2">
							<div className="text-slate-200 font-semibold">{result.category}</div>
							<div className="flex items-center justify-center gap-2 flex-wrap">
								<SeverityBadge severity={result.severity} />
								<span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${result.confidence === 'definite' ? 'bg-blue-600 text-white' :
									result.confidence === 'high' ? 'bg-sky-600 text-white' :
										result.confidence === 'moderate' ? 'bg-slate-600 text-white' :
											'bg-slate-700 text-slate-300'
									}`}>{result.confidence}</span>
								{result.entropyFlag && (
									<span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-600 text-white uppercase tracking-wider flex items-center gap-1">
										<LucideIcons.AlertTriangle className="w-3.5 h-3.5" /> High Entropy
									</span>
								)}
							</div>
						</div>

						{/* Explanation */}
						<p className="text-slate-400 text-xs leading-relaxed text-left bg-slate-800/40 rounded-lg p-3 border border-slate-700/40">
							{result.explanation}
						</p>

						{/* Remediation + MITRE Ref */}
						{result.blocked && (
							<div className="text-left space-y-2">
								<div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
									<div className="text-[10px] text-blue-400 uppercase tracking-widest font-bold mb-1">Remediation</div>
									<p className="text-slate-400 text-xs leading-relaxed">{result.remediation}</p>
								</div>
								<div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
									<span>Ref: {result.mitreRef}</span>
									{result.signalCount > 1 && (
										<span className="text-amber-400">• {result.signalCount} cross-category signals detected</span>
									)}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

// ─── Threat Log Pane ──────────────────────────────────────────────────────────

function ThreatLogPane({ entries }: { entries: ThreatLogEntry[] }) {
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [entries]);

	return (
		<div className="flex flex-col h-full bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden">
			<div className="px-5 py-4 border-b border-slate-700/50 flex items-center gap-3">
				<div className="w-2 h-2 rounded-full bg-emerald-500" />
				<span className="text-sm font-semibold text-slate-200">Threat Log</span>
				<span className="ml-auto text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
					{entries.length} events
				</span>
			</div>

			<div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs">
				{entries.length === 0 && (
					<div className="text-slate-600 text-center mt-8">No events yet</div>
				)}
				{entries.map((entry) => (
					<div
						key={entry.id}
						className={`rounded-lg border p-3 space-y-1.5 transition-all ${entry.blocked
							? 'border-red-500/30 bg-red-500/5'
							: 'border-emerald-500/30 bg-emerald-500/5'}`}
					>
						<div className="flex items-center justify-between">
							<span className={entry.blocked ? 'text-red-400 font-bold flex items-center gap-1.5' : 'text-emerald-400 font-bold flex items-center gap-1.5'}>
								{entry.blocked ? <><LucideIcons.XCircle className="w-3.5 h-3.5" /> BLOCKED</> : <><LucideIcons.CheckCircle2 className="w-3.5 h-3.5" /> ALLOWED</>}
							</span>
							<span className="text-slate-600 text-[10px]">
								{entry.timestamp.toLocaleTimeString()}
							</span>
						</div>
						<div className="text-slate-300 truncate" title={entry.prompt}>
							{entry.prompt}
						</div>
						<div className="flex items-center gap-2">
							<span className="text-slate-500">{entry.category}</span>
							<span className="text-slate-600">•</span>
							<span className={`${entry.blocked ? 'text-red-400' : 'text-emerald-400'}`}>
								Score: {entry.score}
							</span>
							<span className="text-slate-600 ml-auto">{entry.ruleId}</span>
						</div>
					</div>
				))}
				<div ref={bottomRef} />
			</div>
		</div>
	);
}

// ─── Chat Pane ────────────────────────────────────────────────────────────────

function ChatPane({
	onSubmit,
	isScanning,
	disabled,
}: {
	onSubmit: (prompt: string) => void;
	isScanning: boolean;
	disabled: boolean;
}) {
	const [input, setInput] = useState('');

	const handleSubmit = () => {
		const trimmed = input.trim();
		if (!trimmed || isScanning || disabled) return;
		onSubmit(trimmed);
		setInput('');
	};

	return (
		<div className="flex flex-col h-full bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden">
			<div className="px-5 py-4 border-b border-slate-700/50 flex items-center gap-3">
				<div className="w-2 h-2 rounded-full bg-violet-500" />
				<span className="text-sm font-semibold text-slate-200">LLM Prompt Input</span>
			</div>

			<div className="flex-1 flex flex-col p-4 gap-4">
				{/* Preset Attacks */}
				<div>
					<p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Try a preset attack</p>
					<div className="flex flex-wrap gap-2">
						{PRESET_ATTACKS.map((preset) => (
							<button
								key={preset.label}
								disabled={isScanning || disabled}
								onClick={() => onSubmit(preset.prompt)}
								className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 ${preset.color}`}
							>
								{preset.iconName && <Icon name={preset.iconName} className="w-3.5 h-3.5" />}
								{preset.label}
							</button>
						))}
					</div>
				</div>

				{/* Text Input */}
				<div className="flex-1 flex flex-col gap-3">
					<p className="text-xs text-slate-500 uppercase tracking-wider">Or type your own</p>
					<textarea
						className="flex-1 w-full bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-600 font-mono"
						placeholder="Enter any prompt to test... Try 'Ignore all previous instructions' or 'SELECT * FROM users WHERE 1=1'"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
						}}
						disabled={disabled}
					/>
					<button
						onClick={handleSubmit}
						disabled={!input.trim() || isScanning || disabled}
						className="w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
						style={{
							background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
							color: 'white',
						}}
					>
						{isScanning ? (
							<span className="flex items-center justify-center gap-2">
								<svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
								</svg>
								Scanning...
							</span>
						) : (
							<span className="flex items-center justify-center gap-2">
								<LucideIcons.Zap className="w-4 h-4" /> Analyze Threat (Ctrl+Enter)
							</span>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}

// ─── Demo Page ────────────────────────────────────────────────────────────────

export default function DemoPage() {
	const [scanState, setScanState] = useState<ScanState>('idle');
	const [currentResult, setCurrentResult] = useState<ThreatResult | null>(null);
	const [log, setLog] = useState<ThreatLogEntry[]>([]);
	const [stats, setStats] = useState({ total: 0, blocked: 0, allowed: 0 });
	const { error: showError, info } = useToast();
	const isAuthenticated = authService.isAuthenticated();

	const handlePrompt = useCallback(async (prompt: string) => {
		if (scanState === 'scanning') return;
		if (!authService.isAuthenticated()) {
			showError('Sign in required', 'Log in to run a live scan against your KoreShield tenant.');
			return;
		}

		setScanState('scanning');
		setCurrentResult(null);

		try {
			const response = await api.scanText(prompt);
			const scanResponse = response as ScanApiResponse;
			const result = buildThreatResult(scanResponse.result);
			setCurrentResult(result);
			setScanState('done');

			const entry: ThreatLogEntry = {
				...result,
				id: crypto.randomUUID(),
				prompt,
				timestamp: new Date(),
			};

			setLog((prev) => [...prev, entry]);
			setStats((prev) => ({
				total: prev.total + 1,
				blocked: prev.blocked + (result.blocked ? 1 : 0),
				allowed: prev.allowed + (result.blocked ? 0 : 1),
			}));
		} catch (err) {
			setScanState('idle');
			setCurrentResult(null);
			info('Scan failed', 'The API could not complete the scan. Check your session and try again.');
			console.error('Scan failed', err);
		}
	}, [scanState, showError, info]);

	return (
		<div className="min-h-screen bg-slate-950 text-white">
			<style>{`
        @keyframes scan {
          0% { left: -33%; }
          100% { left: 100%; }
        }
      `}</style>

			{/* Top Bar */}
			<div className="border-b border-slate-800/80 px-4 md:px-6 py-3 md:py-4 flex flex-wrap items-center gap-3">
				<Link to="/" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm shrink-0">
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
					<span className="hidden sm:inline">Back to site</span>
				</Link>
				<div className="w-px h-4 bg-slate-700 hidden sm:block" />
				<div className="flex items-center gap-2 shrink-0">
					<img src="/logo/SVG/White.svg" alt="KoreShield Logo" className="w-5 h-5 md:w-6 md:h-6" />
					<span className="text-sm font-semibold text-slate-200">KoreShield Live Demo</span>
				</div>
				<div className="ml-auto flex items-center gap-2 md:gap-3 text-xs shrink-0">
					<div className="flex items-center gap-1.5 text-emerald-400">
						<div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
						<span className="hidden sm:inline">Firewall Active</span>
					</div>
					<div className={`flex items-center gap-1.5 ${isAuthenticated ? 'text-emerald-400' : 'text-amber-300'}`}>
						<div className={`w-1.5 h-1.5 rounded-full ${isAuthenticated ? 'bg-emerald-400' : 'bg-amber-300'}`} />
						<span className="hidden sm:inline">{isAuthenticated ? 'Session Authenticated' : 'Guest Session'}</span>
					</div>
					<div className="flex items-center gap-2 md:gap-4 text-slate-500 font-mono">
						<span><span className="text-white font-bold">{stats.total}</span> <span className="hidden sm:inline">Total</span></span>
						<span><span className="text-red-400 font-bold">{stats.blocked}</span> <span className="hidden sm:inline">Blocked</span></span>
						<span><span className="text-emerald-400 font-bold">{stats.allowed}</span> <span className="hidden sm:inline">Allowed</span></span>
					</div>
				</div>
			</div>

			{/* Hero */}
			<div className="text-center py-8 md:py-10 px-4 md:px-6">
				<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-electric-green/30 bg-electric-green/10 text-electric-green text-xs font-medium mb-4">
					<div className="w-1.5 h-1.5 rounded-full bg-electric-green animate-pulse" />
					Live API Demo  -  Login required for scans
				</div>
				<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 text-foreground">
					See KoreShield Stop Real AI Attacks
				</h1>
				<p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto">
					Type any prompt below or pick a preset attack. Watch the firewall intercept threats in real time against your tenant policies.
				</p>
				{!isAuthenticated && (
					<p className="text-amber-300 text-sm mt-4">
						Sign in to enable live scans. Guest mode keeps the UI visible but disables API calls.
					</p>
				)}
			</div>

			{/* 3-Pane Layout */}
			<div className="max-w-7xl mx-auto px-6 pb-12">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: '540px' }}>
					<ChatPane onSubmit={handlePrompt} isScanning={scanState === 'scanning'} disabled={!isAuthenticated} />
					<FirewallPane result={currentResult} state={scanState} />
					<ThreatLogPane entries={log} />
				</div>

				{/* Footer CTA */}
				<div className="mt-10 text-center py-8 px-4 md:px-6 rounded-2xl border border-white/10 bg-white/[0.03]">
					<p className="text-foreground font-semibold text-base md:text-lg mb-2">Ready to protect your AI app in production?</p>
					<p className="text-muted-foreground text-sm mb-5">KoreShield installs in under 5 minutes. No infrastructure changes required.</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
						<Link
							to="/signup"
							className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm bg-electric-green hover:bg-emerald-bright text-white transition-all hover:scale-105 text-center"
						>
							Get Started →
						</Link>
						<Link
							to="/contact"
							className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm border border-white/20 text-foreground hover:border-white/40 transition-all text-center"
						>
							Talk to Sales
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
