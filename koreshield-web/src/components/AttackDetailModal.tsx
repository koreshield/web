import { X, AlertTriangle, Shield, Clock, User, Code } from 'lucide-react';
import { format } from 'date-fns';

interface AttackDetail {
    id: string;
    timestamp: string;
    threat_type: string;
    confidence: number;
    content_preview: string;
    action_taken: 'blocked' | 'warned';
    user_id?: string;
    provider?: string;
    model?: string;
    metadata?: Record<string, any>;
}

interface AttackDetailModalProps {
    attack: AttackDetail | null;
    isOpen: boolean;
    onClose: () => void;
}

export function AttackDetailModal({ attack, isOpen, onClose }: AttackDetailModalProps) {
    if (!isOpen || !attack) return null;

    const severityColor = attack.confidence >= 0.9 ? 'text-red-500' : attack.confidence >= 0.7 ? 'text-orange-500' : 'text-yellow-500';
    const actionColor = attack.action_taken === 'blocked' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${attack.action_taken === 'blocked' ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
                            {attack.action_taken === 'blocked' ? (
                                <AlertTriangle className={`w-6 h-6 ${severityColor}`} />
                            ) : (
                                <Shield className="w-6 h-6 text-yellow-500" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{attack.threat_type}</h2>
                            <p className="text-sm text-muted-foreground">Attack ID: {attack.id}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {/* Status and Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Shield className="w-4 h-4" />
                                Action
                            </div>
                            <div className={`text-sm font-medium px-3 py-1 rounded-full ${actionColor} inline-block`}>
                                {attack.action_taken.toUpperCase()}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" />
                                Confidence
                            </div>
                            <div className={`text-lg font-bold ${severityColor}`}>
                                {(attack.confidence * 100).toFixed(1)}%
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Detected
                            </div>
                            <div className="text-sm font-mono">
                                {format(new Date(attack.timestamp), 'HH:mm:ss')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {format(new Date(attack.timestamp), 'MMM dd, yyyy')}
                            </div>
                        </div>

                        {attack.user_id && (
                            <div className="space-y-1">
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    User ID
                                </div>
                                <div className="text-sm font-mono truncate">
                                    {attack.user_id}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content Preview */}
                    <div className="space-y-2">
                        <div className="text-sm font-semibold flex items-center gap-2">
                            <Code className="w-4 h-4" />
                            Content Preview
                        </div>
                        <div className="bg-muted/50 p-4 rounded-lg border border-border font-mono text-sm">
                            <pre className="whitespace-pre-wrap break-words">{attack.content_preview}</pre>
                        </div>
                    </div>

                    {/* Provider Info */}
                    {(attack.provider || attack.model) && (
                        <div className="space-y-2">
                            <div className="text-sm font-semibold">Provider Information</div>
                            <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg border border-border">
                                {attack.provider && (
                                    <div>
                                        <div className="text-xs text-muted-foreground">Provider</div>
                                        <div className="text-sm font-medium">{attack.provider}</div>
                                    </div>
                                )}
                                {attack.model && (
                                    <div>
                                        <div className="text-xs text-muted-foreground">Model</div>
                                        <div className="text-sm font-medium">{attack.model}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    {attack.metadata && Object.keys(attack.metadata).length > 0 && (
                        <div className="space-y-2">
                            <div className="text-sm font-semibold">Additional Metadata</div>
                            <div className="bg-muted/50 p-4 rounded-lg border border-border">
                                <pre className="text-xs font-mono overflow-x-auto">
                                    {JSON.stringify(attack.metadata, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Threat Analysis */}
                    <div className="space-y-2">
                        <div className="text-sm font-semibold">Threat Analysis</div>
                        <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-3">
                            <div>
                                <div className="text-xs text-muted-foreground mb-1">Detection Pattern</div>
                                <div className="text-sm">{getThreatDescription(attack.threat_type)}</div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground mb-1">Risk Assessment</div>
                                <div className="text-sm">{getRiskAssessment(attack.confidence)}</div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground mb-1">Recommended Action</div>
                                <div className="text-sm">{getRecommendedAction(attack.action_taken)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(attack, null, 2));
                        }}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        Copy Details
                    </button>
                </div>
            </div>
        </div>
    );
}

function getThreatDescription(threatType: string): string {
    const descriptions: Record<string, string> = {
        'Prompt Injection': 'Attempt to manipulate model behavior through malicious prompts',
        'Jailbreak': 'Attempt to bypass safety guidelines and content policies',
        'SQL Injection': 'Malicious SQL code injection attempt detected',
        'PII Leakage': 'Potential exposure of personally identifiable information',
        'Code Injection': 'Attempt to inject and execute arbitrary code',
        'XSS': 'Cross-site scripting vulnerability exploitation attempt',
    };
    return descriptions[threatType] || 'Potentially malicious content detected';
}

function getRiskAssessment(confidence: number): string {
    if (confidence >= 0.9) return 'Critical - Immediate action required';
    if (confidence >= 0.7) return 'High - Requires attention';
    if (confidence >= 0.5) return 'Medium - Monitor closely';
    return 'Low - Review as needed';
}

function getRecommendedAction(actionTaken: string): string {
    if (actionTaken === 'blocked') {
        return 'Request was blocked. Review user patterns and consider additional security measures.';
    }
    return 'Request was flagged but allowed. Monitor for follow-up suspicious activity.';
}
