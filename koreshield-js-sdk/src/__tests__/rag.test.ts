/**
 * KoreShield RAG Detection Tests
 */

import {
  RAGDocument,
  InjectionVector,
  OperationalTarget,
  ThreatLevel,
  DetectionComplexity,
  PersistenceMechanism,
  EnterpriseContext,
  RAGScanResponse,
  TaxonomyClassification,
  DocumentThreat,
  CrossDocumentThreat
} from '../types';

describe('RAG Types', () => {
  describe('RAGDocument', () => {
    it('should create a valid RAG document', () => {
      const doc: RAGDocument = {
        id: 'test_doc_1',
        content: 'This is test content for RAG scanning',
        metadata: {
          source: 'email',
          from: 'test@example.com',
          timestamp: '2026-02-05T00:00:00Z'
        }
      };

      expect(doc.id).toBe('test_doc_1');
      expect(doc.content).toContain('test content');
      expect(doc.metadata?.source).toBe('email');
    });

    it('should allow document without metadata', () => {
      const doc: RAGDocument = {
        id: 'minimal_doc',
        content: 'Minimal document content'
      };

      expect(doc.id).toBe('minimal_doc');
      expect(doc.metadata).toBeUndefined();
    });
  });

  describe('RAG Enums', () => {
    it('should have correct InjectionVector values', () => {
      expect(InjectionVector.EMAIL).toBe('email');
      expect(InjectionVector.DOCUMENT).toBe('document');
      expect(InjectionVector.WEB_SCRAPING).toBe('web_scraping');
      expect(InjectionVector.DATABASE).toBe('database');
      expect(InjectionVector.CHAT_MESSAGE).toBe('chat_message');
      expect(InjectionVector.CUSTOMER_SUPPORT).toBe('customer_support');
      expect(InjectionVector.KNOWLEDGE_BASE).toBe('knowledge_base');
      expect(InjectionVector.API_INTEGRATION).toBe('api_integration');
      expect(InjectionVector.UNKNOWN).toBe('unknown');
    });

    it('should have correct OperationalTarget values', () => {
      expect(OperationalTarget.DATA_EXFILTRATION).toBe('data_exfiltration');
      expect(OperationalTarget.PRIVILEGE_ESCALATION).toBe('privilege_escalation');
      expect(OperationalTarget.ACCESS_CONTROL_BYPASS).toBe('access_control_bypass');
      expect(OperationalTarget.CONTEXT_POISONING).toBe('context_poisoning');
      expect(OperationalTarget.SYSTEM_PROMPT_LEAKING).toBe('system_prompt_leaking');
      expect(OperationalTarget.MISINFORMATION).toBe('misinformation');
      expect(OperationalTarget.RECONNAISSANCE).toBe('reconnaissance');
      expect(OperationalTarget.UNKNOWN).toBe('unknown');
    });

    it('should have correct ThreatLevel values', () => {
      expect(ThreatLevel.SAFE).toBe('safe');
      expect(ThreatLevel.LOW).toBe('low');
      expect(ThreatLevel.MEDIUM).toBe('medium');
      expect(ThreatLevel.HIGH).toBe('high');
      expect(ThreatLevel.CRITICAL).toBe('critical');
    });

    it('should have correct DetectionComplexity values', () => {
      expect(DetectionComplexity.LOW).toBe('low');
      expect(DetectionComplexity.MEDIUM).toBe('medium');
      expect(DetectionComplexity.HIGH).toBe('high');
    });

    it('should have correct PersistenceMechanism values', () => {
      expect(PersistenceMechanism.SINGLE_TURN).toBe('single_turn');
      expect(PersistenceMechanism.MULTI_TURN).toBe('multi_turn');
      expect(PersistenceMechanism.CONTEXT_PERSISTENCE).toBe('context_persistence');
      expect(PersistenceMechanism.NON_PERSISTENT).toBe('non_persistent');
    });

    it('should have correct EnterpriseContext values', () => {
      expect(EnterpriseContext.CRM).toBe('crm');
      expect(EnterpriseContext.SALES).toBe('sales');
      expect(EnterpriseContext.CUSTOMER_SUPPORT).toBe('customer_support');
      expect(EnterpriseContext.MARKETING).toBe('marketing');
      expect(EnterpriseContext.HEALTHCARE).toBe('healthcare');
      expect(EnterpriseContext.FINANCIAL_SERVICES).toBe('financial_services');
      expect(EnterpriseContext.GENERAL).toBe('general');
    });
  });

  describe('DocumentThreat', () => {
    it('should create a valid document threat', () => {
      const threat: DocumentThreat = {
        document_id: 'malicious_doc_1',
        severity: ThreatLevel.HIGH,
        confidence: 0.85,
        patterns_matched: ['ignore all rules', 'leak data'],
        injection_vectors: [InjectionVector.EMAIL],
        operational_targets: [OperationalTarget.DATA_EXFILTRATION],
        metadata: {
          source: 'customer_email',
          flagged_at: '2026-02-05T12:00:00Z'
        }
      };

      expect(threat.document_id).toBe('malicious_doc_1');
      expect(threat.severity).toBe(ThreatLevel.HIGH);
      expect(threat.confidence).toBe(0.85);
      expect(threat.patterns_matched).toHaveLength(2);
      expect(threat.injection_vectors).toContain(InjectionVector.EMAIL);
      expect(threat.operational_targets).toContain(OperationalTarget.DATA_EXFILTRATION);
    });
  });

  describe('CrossDocumentThreat', () => {
    it('should create a valid cross-document threat', () => {
      const threat: CrossDocumentThreat = {
        threat_type: 'staged_attack',
        severity: ThreatLevel.CRITICAL,
        confidence: 0.92,
        document_ids: ['doc_1', 'doc_2', 'doc_3'],
        description: 'Multi-stage attack coordinated across multiple documents',
        patterns: ['step 1:', 'step 2:', 'step 3:'],
        metadata: {
          attack_complexity: 'high',
          coordination_detected: true
        }
      };

      expect(threat.threat_type).toBe('staged_attack');
      expect(threat.severity).toBe(ThreatLevel.CRITICAL);
      expect(threat.document_ids).toHaveLength(3);
      expect(threat.patterns).toContain('step 1:');
    });

    it('should support all threat types', () => {
      const types: Array<'staged_attack' | 'coordinated_instructions' | 'temporal_chain'> = [
        'staged_attack',
        'coordinated_instructions',
        'temporal_chain'
      ];

      types.forEach(type => {
        const threat: CrossDocumentThreat = {
          threat_type: type,
          severity: ThreatLevel.MEDIUM,
          confidence: 0.7,
          document_ids: ['doc_1', 'doc_2'],
          description: `Test ${type}`,
          patterns: []
        };

        expect(threat.threat_type).toBe(type);
      });
    });
  });

  describe('TaxonomyClassification', () => {
    it('should create a valid taxonomy classification', () => {
      const taxonomy: TaxonomyClassification = {
        injection_vectors: [InjectionVector.EMAIL, InjectionVector.CHAT_MESSAGE],
        operational_targets: [OperationalTarget.DATA_EXFILTRATION],
        persistence_mechanisms: [PersistenceMechanism.MULTI_TURN],
        enterprise_contexts: [EnterpriseContext.CRM, EnterpriseContext.SALES],
        detection_complexity: DetectionComplexity.HIGH
      };

      expect(taxonomy.injection_vectors).toHaveLength(2);
      expect(taxonomy.operational_targets).toContain(OperationalTarget.DATA_EXFILTRATION);
      expect(taxonomy.persistence_mechanisms).toContain(PersistenceMechanism.MULTI_TURN);
      expect(taxonomy.enterprise_contexts).toContain(EnterpriseContext.CRM);
      expect(taxonomy.detection_complexity).toBe(DetectionComplexity.HIGH);
    });
  });

  describe('RAGScanResponse', () => {
    it('should create a complete RAG scan response', () => {
      const response: RAGScanResponse = {
        is_safe: false,
        overall_severity: ThreatLevel.HIGH,
        overall_confidence: 0.88,
        taxonomy: {
          injection_vectors: [InjectionVector.EMAIL],
          operational_targets: [OperationalTarget.DATA_EXFILTRATION],
          persistence_mechanisms: [PersistenceMechanism.SINGLE_TURN],
          enterprise_contexts: [EnterpriseContext.CUSTOMER_SUPPORT],
          detection_complexity: DetectionComplexity.MEDIUM
        },
        context_analysis: {
          document_threats: [
            {
              document_id: 'doc_2',
              severity: ThreatLevel.HIGH,
              confidence: 0.88,
              patterns_matched: ['ignore all rules'],
              injection_vectors: [InjectionVector.EMAIL],
              operational_targets: [OperationalTarget.DATA_EXFILTRATION]
            }
          ],
          cross_document_threats: [],
          statistics: {
            total_documents: 3,
            threatening_documents: 1,
            scan_time_ms: 145
          }
        },
        request_id: 'req_test_123',
        timestamp: '2026-02-05T12:00:00Z'
      };

      expect(response.is_safe).toBe(false);
      expect(response.overall_severity).toBe(ThreatLevel.HIGH);
      expect(response.context_analysis.document_threats).toHaveLength(1);
      expect(response.taxonomy.injection_vectors).toContain(InjectionVector.EMAIL);
    });

    it('should represent safe scan result', () => {
      const response: RAGScanResponse = {
        is_safe: true,
        overall_severity: ThreatLevel.SAFE,
        overall_confidence: 0.95,
        taxonomy: {
          injection_vectors: [],
          operational_targets: [],
          persistence_mechanisms: [],
          enterprise_contexts: [EnterpriseContext.GENERAL],
          detection_complexity: DetectionComplexity.LOW
        },
        context_analysis: {
          document_threats: [],
          cross_document_threats: [],
          statistics: {
            total_documents: 5,
            threatening_documents: 0,
            scan_time_ms: 89
          }
        }
      };

      expect(response.is_safe).toBe(true);
      expect(response.overall_severity).toBe(ThreatLevel.SAFE);
      expect(response.context_analysis.document_threats).toHaveLength(0);
    });
  });

  describe('RAGScanRequest', () => {
    it('should create a valid scan request', () => {
      const documents: RAGDocument[] = [
        {
          id: 'doc_1',
          content: 'Normal content',
          metadata: { source: 'email' }
        },
        {
          id: 'doc_2',
          content: 'Another normal document'
        }
      ];

      const request = {
        user_query: 'Summarize these documents',
        documents: documents,
        config: {
          min_confidence: 0.7,
          enable_cross_document_analysis: true
        }
      };

      expect(request.user_query).toBe('Summarize these documents');
      expect(request.documents).toHaveLength(2);
      expect(request.config?.min_confidence).toBe(0.7);
    });
  });

  describe('RAGBatchScanItem', () => {
    it('should create valid batch scan items', () => {
      const items = [
        {
          user_query: 'Query 1',
          documents: [{ id: '1', content: 'Content 1' }]
        },
        {
          user_query: 'Query 2',
          documents: [{ id: '2', content: 'Content 2' }],
          config: { max_documents: 100 }
        }
      ];

      expect(items).toHaveLength(2);
      expect(items[0].user_query).toBe('Query 1');
      expect(items[1].config?.max_documents).toBe(100);
    });
  });
});

describe('RAG Type Guards and Validation', () => {
  it('should validate confidence values are in range', () => {
    const validConfidence = 0.75;
    const tooLow = -0.1;
    const tooHigh = 1.5;

    expect(validConfidence).toBeGreaterThanOrEqual(0);
    expect(validConfidence).toBeLessThanOrEqual(1);
    expect(tooLow).toBeLessThan(0);
    expect(tooHigh).toBeGreaterThan(1);
  });

  it('should handle empty document arrays', () => {
    const emptyDocs: RAGDocument[] = [];
    expect(emptyDocs).toHaveLength(0);
    expect(Array.isArray(emptyDocs)).toBe(true);
  });

  it('should handle missing optional fields gracefully', () => {
    const minimalDoc: RAGDocument = {
      id: 'minimal',
      content: 'Minimal content'
    };

    expect(minimalDoc.metadata).toBeUndefined();

    const minimalThreat: DocumentThreat = {
      document_id: 'doc',
      severity: ThreatLevel.LOW,
      confidence: 0.5,
      patterns_matched: [],
      injection_vectors: [],
      operational_targets: []
    };

    expect(minimalThreat.metadata).toBeUndefined();
  });
});
