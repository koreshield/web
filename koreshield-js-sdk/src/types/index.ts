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

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'attack_detected' | 'request_blocked' | 'sanitization_applied';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details?: Record<string, any>;
  requestId?: string;
}

export interface MetricsResponse {
  requests_total: number;
  requests_blocked: number;
  attacks_detected: number;
  avg_response_time: number;
  active_connections: number;
  uptime_seconds: number;
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
  /** Threat severity */
  severity: ThreatLevel;
  /** Detection confidence (0.0-1.0) */
  confidence: number;
  /** Patterns that were matched */
  patterns_matched: string[];
  /** Detected injection vectors */
  injection_vectors: InjectionVector[];
  /** Detected operational targets */
  operational_targets: OperationalTarget[];
  /** Additional metadata */
  metadata?: Record<string, any>;
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
  metadata?: Record<string, any>;
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
  statistics: Record<string, any>;
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
  /** Overall threat severity */
  overall_severity: ThreatLevel;
  /** Overall detection confidence (0.0-1.0) */
  overall_confidence: number;
  /** 5-dimensional taxonomy classification */
  taxonomy: TaxonomyClassification;
  /** Context analysis results */
  context_analysis: ContextAnalysis;
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