import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
	Upload,
	FileText,
	AlertTriangle,
	Shield,
	CheckCircle,
	XCircle,
	Info,
	Search,
	Download,
	Trash2,
	Eye,
	EyeOff,
	ChevronDown,
	ChevronUp,
	Database,
	Mail,
	Globe,
	MessageSquare,
	FileType,
	Clock,
	Zap
} from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';
import { api } from '../lib/api-client';
import { useToast } from '../components/ToastNotification';
import { authService } from '../lib/auth';
import { getDocumentReadErrorMessage, readUploadedDocument } from '../lib/documentExtraction';

// Types based on backend schema
interface RetrievedDocument {
	id: string;
	content: string;
	metadata?: Record<string, unknown>;
	score?: number;
}

interface ThreatReference {
	excerpt: string;
	match_text?: string;
	location: {
		start: number;
		end: number;
		basis?: 'original' | 'normalized';
	};
	normalized_location?: {
		start: number;
		end: number;
	};
}

interface DocumentThreat {
	document_id: string;
	threat_type: string;
	severity: 'critical' | 'high' | 'medium' | 'low';
	confidence: number;
	excerpt: string;
	references: ThreatReference[];
	location: {
		start: number;
		end: number;
		basis?: 'original' | 'normalized';
	};
	taxonomy: {
		injection_vector: string;
		operational_target: string;
		persistence_mechanism: string;
		enterprise_context: string;
		detection_complexity: string;
	};
	explanation: string;
}

interface CrossDocumentThreat {
	threat_type: string;
	severity: 'critical' | 'high' | 'medium' | 'low';
	confidence: number;
	involved_documents: string[];
	chain_description: string;
	attack_stages: Array<{
		stage_number: number;
		document_id: string;
		component_description: string;
	}>;
}

interface RAGScanResult {
	is_safe: boolean;
	total_threats_found: number;
	document_threats: DocumentThreat[];
	cross_document_threats: CrossDocumentThreat[];
	safe_documents: string[];
	unsafe_documents: string[];
	taxonomy_summary: {
		injection_vectors: Record<string, number>;
		operational_targets: Record<string, number>;
		persistence_mechanisms: Record<string, number>;
		enterprise_contexts: Record<string, number>;
		detection_complexities: Record<string, number>;
	};
	scan_metadata: {
		scan_id: string;
		timestamp: string;
		documents_scanned: number;
		processing_time_ms: number;
		user_query_included: boolean;
	};
	query_result?: {
		is_attack: boolean;
		attack_type: string;
		confidence: number;
	};
}

interface ScanConfig {
	min_confidence?: number;
	enable_cross_document_analysis?: boolean;
	max_excerpt_length?: number;
}

interface RAGScanHistoryItem {
	id: string;
	timestamp: string;
	documents: RetrievedDocument[];
	user_query: string;
	result: RAGScanResult;
}

type RAGApiResponse = {
	is_safe?: boolean;
	overall_severity?: string;
	overall_confidence?: number;
	query_analysis?: {
		is_attack?: boolean;
		details?: {
			attack_type?: string;
			confidence?: number;
		};
	};
	context_analysis?: {
		is_safe?: boolean;
		scan_id?: string;
		scan_timestamp?: string;
		processing_time_ms?: number;
		total_threats_found?: number;
		detection_complexity?: string;
		injection_vectors?: string[];
		operational_targets?: string[];
		persistence_mechanisms?: string[];
		enterprise_contexts?: string[];
		document_threats?: Array<{
			document_id?: string;
			threat_type?: string;
			severity?: 'critical' | 'high' | 'medium' | 'low';
			confidence?: number;
			excerpts?: string[];
			injection_vector?: string;
			operational_target?: string;
			metadata?: {
				persistence_mechanism?: string;
				enterprise_context?: string;
				detection_complexity?: string;
				summary?: string;
				evidence_refs?: ThreatReference[];
			};
		}>;
		cross_document_threats?: Array<{
			threat_type?: string;
			severity?: 'critical' | 'high' | 'medium' | 'low';
			confidence?: number;
			document_ids?: string[];
			description?: string;
			metadata?: {
				stage_summary?: string;
			};
		}>;
		statistics?: {
			total_threats_found?: number;
			total_documents_scanned?: number;
		};
	};
	processing_time_ms?: number;
	timestamp?: string;
	request_id?: string;
};

interface RAGHistoryEntry {
	scan_id?: string;
	timestamp?: string;
	documents?: RetrievedDocument[];
	user_query?: string;
	response?: unknown;
	result?: unknown;
}

interface RAGHistoryResponse {
	scans?: RAGHistoryEntry[];
}

function getErrorMessage(error: unknown, fallback: string) {
	if (error instanceof Error && error.message) {
		return error.message;
	}
	return fallback;
}

function getDocumentDisplayName(document: RetrievedDocument, index: number) {
	return typeof document.metadata?.filename === 'string'
		? document.metadata.filename
		: `Document ${index + 1}`;
}
const buildTaxonomyCounts = (values: string[] | undefined): Record<string, number> => {
	if (!values) return {};
	return values.reduce<Record<string, number>>((acc, value) => {
		acc[value] = (acc[value] || 0) + 1;
		return acc;
	}, {});
};

const normalizeRagResponse = (
	payload: unknown,
	sourceDocuments: RetrievedDocument[],
	userQueryValue: string
): RAGScanResult => {
	// Already normalized
	if (payload && typeof payload === 'object' && 'scan_metadata' in payload) {
		return payload as RAGScanResult;
	}

	const apiPayload = payload as RAGApiResponse;
	const context = apiPayload?.context_analysis || {};
	const stats = context.statistics || {};

	const documentThreats: DocumentThreat[] = (context.document_threats || []).map((threat, index: number) => {
		const references = threat.metadata?.evidence_refs || [];
		const firstReference = references[0];
		const excerpt = firstReference?.excerpt || threat.excerpts?.[0] || '';
		return {
			document_id: threat.document_id || sourceDocuments[index]?.id || `doc_${index}`,
			threat_type: threat.threat_type || 'unknown',
			severity: threat.severity || 'low',
			confidence: threat.confidence || 0,
			excerpt,
			references,
			location: {
				start: firstReference?.location.start || 0,
				end: firstReference?.location.end || excerpt.length,
				basis: firstReference?.location.basis || 'normalized',
			},
			taxonomy: {
				injection_vector: threat.injection_vector || 'unknown',
				operational_target: threat.operational_target || 'unknown',
				persistence_mechanism: threat.metadata?.persistence_mechanism || 'unknown',
				enterprise_context: threat.metadata?.enterprise_context || 'unknown',
				detection_complexity: threat.metadata?.detection_complexity || context.detection_complexity || 'unknown',
			},
			explanation: threat.metadata?.summary || `Detected ${threat.threat_type || 'risk'} in document.`,
		};
	});

	const crossDocumentThreats: CrossDocumentThreat[] = (context.cross_document_threats || []).map((threat) => ({
		threat_type: threat.threat_type || 'unknown',
		severity: threat.severity || 'low',
		confidence: threat.confidence || 0,
		involved_documents: threat.document_ids || [],
		chain_description: threat.description || 'Coordinated multi-document threat detected.',
		attack_stages: (threat.document_ids || []).map((docId: string, idx: number) => ({
			stage_number: idx + 1,
			document_id: docId,
			component_description: threat.metadata?.stage_summary || 'Correlated indicator detected.',
		})),
	}));

	const unsafeDocumentIds = new Set(documentThreats.map((threat) => threat.document_id));
	const safeDocuments = sourceDocuments
		.map((doc) => doc.id)
		.filter((id) => !unsafeDocumentIds.has(id));

	return {
		is_safe: apiPayload?.is_safe ?? context.is_safe ?? true,
		total_threats_found: stats.total_threats_found ?? context.total_threats_found ?? documentThreats.length,
		document_threats: documentThreats,
		cross_document_threats: crossDocumentThreats,
		safe_documents: safeDocuments,
		unsafe_documents: Array.from(unsafeDocumentIds),
		taxonomy_summary: {
			injection_vectors: buildTaxonomyCounts(context.injection_vectors),
			operational_targets: buildTaxonomyCounts(context.operational_targets),
			persistence_mechanisms: buildTaxonomyCounts(context.persistence_mechanisms),
			enterprise_contexts: buildTaxonomyCounts(context.enterprise_contexts),
			detection_complexities: buildTaxonomyCounts(
				context.detection_complexity ? [context.detection_complexity] : []
			),
		},
		scan_metadata: {
			scan_id: context.scan_id || apiPayload?.request_id || `scan_${Date.now()}`,
			timestamp: context.scan_timestamp || apiPayload?.timestamp || new Date().toISOString(),
			documents_scanned: stats.total_documents_scanned ?? sourceDocuments.length,
			processing_time_ms: context.processing_time_ms ?? apiPayload?.processing_time_ms ?? 0,
			user_query_included: Boolean(apiPayload?.query_analysis || userQueryValue.trim()),
		},
		query_result: apiPayload?.query_analysis
			? {
					is_attack: Boolean(apiPayload.query_analysis.is_attack),
					attack_type: apiPayload.query_analysis.details?.attack_type || 'unknown',
					confidence: apiPayload.query_analysis.details?.confidence || 0,
				}
			: undefined,
	};
};

// CRM Templates
const CRM_TEMPLATES = {
	salesforce: {
		name: 'Salesforce',
		icon: Database,
		fields: ['Account Name', 'Contact Email', 'Opportunity Stage', 'Notes', 'Next Steps'],
		description: 'Salesforce CRM record template with common fields'
	},
	hubspot: {
		name: 'HubSpot',
		icon: Mail,
		fields: ['Company Name', 'Contact Info', 'Deal Stage', 'Last Activity', 'Communication'],
		description: 'HubSpot CRM template for deals and contacts'
	},
	zendesk: {
		name: 'Zendesk',
		icon: MessageSquare,
		fields: ['Ticket Subject', 'Customer Email', 'Description', 'Status', 'Agent Notes'],
		description: 'Zendesk support ticket template'
	}
};

export function RAGSecurityPage() {
	const { success, error: showError } = useToast();
	const currentUser = authService.getCurrentUser();
	const [documents, setDocuments] = useState<RetrievedDocument[]>([]);
	const [userQuery, setUserQuery] = useState('');
	const [scanResult, setScanResult] = useState<RAGScanResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'template'>('upload');
	const [pasteContent, setPasteContent] = useState('');
	const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof CRM_TEMPLATES | null>(null);
	const [templateFields, setTemplateFields] = useState<Record<string, string>>({});
	const [expandedThreat, setExpandedThreat] = useState<string | null>(null);

	const getDocumentLabel = (documentId: string) => {
		const document = documents.find((item) => item.id === documentId);
		const filename = typeof document?.metadata?.filename === 'string' ? document.metadata.filename : null;
		return filename || documentId;
	};
	const [showSafeDocuments, setShowSafeDocuments] = useState(false);
	const [scanConfig, setScanConfig] = useState<ScanConfig>({
		min_confidence: 0.3,
		enable_cross_document_analysis: true,
		max_excerpt_length: 200
	});
	const [scanHistory, setScanHistory] = useState<RAGScanHistoryItem[]>([]);
	const [historyLoading, setHistoryLoading] = useState(false);
	const [historyError, setHistoryError] = useState<string | null>(null);

	const refreshHistory = async () => {
		setHistoryLoading(true);
		setHistoryError(null);
		try {
				const response = await api.getRagScanHistory(20, 0) as RAGHistoryResponse;
				const scans = response?.scans || [];
				const mapped = scans.map((item) => {
					const documentsList = item.documents || [];
					const responsePayload = item.response || item.result || item;
					const normalized = normalizeRagResponse(responsePayload, documentsList, item.user_query || '');
				return {
					id: item.scan_id || normalized.scan_metadata.scan_id,
					timestamp: item.timestamp || normalized.scan_metadata.timestamp,
					documents: documentsList,
					user_query: item.user_query || '',
					result: normalized,
				} as RAGScanHistoryItem;
			});
			setScanHistory(mapped);
			} catch (error) {
				setHistoryError(getErrorMessage(error, 'Failed to load scan history'));
			} finally {
			setHistoryLoading(false);
		}
	};

	useEffect(() => {
		refreshHistory();
	}, [currentUser?.id]);

	const maxFileSizeBytes = 10 * 1024 * 1024;

	// Handle file upload
	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		const newDocuments: RetrievedDocument[] = [];
		const uploadErrors: string[] = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			try {
				if (file.size > maxFileSizeBytes) {
					uploadErrors.push(`File too large (max 10MB): ${file.name}`);
					continue;
				}
				const content = await readUploadedDocument(file);
				if (!content.trim()) {
					uploadErrors.push(`No readable text found in: ${file.name}`);
					continue;
				}
				newDocuments.push({
					id: `file_${Date.now()}_${i}`,
					content,
					metadata: {
						filename: file.name,
						type: file.type,
						size: file.size,
						lastModified: file.lastModified,
						extracted_at: new Date().toISOString()
					}
				});
			} catch (err) {
				uploadErrors.push(getDocumentReadErrorMessage(file, err));
			}
		}

		setDocuments(prev => [...prev, ...newDocuments]);
		e.target.value = '';

		if (newDocuments.length > 0) {
			success(`Added ${newDocuments.length} document(s)`);
		}

		uploadErrors.forEach((message) => showError(message));
	};

	// Handle paste content
	const handleAddPasteContent = () => {
		if (!pasteContent.trim()) {
			showError('Please enter some content');
			return;
		}

		const newDoc: RetrievedDocument = {
			id: `paste_${Date.now()}`,
			content: pasteContent,
			metadata: {
				source: 'manual_paste',
				added_at: new Date().toISOString()
			}
		};

		setDocuments(prev => [...prev, newDoc]);
		setPasteContent('');
		success('Document added successfully');
	};

	// Handle CRM template
	const handleAddTemplate = () => {
		if (!selectedTemplate) {
			showError('Please select a template');
			return;
		}

		const template = CRM_TEMPLATES[selectedTemplate];
		const content = template.fields
			.map(field => `${field}: ${templateFields[field] || ''}`)
			.join('\n');

		const newDoc: RetrievedDocument = {
			id: `template_${selectedTemplate}_${Date.now()}`,
			content,
			metadata: {
				source: 'crm_template',
				template_type: selectedTemplate,
				added_at: new Date().toISOString()
			}
		};

		setDocuments(prev => [...prev, newDoc]);
		setTemplateFields({});
		setSelectedTemplate(null);
		success('CRM template added successfully');
	};

	// Remove document
	const handleRemoveDocument = (id: string) => {
		setDocuments(prev => prev.filter(doc => doc.id !== id));
		success('Document removed');
	};

	// Clear all documents
	const handleClearAll = () => {
		setDocuments([]);
		setScanResult(null);
		success('All documents cleared');
	};

	const handleClearHistory = () => {
		api.clearRagScans()
			.then(() => {
				setScanHistory([]);
				success('Scan history cleared');
			})
				.catch((error) => {
					showError(getErrorMessage(error, 'Failed to clear history'));
				});
	};

	const handleLoadHistory = (item: RAGScanHistoryItem) => {
		setDocuments(item.documents);
		setUserQuery(item.user_query);
		setScanResult(item.result);
		success('Loaded previous scan');
	};

	const handleDeleteHistory = (id: string) => {
		api.deleteRagScan(id)
			.then(() => {
				setScanHistory((prev) => prev.filter((item) => item.id !== id));
			})
				.catch((error) => {
					showError(getErrorMessage(error, 'Failed to delete scan'));
				});
	};

	const handleDownloadPack = async (scanId: string) => {
		try {
			const blob = await api.downloadRagScanPack(scanId);
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `rag-scan-${scanId}.zip`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			success('Download started');
			} catch (error) {
				showError(getErrorMessage(error, 'Failed to download scan pack'));
			}
	};

	// Perform RAG scan
	const handleScan = async () => {
		if (documents.length === 0) {
			showError('Please add at least one document to scan');
			return;
		}

		setLoading(true);
		try {
			const response = await api.scanRAGContext({
				user_query: userQuery.trim() || undefined,
				documents,
				config: scanConfig
			});
			const normalized = normalizeRagResponse(response, documents, userQuery);
			setScanResult(normalized);
			await refreshHistory();

			if (normalized.is_safe) {
				success('No threats detected - Documents are safe!');
			} else {
				showError(`${normalized.total_threats_found} threat(s) detected!`);
			}
			} catch (error) {
				showError(getErrorMessage(error, 'Failed to scan documents'));
				console.error('RAG scan error:', error);
			} finally {
			setLoading(false);
		}
	};

	// Export results
	const handleExport = () => {
		if (!scanResult) return;

		const exportData = {
			scan_id: scanResult.scan_metadata.scan_id,
			timestamp: scanResult.scan_metadata.timestamp,
			is_safe: scanResult.is_safe,
			total_threats: scanResult.total_threats_found,
			documents_scanned: scanResult.scan_metadata.documents_scanned,
			document_threats: scanResult.document_threats,
			cross_document_threats: scanResult.cross_document_threats,
			taxonomy_summary: scanResult.taxonomy_summary
		};

		const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `rag-scan-${scanResult.scan_metadata.scan_id}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		success('Results exported successfully');
	};

	// Get severity color
	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case 'critical': return 'text-red-600 bg-red-500/10 border-red-500/50';
			case 'high': return 'text-orange-600 bg-orange-500/10 border-orange-500/50';
			case 'medium': return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/50';
			case 'low': return 'text-blue-600 bg-blue-500/10 border-blue-500/50';
			default: return 'text-muted-foreground bg-muted border-border';
		}
	};

	// Get injection vector icon
	const getInjectionVectorIcon = (vector: string) => {
			const iconMap: Record<string, typeof FileType> = {
				email: Mail,
				document: FileText,
				web_scraping: Globe,
			chat_message: MessageSquare,
			database: Database,
			file_upload: Upload
		};
		return iconMap[vector] || FileType;
	};

	return (
		<div className="min-h-screen bg-background">
			<SEOMeta
				title="RAG Security Scanner | KoreShield"
				description="Scan retrieved documents for indirect prompt injection attacks in RAG systems"
			/>

			{/* Header */}
			<header className="border-b border-border bg-card">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex items-start justify-between">
						<div>
							<h1 className="text-3xl font-bold mb-2">RAG Security Scanner</h1>
							<p className="text-muted-foreground">
								Detect indirect prompt injection attacks in retrieved documents
							</p>
						</div>
						<Shield className="w-12 h-12 text-primary opacity-50" />
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Left Column - Document Input */}
					<div className="lg:col-span-2 space-y-6">
						{/* Document Input Section */}
						<div className="bg-card border border-border rounded-lg p-6">
							<h2 className="text-xl font-semibold mb-4">Add Documents</h2>

							{/* Tabs */}
							<div className="flex gap-2 mb-4 border-b border-border">
								<button
									onClick={() => setActiveTab('upload')}
									className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'upload'
											? 'border-primary text-primary'
											: 'border-transparent text-muted-foreground hover:text-foreground'
										}`}
								>
									<Upload className="w-4 h-4 inline mr-2" />
									Upload Files
								</button>
								<button
									onClick={() => setActiveTab('paste')}
									className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'paste'
											? 'border-primary text-primary'
											: 'border-transparent text-muted-foreground hover:text-foreground'
										}`}
								>
									<FileText className="w-4 h-4 inline mr-2" />
									Paste Content
								</button>
								<button
									onClick={() => setActiveTab('template')}
									className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'template'
											? 'border-primary text-primary'
											: 'border-transparent text-muted-foreground hover:text-foreground'
										}`}
								>
									<Database className="w-4 h-4 inline mr-2" />
									CRM Templates
								</button>
							</div>

							{/* Tab Content */}
							<div className="mt-4">
								{activeTab === 'upload' && (
									<div>
										<label className="block w-full">
											<input
												type="file"
												multiple
												accept=".txt,.md,.json,.csv,.pdf,.docx"
												onChange={handleFileUpload}
												className="hidden"
											/>
											<div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
												<Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
												<p className="text-sm font-medium mb-1">Click to upload files</p>
												<p className="text-xs text-muted-foreground">
													Supports TXT, MD, JSON, CSV, PDF, DOCX (max 10MB per file)
												</p>
											</div>
										</label>
									</div>
								)}

								{activeTab === 'paste' && (
									<div>
										<textarea
											value={pasteContent}
											onChange={(e) => setPasteContent(e.target.value)}
											placeholder="Paste document content here..."
											rows={8}
											className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
										/>
										<button
											onClick={handleAddPasteContent}
											disabled={!pasteContent.trim()}
											className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
										>
											Add Document
										</button>
									</div>
								)}

								{activeTab === 'template' && (
									<div className="space-y-4">
										<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
											{Object.entries(CRM_TEMPLATES).map(([key, template]) => {
												const Icon = template.icon;
												return (
													<button
														key={key}
														onClick={() => setSelectedTemplate(key as keyof typeof CRM_TEMPLATES)}
														className={`p-4 border rounded-lg text-left transition-colors ${selectedTemplate === key
																? 'border-primary bg-primary/10'
																: 'border-border hover:border-primary/50'
															}`}
													>
														<Icon className="w-6 h-6 mb-2 text-primary" />
														<div className="font-semibold">{template.name}</div>
														<div className="text-xs text-muted-foreground mt-1">
															{template.description}
														</div>
													</button>
												);
											})}
										</div>

										{selectedTemplate && (
											<motion.div
												initial={{ opacity: 0, height: 0 }}
												animate={{ opacity: 1, height: 'auto' }}
												className="space-y-3 pt-4 border-t border-border"
											>
												{CRM_TEMPLATES[selectedTemplate].fields.map(field => (
													<div key={field}>
														<label className="block text-sm font-medium mb-1">{field}</label>
														<input
															type="text"
															value={templateFields[field] || ''}
															onChange={(e) => setTemplateFields(prev => ({
																...prev,
																[field]: e.target.value
															}))}
															className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
															placeholder={`Enter ${field.toLowerCase()}...`}
														/>
													</div>
												))}
												<button
													onClick={handleAddTemplate}
													className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
												>
													Add CRM Record
												</button>
											</motion.div>
										)}
									</div>
								)}
							</div>
						</div>

						{/* User Query (Optional) */}
						<div className="bg-card border border-border rounded-lg p-6">
							<h2 className="text-xl font-semibold mb-4">User Query (Optional)</h2>
							<p className="text-sm text-muted-foreground mb-4">
								Enter the user's query to check for prompt injection attempts
							</p>
							<textarea
								value={userQuery}
								onChange={(e) => setUserQuery(e.target.value)}
								placeholder="e.g., 'Show me customer information'"
								rows={3}
								className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
							/>
						</div>

						{/* Document List */}
						{documents.length > 0 && (
							<div className="bg-card border border-border rounded-lg p-6">
								<div className="flex items-center justify-between mb-4">
									<h2 className="text-xl font-semibold">
										Documents ({documents.length})
									</h2>
									<button
										onClick={handleClearAll}
										className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
									>
										<Trash2 className="w-4 h-4" />
										Clear All
									</button>
								</div>
								<div className="space-y-2">
									{documents.map((doc, index) => (
										<div
											key={doc.id}
											className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg group"
										>
											<FileText className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
											<div className="flex-1 min-w-0">
												<div className="font-medium text-sm">
													{getDocumentDisplayName(doc, index)}
												</div>
												<div className="text-xs text-muted-foreground truncate">
													{doc.content.substring(0, 100)}...
												</div>
											</div>
											<button
												onClick={() => handleRemoveDocument(doc.id)}
												className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Scan Button */}
						<button
							onClick={handleScan}
							disabled={loading || documents.length === 0}
							className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
						>
							{loading ? (
								<>
									<div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
									Scanning Documents...
								</>
							) : (
								<>
									<Search className="w-5 h-5" />
									Scan for Threats
								</>
							)}
						</button>
					</div>

					{/* Right Column - Scan Configuration & Results */}
					<div className="space-y-6">
						{/* Scan Configuration */}
						<div className="bg-card border border-border rounded-lg p-6">
							<h2 className="text-lg font-semibold mb-4">Scan Configuration</h2>
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium mb-2">
										Minimum Confidence
									</label>
									<input
										type="range"
										min="0"
										max="1"
										step="0.1"
										value={scanConfig.min_confidence}
										onChange={(e) => setScanConfig(prev => ({
											...prev,
											min_confidence: parseFloat(e.target.value)
										}))}
										className="w-full"
									/>
									<div className="text-xs text-muted-foreground mt-1">
										{(scanConfig.min_confidence! * 100).toFixed(0)}%
									</div>
								</div>

								<div className="flex items-center justify-between">
									<label className="text-sm font-medium">
										Cross-Document Analysis
									</label>
									<button
										onClick={() => setScanConfig(prev => ({
											...prev,
											enable_cross_document_analysis: !prev.enable_cross_document_analysis
										}))}
										className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${scanConfig.enable_cross_document_analysis
												? 'bg-primary'
												: 'bg-muted'
											}`}
									>
										<span
											className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${scanConfig.enable_cross_document_analysis
													? 'translate-x-6'
													: 'translate-x-1'
												}`}
										/>
									</button>
								</div>

								<div>
									<label className="block text-sm font-medium mb-2">
										Max Excerpt Length
									</label>
									<input
										type="number"
										min="50"
										max="500"
										value={scanConfig.max_excerpt_length}
										onChange={(e) => setScanConfig(prev => ({
											...prev,
											max_excerpt_length: parseInt(e.target.value)
										}))}
										className="w-full px-3 py-2 bg-background border border-border rounded-lg"
									/>
								</div>
							</div>
						</div>

						{/* Scan Results Summary */}
						{scanResult && (
							<div className="bg-card border border-border rounded-lg p-6 space-y-4">
								<div className="flex items-center justify-between">
									<h2 className="text-lg font-semibold">Scan Results</h2>
									<div className="flex items-center gap-3">
										<button
											onClick={() => handleDownloadPack(scanResult.scan_metadata.scan_id)}
											className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
										>
											<Download className="w-4 h-4" />
											Download Scan Pack
										</button>
										<button
											onClick={handleExport}
											className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
										>
											<Download className="w-4 h-4" />
											Export
										</button>
									</div>
								</div>

								{/* Overall Status */}
								<div className={`p-4 rounded-lg border-2 ${scanResult.is_safe
										? 'bg-green-500/10 border-green-500/50'
										: 'bg-red-500/10 border-red-500/50'
									}`}>
									<div className="flex items-center gap-3">
										{scanResult.is_safe ? (
											<CheckCircle className="w-8 h-8 text-green-600" />
										) : (
											<XCircle className="w-8 h-8 text-red-600" />
										)}
										<div>
											<div className="font-semibold">
												{scanResult.is_safe ? 'No Threats Detected' : 'Threats Found'}
											</div>
											<div className="text-sm text-muted-foreground">
												{scanResult.total_threats_found} threat(s) in {scanResult.scan_metadata.documents_scanned} document(s)
											</div>
										</div>
									</div>
								</div>

								{/* Metadata */}
								<div className="grid grid-cols-2 gap-3 text-sm">
									<div className="p-3 bg-muted rounded-lg">
										<div className="text-muted-foreground mb-1">Scan ID</div>
										<div className="font-mono text-xs truncate">
											{scanResult.scan_metadata.scan_id.substring(0, 8)}...
										</div>
									</div>
									<div className="p-3 bg-muted rounded-lg">
										<div className="text-muted-foreground mb-1">Processing Time</div>
										<div className="font-semibold">
											{scanResult.scan_metadata.processing_time_ms.toFixed(0)}ms
										</div>
									</div>
								</div>

								{/* Document Status */}
								<div>
									<div className="flex items-center justify-between mb-2">
										<div className="text-sm font-medium">Document Status</div>
										<button
											onClick={() => setShowSafeDocuments(!showSafeDocuments)}
											className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
										>
											{showSafeDocuments ? (
												<>
													<EyeOff className="w-3 h-3" />
													Hide Safe
												</>
											) : (
												<>
													<Eye className="w-3 h-3" />
													Show Safe
												</>
											)}
										</button>
									</div>
									<div className="space-y-2">
										<div className="flex items-center justify-between text-sm">
											<span className="flex items-center gap-2">
												<XCircle className="w-4 h-4 text-red-600" />
												Unsafe
											</span>
											<span className="font-semibold">{scanResult.unsafe_documents.length}</span>
										</div>
										{showSafeDocuments && (
											<div className="flex items-center justify-between text-sm">
												<span className="flex items-center gap-2">
													<CheckCircle className="w-4 h-4 text-green-600" />
													Safe
												</span>
												<span className="font-semibold">{scanResult.safe_documents.length}</span>
											</div>
										)}
									</div>
								</div>
							</div>
						)}

						{/* Scan History */}
						<div className="bg-card border border-border rounded-lg p-6 space-y-4">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold">Scan History</h2>
								{scanHistory.length > 0 && (
									<button
										onClick={handleClearHistory}
										className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
									>
										<Trash2 className="w-3 h-3" />
										Clear History
									</button>
								)}
							</div>
							<p className="text-xs text-muted-foreground">
								Stored securely in your account history for future review and downloads.
							</p>
							{historyLoading ? (
								<div className="text-sm text-muted-foreground">Loading scan history...</div>
							) : historyError ? (
								<div className="text-sm text-red-500">{historyError}</div>
							) : scanHistory.length === 0 ? (
								<div className="text-sm text-muted-foreground">No previous scans yet.</div>
							) : (
								<div className="space-y-2">
									{scanHistory.map((item) => (
										<div key={item.id} className="flex items-center justify-between gap-3 p-3 bg-muted/40 rounded-lg border border-border">
											<div className="min-w-0">
												<div className="text-sm font-medium truncate">
													{item.result.total_threats_found} threat(s) • {item.result.scan_metadata.documents_scanned} doc(s)
												</div>
												<div className="text-xs text-muted-foreground">
													{new Date(item.timestamp).toLocaleString()}
												</div>
											</div>
											<div className="flex items-center gap-2">
												<button
													onClick={() => handleLoadHistory(item)}
													className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
												>
													<Eye className="w-3 h-3" />
													View
												</button>
												<button
													onClick={() => handleDownloadPack(item.id)}
													className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
												>
													<Download className="w-3 h-3" />
													Download
												</button>
												<button
													onClick={() => handleDeleteHistory(item.id)}
													className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
												>
													<Trash2 className="w-3 h-3" />
													Remove
												</button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Info Card */}
						<div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
							<div className="flex gap-3">
								<Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
								<div className="text-sm text-blue-600">
									<div className="font-semibold mb-1">About RAG Security</div>
									<p>
										This scanner detects indirect prompt injection attacks in retrieved documents
										using KoreShield's 5-dimensional taxonomy.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Detailed Threat Analysis */}
				{scanResult && scanResult.document_threats.length > 0 && (
					<div className="mt-8 space-y-4">
						<h2 className="text-2xl font-bold">Threat Analysis</h2>

						{/* Document Threats */}
						{scanResult.document_threats.map((threat, index) => (
							<motion.div
								key={`${threat.document_id}-${index}`}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05 }}
								className="bg-card border border-border rounded-lg overflow-hidden"
							>
								<button
									onClick={() => setExpandedThreat(
										expandedThreat === `${threat.document_id}-${index}`
											? null
											: `${threat.document_id}-${index}`
									)}
									className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
								>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="flex items-center gap-3 mb-2">
												<span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(threat.severity)
													}`}>
													{threat.severity.toUpperCase()}
												</span>
												<span className="font-mono text-sm text-muted-foreground">
													{threat.document_id}
												</span>
											</div>
											<div className="font-semibold text-lg mb-1">
												{threat.threat_type.replace(/_/g, ' ').toUpperCase()}
											</div>
											<div className="text-sm text-muted-foreground">
												Confidence: {(threat.confidence * 100).toFixed(1)}%
											</div>
										</div>
										{expandedThreat === `${threat.document_id}-${index}` ? (
											<ChevronUp className="w-5 h-5 text-muted-foreground" />
										) : (
											<ChevronDown className="w-5 h-5 text-muted-foreground" />
										)}
									</div>
								</button>

								{expandedThreat === `${threat.document_id}-${index}` && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
										exit={{ opacity: 0, height: 0 }}
										className="border-t border-border p-4 space-y-4"
									>
										{/* Excerpt */}
										<div>
											<div className="text-sm font-medium mb-2">Threat Excerpt</div>
											<div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
												<code className="text-sm">{threat.excerpt}</code>
											</div>
											<div className="mt-2 text-xs text-muted-foreground">
												Reference source: {getDocumentLabel(threat.document_id)}
											</div>
										</div>

										{threat.references.length > 0 && (
											<div>
												<div className="text-sm font-medium mb-2">Referenced Findings</div>
												<div className="space-y-3">
													{threat.references.map((reference, referenceIndex) => (
														<div
															key={`${threat.document_id}-${referenceIndex}`}
															className="rounded-lg border border-border bg-muted/30 p-3"
														>
															<div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
																{reference.location.basis === 'original' ? 'Document characters' : 'Normalized characters'} {reference.location.start}-{reference.location.end}
															</div>
															<code className="block text-sm whitespace-pre-wrap break-words">{reference.excerpt}</code>
														</div>
													))}
												</div>
											</div>
										)}

										{/* Explanation */}
										<div>
											<div className="text-sm font-medium mb-2">Explanation</div>
											<p className="text-sm text-muted-foreground">
												{threat.explanation}
											</p>
										</div>

										{/* Taxonomy */}
										<div>
											<div className="text-sm font-medium mb-3">5D Taxonomy Classification</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
												<div className="p-3 bg-muted rounded-lg">
													<div className="flex items-center gap-2 mb-1">
														{(() => {
															const Icon = getInjectionVectorIcon(threat.taxonomy.injection_vector);
															return <Icon className="w-4 h-4 text-primary" />;
														})()}
														<span className="text-xs text-muted-foreground">Injection Vector</span>
													</div>
													<div className="text-sm font-medium">
														{threat.taxonomy.injection_vector.replace(/_/g, ' ')}
													</div>
												</div>
												<div className="p-3 bg-muted rounded-lg">
													<div className="flex items-center gap-2 mb-1">
														<Zap className="w-4 h-4 text-primary" />
														<span className="text-xs text-muted-foreground">Operational Target</span>
													</div>
													<div className="text-sm font-medium">
														{threat.taxonomy.operational_target.replace(/_/g, ' ')}
													</div>
												</div>
												<div className="p-3 bg-muted rounded-lg">
													<div className="flex items-center gap-2 mb-1">
														<Clock className="w-4 h-4 text-primary" />
														<span className="text-xs text-muted-foreground">Persistence</span>
													</div>
													<div className="text-sm font-medium">
														{threat.taxonomy.persistence_mechanism.replace(/_/g, ' ')}
													</div>
												</div>
												<div className="p-3 bg-muted rounded-lg">
													<div className="flex items-center gap-2 mb-1">
														<Database className="w-4 h-4 text-primary" />
														<span className="text-xs text-muted-foreground">Enterprise Context</span>
													</div>
													<div className="text-sm font-medium">
														{threat.taxonomy.enterprise_context.replace(/_/g, ' ')}
													</div>
												</div>
												<div className="p-3 bg-muted rounded-lg col-span-full">
													<div className="flex items-center gap-2 mb-1">
														<Search className="w-4 h-4 text-primary" />
														<span className="text-xs text-muted-foreground">Detection Complexity</span>
													</div>
													<div className="text-sm font-medium">
														{threat.taxonomy.detection_complexity.replace(/_/g, ' ')}
													</div>
												</div>
											</div>
										</div>

										{/* Location */}
										<div className="text-xs text-muted-foreground">
											Location: {threat.location.basis === 'original' ? 'document' : 'normalized'} characters {threat.location.start}-{threat.location.end}
										</div>
									</motion.div>
								)}
							</motion.div>
						))}

						{/* Cross-Document Threats */}
						{scanResult.cross_document_threats.length > 0 && (
							<div className="mt-6">
								<h3 className="text-xl font-bold mb-4">Cross-Document Attack Chains</h3>
								{scanResult.cross_document_threats.map((threat, index) => (
									<div
										key={index}
										className="bg-card border-2 border-orange-500/50 rounded-lg p-4 mb-4"
									>
										<div className="flex items-center gap-3 mb-3">
											<AlertTriangle className="w-6 h-6 text-orange-600" />
											<div>
												<div className="font-semibold text-lg">
													{threat.threat_type.replace(/_/g, ' ').toUpperCase()}
												</div>
												<div className="text-sm text-muted-foreground">
													Multi-stage attack across {threat.involved_documents.length} documents
												</div>
											</div>
										</div>
										<p className="text-sm mb-4">{threat.chain_description}</p>
										<div className="space-y-2">
											{threat.attack_stages.map(stage => (
												<div key={stage.stage_number} className="flex gap-3 p-3 bg-muted/50 rounded">
													<div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
														{stage.stage_number}
													</div>
													<div className="flex-1">
														<div className="font-mono text-xs text-muted-foreground mb-1">
															{stage.document_id}
														</div>
														<div className="text-sm">{stage.component_description}</div>
													</div>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
						)}

						{/* Taxonomy Summary */}
						<div className="bg-card border border-border rounded-lg p-6 mt-6">
							<h3 className="text-xl font-bold mb-4">Taxonomy Summary</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{Object.entries(scanResult.taxonomy_summary).map(([category, data]) => {
									const total = Object.values(data as Record<string, number>).reduce((a, b) => a + b, 0);
									if (total === 0) return null;

									return (
										<div key={category}>
											<h4 className="text-sm font-semibold mb-3 capitalize">
												{category.replace(/_/g, ' ')}
											</h4>
											<div className="space-y-2">
												{Object.entries(data as Record<string, number>)
													.filter(([, count]) => count > 0)
													.sort(([, a], [, b]) => b - a)
													.map(([type, count]) => (
														<div key={type} className="flex items-center justify-between text-sm">
															<span className="text-muted-foreground capitalize">
																{type.replace(/_/g, ' ')}
															</span>
															<span className="font-semibold">{count}</span>
														</div>
													))}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}
