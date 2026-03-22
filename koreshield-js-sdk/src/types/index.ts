/**
 * KoreShield JavaScript/TypeScript SDK Types
 */

export interface KoreShieldConfig {
  /** KoreShield proxy base URL */
  baseURL: string;
  /** API key for authentication (optional, can be set via environment) */
  apiKey?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom headers to include in all requests */
  headers?: Record<string, string>;
}

export interface NormalizationResult {
  original: string;
  normalized: string;
  layers: string[];
}

export type SensitivityLevel = 'low' | 'medium' | 'high';
export type SecurityAction = 'allow' | 'warn' | 'block';

export interface SecurityFeatures {
  sanitization?: boolean;
  detection?: boolean;
  policyEnforcement?: boolean;
  rateLimiting?: boolean;
  anomalyDetection?: boolean;
}

export interface SecurityOptions {
  /** Sensitivity level: 'low', 'medium', 'high' */
  sensitivity?: SensitivityLevel;
  /** Action on detection: 'allow', 'warn', 'block' */
  defaultAction?: SecurityAction;
  /** Enable/disable specific security features */
  features?: SecurityFeatures;
  /** Custom security rules */
  customRules?: Array<{
    name: string;
    pattern: string;
    action: SecurityAction;
  }>;
}

export type ChatMessageRole = 'system' | 'user' | 'assistant' | 'function' | 'tool';

export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  stream?: boolean;
  [key: string]: any;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion' | 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: 'stop' | 'length' | 'function_call' | 'content_filter' | 'null' | null;
    delta?: Partial<ChatMessage>; // For streaming
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AuditLogEntry {
  timestamp?: string;
  level?: string;
  event?: string;
  message?: string;
  [key: string]: any;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

export type SecurityEvent = AuditLogEntry;

export interface MetricsResponse {
  requests_total: number;
  requests_allowed?: number;
  requests_blocked: number;
  attacks_detected: number;
  errors?: number;
}

export interface PerformanceMetrics {
  totalRequests: number;
  totalProcessingTimeMs: number;
  averageResponseTimeMs: number;
  requestsPerSecond: number;
  errorCount: number;
  cacheHitRate: number;
  batchEfficiency: number;
  streamingChunksProcessed: number;
  uptimeSeconds: number;
  memoryUsageMb?: number;
  customMetrics: Record<string, any>;
}

/**
 * Threat severity levels
 */
export enum ThreatLevel {
  SAFE = 'safe',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Detection type taxonomy
 */
export enum DetectionType {
  KEYWORD = 'keyword',
  PATTERN = 'pattern',
  RULE = 'rule',
  ML = 'ml',
  BLOCKLIST = 'blocklist',
  ALLOWLIST = 'allowlist',
}

export enum ToolRiskClass {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ToolCapability {
  READ = 'read',
  WRITE = 'write',
  NETWORK = 'network',
  EXECUTION = 'execution',
  DATABASE = 'database',
  CREDENTIAL_ACCESS = 'credential_access',
}

export interface ToolTrustContext {
  source?: string;
  trustLevel?: 'trusted' | 'internal' | 'partner' | 'external' | 'untrusted' | 'unknown' | string;
  trust_level?: 'trusted' | 'internal' | 'partner' | 'external' | 'untrusted' | 'unknown' | string;
  userApproved?: boolean | null;
  user_approved?: boolean | null;
  crossTenant?: boolean;
  cross_tenant?: boolean;
  chainDepth?: number;
  chain_depth?: number;
  priorTools?: string[];
  prior_tools?: string[];
}

export interface SecurityPolicy {
  name: string;
  description?: string;
  threatThreshold: ThreatLevel;
  blockedDetectionTypes: DetectionType[];
  customRules: Array<{
    name: string;
    pattern: string;
    action: SecurityAction;
  }>;
  allowlistPatterns: string[];
  blocklistPatterns: string[];
  metadata?: Record<string, any>;
}

export interface LocalThreatIndicator {
  type: DetectionType;
  severity: ThreatLevel;
  confidence: number;
  description: string;
  metadata?: Record<string, any>;
}

export interface PreflightScanResult {
  blocked: boolean;
  isSafe: boolean;
  threatLevel: ThreatLevel;
  confidence: number;
  normalization: NormalizationResult;
  indicators: LocalThreatIndicator[];
  suggestedAction: SecurityAction;
}

export interface ToolCallPreflightResult extends PreflightScanResult {
  toolName: string;
  riskyTool: boolean;
  reasons: string[];
  riskClass: ToolRiskClass;
  provenanceRisk: ToolRiskClass;
  capabilitySignals: ToolCapability[];
  reviewRequired: boolean;
  confusedDeputyRisk: boolean;
  escalationSignals: string[];
  trustContext: ToolTrustContext;
}

export interface ToolScanPolicyResult {
  allowed: boolean;
  action: SecurityAction | 'blocked';
  reason: string;
  policy_violations: Array<{
    policy: string;
    severity: string;
    details: Record<string, any>;
    policy_id?: string;
  }>;
  user_role?: string | null;
  permissions?: string[];
  bypass_allowed?: boolean;
  review_required?: boolean;
  risk_class?: ToolRiskClass | string;
}

export interface ToolScanResponse {
  scan_id: string;
  tool_name: string;
  allowed: boolean;
  blocked: boolean;
  action: SecurityAction | 'blocked';
  risk_class: ToolRiskClass | string;
  provenance_risk: ToolRiskClass | string;
  risky_tool: boolean;
  review_required: boolean;
  capability_signals: Array<ToolCapability | string>;
  confused_deputy_risk: boolean;
  escalation_signals: string[];
  trust_context: ToolTrustContext;
  confidence: number;
  indicators: Array<Record<string, any>>;
  reasons: string[];
  normalization: {
    normalized: string;
    layers: string[];
  };
  policy_result: ToolScanPolicyResult;
  processing_time_ms: number;
  timestamp: string;
}

export interface DocumentThreatMetadata {
  base_detection_confidence?: number;
  rag_pattern_confidence?: number;
  query_similarity?: number;
  directive_score?: number;
  query_mismatch?: boolean;
  high_directive_density?: boolean;
  matched_on_normalized_text?: boolean;
  threat_indicators?: string[];
  normalization_layers?: string[];
  document_metadata?: Record<string, any>;
}

export interface CrossDocumentThreatMetadata {
  supporting_indicators?: string[];
  document_count?: number;
  coordinated?: boolean;
}

export interface RAGStatistics {
  total_documents_scanned: number;
  documents_with_threats: number;
  total_threats_found: number;
  documents_with_query_mismatch?: number;
  documents_with_directive_density?: number;
  documents_normalized?: number;
  min_query_similarity?: number | null;
  max_directive_score?: number | null;
  [key: string]: any;
}

export interface QueryAnalysis {
  is_attack: boolean;
  details: Record<string, any>;
}

export interface RAGPreflightDocumentResult extends PreflightScanResult {
  documentId: string;
  querySimilarity: number;
  directiveScore: number;
  metadata?: Record<string, any>;
}

export interface RAGPreflightResult {
  blocked: boolean;
  isSafe: boolean;
  threatLevel: ThreatLevel;
  confidence: number;
  userQuery: string;
  documents: RAGPreflightDocumentResult[];
  suggestedAction: SecurityAction;
}

export interface KoreShieldError extends Error {
  code: string;
  statusCode?: number;
  details?: Record<string, any>;
}

export type ProviderType = 'openai' | 'anthropic' | 'deepseek' | 'gemini' | 'azure';

export interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  baseURL?: string;
  organization?: string;
  project?: string;
}

// ======================================================================
// RAG Detection Types
// ======================================================================

/**
 * RAG injection vector taxonomy
 */
export enum InjectionVector {
  EMAIL = 'email',
  DOCUMENT = 'document',
  WEB_SCRAPING = 'web_scraping',
  DATABASE = 'database',
  CHAT_MESSAGE = 'chat_message',
  CUSTOMER_SUPPORT = 'customer_support',
  KNOWLEDGE_BASE = 'knowledge_base',
  API_INTEGRATION = 'api_integration',
  UNKNOWN = 'unknown',
}

/**
 * RAG operational target taxonomy
 */
export enum OperationalTarget {
  DATA_EXFILTRATION = 'data_exfiltration',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  ACCESS_CONTROL_BYPASS = 'access_control_bypass',
  CONTEXT_POISONING = 'context_poisoning',
  SYSTEM_PROMPT_LEAKING = 'system_prompt_leaking',
  MISINFORMATION = 'misinformation',
  RECONNAISSANCE = 'reconnaissance',
  UNKNOWN = 'unknown',
}

/**
 * RAG persistence mechanism taxonomy
 */
export enum PersistenceMechanism {
  SINGLE_TURN = 'single_turn',
  MULTI_TURN = 'multi_turn',
  CONTEXT_PERSISTENCE = 'context_persistence',
  NON_PERSISTENT = 'non_persistent',
}

/**
 * Enterprise context taxonomy
 */
export enum EnterpriseContext {
  CRM = 'crm',
  SALES = 'sales',
  CUSTOMER_SUPPORT = 'customer_support',
  MARKETING = 'marketing',
  HEALTHCARE = 'healthcare',
  FINANCIAL_SERVICES = 'financial_services',
  GENERAL = 'general',
}

/**
 * Detection complexity taxonomy
 */
export enum DetectionComplexity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * Document to be scanned in RAG context
 */
export interface RAGDocument {
  /** Unique identifier for the document */
  id: string;
  /** Document content/text */
  content: string;
  /** Optional metadata */
  metadata?: Record<string, any>;
}

/**
 * Document-level threat detection
 */
export interface DocumentThreat {
  /** ID of the threatening document */
  document_id: string;
  /** Optional backend document position */
  document_index?: number;
  /** Optional backend threat type */
  threat_type?: string;
  /** Threat severity */
  severity: ThreatLevel;
  /** Detection confidence (0.0-1.0) */
  confidence: number;
  /** Patterns that were matched */
  patterns_matched: string[];
  /** Optional excerpts from the document */
  excerpts?: string[];
  /** Detected injection vectors */
  injection_vectors: InjectionVector[];
  /** Detected operational targets */
  operational_targets: OperationalTarget[];
  /** Additional metadata */
  metadata?: DocumentThreatMetadata;
}

/**
 * Cross-document threat (affects multiple documents)
 */
export interface CrossDocumentThreat {
  /** Type of cross-document threat */
  threat_type: 'staged_attack' | 'coordinated_instructions' | 'temporal_chain';
  /** Threat severity */
  severity: ThreatLevel;
  /** Detection confidence (0.0-1.0) */
  confidence: number;
  /** IDs of all affected documents */
  document_ids: string[];
  /** Threat description */
  description: string;
  /** Matched patterns */
  patterns: string[];
  /** Additional metadata */
  metadata?: CrossDocumentThreatMetadata;
}

/**
 * 5-dimensional taxonomy classification
 */
export interface TaxonomyClassification {
  /** Detected injection vectors */
  injection_vectors: InjectionVector[];
  /** Detected operational targets */
  operational_targets: OperationalTarget[];
  /** Detected persistence mechanisms */
  persistence_mechanisms: PersistenceMechanism[];
  /** Relevant enterprise contexts */
  enterprise_contexts: EnterpriseContext[];
  /** Overall detection complexity */
  detection_complexity: DetectionComplexity;
}

/**
 * RAG context analysis results
 */
export interface ContextAnalysis {
  /** Document-level threats */
  document_threats: DocumentThreat[];
  /** Cross-document threats */
  cross_document_threats: CrossDocumentThreat[];
  /** Processing statistics */
  statistics: RAGStatistics;
  is_safe?: boolean;
  overall_severity?: ThreatLevel;
  overall_confidence?: number;
  injection_vectors?: InjectionVector[];
  operational_targets?: OperationalTarget[];
  persistence_mechanisms?: PersistenceMechanism[];
  enterprise_contexts?: EnterpriseContext[];
  detection_complexity?: DetectionComplexity;
  scan_id?: string;
  scan_timestamp?: string;
  processing_time_ms?: number;
  metadata?: Record<string, any>;
}

/**
 * RAG scan configuration
 */
export interface RAGScanConfig {
  /** Minimum confidence threshold (0.0-1.0) */
  min_confidence?: number;
  /** Enable cross-document threat analysis */
  enable_cross_document_analysis?: boolean;
  /** Maximum number of documents to scan */
  max_documents?: number;
}

/**
 * RAG scan response
 */
export interface RAGScanResponse {
  /** Overall safety assessment */
  is_safe: boolean;
  /** Optional scan identifier */
  scan_id?: string;
  /** Overall threat severity */
  overall_severity: ThreatLevel;
  /** Overall detection confidence (0.0-1.0) */
  overall_confidence: number;
  /** 5-dimensional taxonomy classification */
  taxonomy?: TaxonomyClassification;
  /** Context analysis results */
  context_analysis: ContextAnalysis;
  /** Top-level query analysis */
  query_analysis?: QueryAnalysis | null;
  /** End-to-end processing time */
  processing_time_ms?: number;
  /** Request ID */
  request_id?: string;
  /** Timestamp */
  timestamp?: string;
}

/**
 * RAG scan request
 */
export interface RAGScanRequest {
  /** User's original query/prompt */
  user_query: string;
  /** Documents to scan */
  documents: RAGDocument[];
  /** Optional configuration */
  config?: RAGScanConfig;
}

export interface ToolScanRequest {
  tool_name: string;
  args?: unknown;
  context?: ToolTrustContext;
}

/**
 * RAG batch scan request item
 */
export interface RAGBatchScanItem {
  /** User query */
  user_query: string;
  /** Documents to scan */
  documents: RAGDocument[];
  /** Optional config override */
  config?: RAGScanConfig;
}
