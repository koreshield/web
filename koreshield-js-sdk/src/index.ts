/**
 * KoreShield JavaScript/TypeScript SDK
 *
 * A comprehensive SDK for integrating with KoreShield LLM Security Proxy
 *
 * @packageDocumentation
 */

// Core exports
export { KoreShieldClient } from './core/client';

// Browser-optimized client
export { BrowserKoreShieldClient } from './browser/client';

// Node.js streaming support
export { StreamingClient } from './node/streaming';
export type { StreamOptions } from './node/streaming';

// Provider wrappers
export { KoreShieldOpenAI, createKoreShieldOpenAI } from './providers/openai';
export {
  normalizeText,
  preflightScanPrompt,
  preflightScanToolCall,
  preflightScanRAGContext,
} from './local/security';

// Utility functions
export {
  validateConfig,
  createClient,
  sanitizeInput,
  checkResponseSafety,
  formatMessages,
  sleep,
  retry
} from './utils';

// Error recovery and retry logic
export {
  retryWithBackoff,
  CircuitBreaker,
  FallbackHandler,
  RateLimiter,
  BatchHandler
} from './utils/recovery';
export type { RetryOptions, CircuitBreakerOptions } from './utils/recovery';

// Framework integrations - React
export {
  useKoreShield,
  useChatCompletion,
  useStreamingChat,
  useSecurityEvents,
  useMetrics
} from './integrations/react';

// Framework integrations - Vue
export {
  useKoreShield as useKoreShieldVue,
  useChatCompletion as useChatCompletionVue,
  useStreamingChat as useStreamingChatVue,
  useSecurityEvents as useSecurityEventsVue,
  useMetrics as useMetricsVue
} from './integrations/vue';

// Framework integrations - Angular (services)
export {
  KoreShieldService,
  ChatCompletionService,
  SecurityEventsService,
  MetricsService
} from './integrations/angular';

// Types
export {
  ThreatLevel,
  DetectionType,
  InjectionVector,
  OperationalTarget,
  PersistenceMechanism,
  EnterpriseContext,
  DetectionComplexity,
  ToolRiskClass,
  ToolCapability,
} from './types';

export type {
  KoreShieldConfig,
  SecurityOptions,
  SecurityFeatures,
  SensitivityLevel,
  SecurityAction,
  ChatMessageRole,
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  AuditLogEntry,
  AuditLogResponse,
  SecurityEvent,
  MetricsResponse,
  PerformanceMetrics,
  SecurityPolicy,
  KoreShieldError,
  ProviderType,
  ProviderConfig,
  RAGDocument,
  DocumentThreat,
  DocumentThreatMetadata,
  CrossDocumentThreat,
  CrossDocumentThreatMetadata,
  TaxonomyClassification,
  ContextAnalysis,
  QueryAnalysis,
  RAGStatistics,
  RAGScanConfig,
  RAGScanResponse,
  RAGScanRequest,
  RAGBatchScanItem,
  ToolScanPolicyResult,
  ToolScanRequest,
  ToolScanResponse,
  NormalizationResult,
  LocalThreatIndicator,
  PreflightScanResult,
  ToolCallPreflightResult,
  RAGPreflightDocumentResult,
  RAGPreflightResult,
} from './types';

// Default export
export { KoreShieldClient as default } from './core/client';
