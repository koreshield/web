import {
  DetectionType,
  type LocalThreatIndicator,
  type NormalizationResult,
  type PreflightScanResult,
  type RAGDocument,
  type RAGPreflightDocumentResult,
  type RAGPreflightResult,
  ToolCapability,
  type ToolCallPreflightResult,
  ToolRiskClass,
  ThreatLevel,
} from '../types';

const invisibleChars = /[\u200B\u200C\u200D\uFEFF\u00AD\u034F\u061C\u2060\u2061\u2062\u2063\u2064]/g;
const whitespace = /\s+/g;
const markdownLinks = /\[([^\]]+)\]\(([^)]+)\)/g;
const markdownHeaders = /^\s{0,3}#{1,6}\s+/gm;
const base64Pattern = /^[A-Za-z0-9+/=\s]+$/;
const toolRiskNames = ['bash', 'shell', 'terminal', 'exec', 'fetch', 'http_request', 'sql', 'database', 'write_file', 'delete_file'];

const homoglyphMap: Record<string, string> = {
  '\u0430': 'a',
  '\u0435': 'e',
  '\u043E': 'o',
  '\u0440': 'p',
  '\u0441': 'c',
  '\u0445': 'x',
  '\u0456': 'i',
  '\u03BF': 'o',
  '\u03B1': 'a',
  '\u03B5': 'e',
  '\u03C1': 'p',
  '\u03C7': 'x',
};

const leetMap: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '$': 's',
};

const weightedPatterns = [
  {
    type: DetectionType.PATTERN,
    category: 'instruction_override',
    severity: ThreatLevel.HIGH,
    score: 0.35,
    regex: /ignore\s+(?:all\s+)?(?:previous|prior|above|earlier)\s+(?:instructions|rules|prompts|guidelines|context)/i,
    description: 'Attempts to override prior instructions.',
  },
  {
    type: DetectionType.PATTERN,
    category: 'system_prompt_spoof',
    severity: ThreatLevel.HIGH,
    score: 0.3,
    regex: /\[\s*(?:system|admin|developer|override)\s*:?.*?\]/i,
    description: 'Spoofed system or admin directive.',
  },
  {
    type: DetectionType.PATTERN,
    category: 'developer_mode',
    severity: ThreatLevel.HIGH,
    score: 0.3,
    regex: /\b(?:developer|debug|dan|god)\s+mode\b/i,
    description: 'References jailbreak or developer mode phrasing.',
  },
  {
    type: DetectionType.PATTERN,
    category: 'prompt_leakage',
    severity: ThreatLevel.HIGH,
    score: 0.4,
    regex: /(?:reveal|show|display|leak)\s+(?:your\s+)?(?:system\s+prompt|instructions?|hidden\s+prompt)/i,
    description: 'Attempts to extract hidden model instructions.',
  },
  {
    type: DetectionType.PATTERN,
    category: 'data_exfiltration',
    severity: ThreatLevel.HIGH,
    score: 0.35,
    regex: /(?:send|upload|transmit|export)\s+(?:all\s+|the\s+)?(?:data|credentials|passwords|secrets?)/i,
    description: 'Attempts to exfiltrate sensitive data.',
  },
];

function decodeBase64(input: string): string {
  const compact = input.trim();
  if (compact.length < 24 || compact.length % 4 !== 0 || !base64Pattern.test(compact)) {
    return input;
  }

  const isMostlyPrintable = (value: string): boolean => {
    if (!value) {
      return false;
    }
    const printable = Array.from(value).filter((char) => {
      const code = char.charCodeAt(0);
      return char === '\n' || char === '\r' || char === '\t' || (code >= 32 && code <= 126);
    }).length;
    return printable / value.length >= 0.85;
  };

  try {
    if (typeof atob === 'function') {
      const decoded = atob(compact);
      return isMostlyPrintable(decoded) ? decoded : input;
    }
  } catch {
    return input;
  }

  try {
    const maybeBuffer = (globalThis as { Buffer?: { from(input: string, encoding: string): { toString(enc: string): string } } }).Buffer;
    if (!maybeBuffer) {
      return input;
    }
    const decoded = maybeBuffer.from(compact, 'base64').toString('utf-8');
    return isMostlyPrintable(decoded) ? decoded : input;
  } catch {
    return input;
  }
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function normalizeText(input: string): NormalizationResult {
  let normalized = input;
  const layers: string[] = [];

  const unicodeNormalized = normalized.normalize('NFKC');
  if (unicodeNormalized !== normalized) {
    normalized = unicodeNormalized;
    layers.push('unicode_nfkc');
  }

  const htmlDecoded = decodeHtmlEntities(normalized);
  if (htmlDecoded !== normalized) {
    normalized = htmlDecoded;
    layers.push('html_entities');
  }

  const urlDecoded = (() => {
    try {
      return decodeURIComponent(normalized);
    } catch {
      return normalized;
    }
  })();
  if (urlDecoded !== normalized) {
    normalized = urlDecoded;
    layers.push('url_decode');
  }

  const invisibleStripped = normalized.replace(invisibleChars, '');
  if (invisibleStripped !== normalized) {
    normalized = invisibleStripped;
    layers.push('invisible_strip');
  }

  const homoglyphNormalized = Array.from(normalized).map((char) => homoglyphMap[char] ?? char).join('');
  if (homoglyphNormalized !== normalized) {
    normalized = homoglyphNormalized;
    layers.push('homoglyph_map');
  }

  const base64Decoded = decodeBase64(normalized);
  if (base64Decoded !== normalized) {
    normalized = base64Decoded;
    layers.push('base64_decode');
  }

  const leetNormalized = Array.from(normalized).map((char) => leetMap[char] ?? char).join('');
  if (leetNormalized !== normalized) {
    normalized = leetNormalized;
    layers.push('leet_map');
  }

  const markdownStripped = normalized
    .replace(markdownLinks, '$1')
    .replace(/```/g, ' ')
    .replace(/`/g, ' ')
    .replace(markdownHeaders, '');
  if (markdownStripped !== normalized) {
    normalized = markdownStripped;
    layers.push('markdown_strip');
  }

  const collapsed = normalized.replace(whitespace, ' ').trim();
  if (collapsed !== normalized) {
    normalized = collapsed;
    layers.push('whitespace_collapse');
  }

  return {
    original: input,
    normalized,
    layers,
  };
}

function severityWeight(level: ThreatLevel): number {
  switch (level) {
    case ThreatLevel.CRITICAL:
      return 4;
    case ThreatLevel.HIGH:
      return 3;
    case ThreatLevel.MEDIUM:
      return 2;
    case ThreatLevel.LOW:
      return 1;
    default:
      return 0;
  }
}

function maxSeverity(indicators: LocalThreatIndicator[]): ThreatLevel {
  return indicators.reduce<ThreatLevel>((current, next) => (
    severityWeight(next.severity) > severityWeight(current) ? next.severity : current
  ), ThreatLevel.SAFE);
}

function toolCapabilities(toolName: string, serializedArgs: string): ToolCapability[] {
  const lowered = `${toolName} ${serializedArgs}`.toLowerCase();
  const capabilities: ToolCapability[] = [];
  const patterns: Array<[ToolCapability, string[]]> = [
    [ToolCapability.EXECUTION, ['bash', 'shell', 'terminal', 'exec', 'run', 'command']],
    [ToolCapability.NETWORK, ['fetch', 'http', 'request', 'webhook', 'url', 'download', 'upload']],
    [ToolCapability.DATABASE, ['sql', 'database', 'query', 'postgres', 'mysql']],
    [ToolCapability.WRITE, ['write', 'delete', 'update', 'modify', 'save']],
    [ToolCapability.READ, ['read', 'cat', 'open', 'list', 'search']],
    [ToolCapability.CREDENTIAL_ACCESS, ['secret', 'token', 'password', 'credential', 'ssh', 'key']],
  ];

  for (const [capability, keywords] of patterns) {
    if (keywords.some((keyword) => lowered.includes(keyword))) {
      capabilities.push(capability);
    }
  }

  return capabilities;
}

function toolRiskClass(capabilities: ToolCapability[], promptScan: PreflightScanResult): ToolRiskClass {
  if (
    (promptScan.threatLevel === ThreatLevel.HIGH || promptScan.threatLevel === ThreatLevel.CRITICAL)
    && capabilities.some((capability) => [ToolCapability.EXECUTION, ToolCapability.NETWORK, ToolCapability.CREDENTIAL_ACCESS].includes(capability))
  ) {
    return ToolRiskClass.CRITICAL;
  }
  if (
    promptScan.threatLevel === ThreatLevel.HIGH
    || promptScan.threatLevel === ThreatLevel.CRITICAL
    || capabilities.some((capability) => [ToolCapability.EXECUTION, ToolCapability.CREDENTIAL_ACCESS].includes(capability))
  ) {
    return ToolRiskClass.HIGH;
  }
  if (capabilities.length) {
    return ToolRiskClass.MEDIUM;
  }
  return ToolRiskClass.LOW;
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/\b[a-z0-9]{3,}\b/g) ?? []).filter(
    (token) => !['the', 'and', 'for', 'with', 'this', 'that', 'from'].includes(token),
  );
}

function querySimilarity(userQuery: string, content: string): number {
  const queryTokens = new Set(tokenize(userQuery));
  const contentTokens = new Set(tokenize(content.slice(0, 3000)));
  if (queryTokens.size === 0 || contentTokens.size === 0) {
    return 0;
  }

  const intersection = [...queryTokens].filter((token) => contentTokens.has(token)).length;
  const union = new Set([...queryTokens, ...contentTokens]).size;
  return union === 0 ? 0 : intersection / union;
}

function directiveScore(content: string): number {
  const lowered = content.toLowerCase();
  const phrases: Record<string, number> = {
    'ignore all previous instructions': 0.35,
    'ignore previous instructions': 0.3,
    override: 0.18,
    bypass: 0.18,
    reveal: 0.18,
    leak: 0.18,
    'from now on': 0.2,
    'you must': 0.18,
    'you are now': 0.18,
    'system:': 0.16,
    '[system': 0.18,
    execute: 0.14,
    ignore: 0.08,
  };

  const totalWeight = Object.entries(phrases).reduce((sum, [phrase, weight]) => (
    lowered.includes(phrase) ? sum + weight : sum
  ), 0);

  const tokenCount = Math.max((lowered.match(/\b\w+\b/g) ?? []).length, 1);
  return Math.min(totalWeight / Math.max(tokenCount / 30, 1), 1);
}

export function preflightScanPrompt(input: string): PreflightScanResult {
  const normalization = normalizeText(input);
  const indicators: LocalThreatIndicator[] = [];
  let confidence = 0;

  for (const pattern of weightedPatterns) {
    if (pattern.regex.test(normalization.normalized)) {
      indicators.push({
        type: pattern.type,
        severity: pattern.severity,
        confidence: pattern.score,
        description: pattern.description,
        metadata: {
          category: pattern.category,
        },
      });
      confidence += pattern.score;
    }
  }

  if (input.includes('```') && /(system|instruction)/i.test(normalization.normalized)) {
    indicators.push({
      type: DetectionType.PATTERN,
      severity: ThreatLevel.HIGH,
      confidence: 0.3,
      description: 'Instruction-like content embedded in a code block.',
      metadata: { category: 'code_block_injection' },
    });
    confidence += 0.3;
  }

  if (/(?:you are|act as|pretend to be)/i.test(normalization.normalized)) {
    indicators.push({
      type: DetectionType.KEYWORD,
      severity: ThreatLevel.MEDIUM,
      confidence: 0.25,
      description: 'Role manipulation phrasing detected.',
      metadata: { category: 'role_hijack' },
    });
    confidence += 0.25;
  }

  if (normalization.layers.includes('base64_decode')) {
    indicators.push({
      type: DetectionType.PATTERN,
      severity: ThreatLevel.HIGH,
      confidence: 0.4,
      description: 'Encoded content required normalization before analysis.',
      metadata: { category: 'encoding_attempt' },
    });
    confidence += 0.4;
  }

  const threatLevel = maxSeverity(indicators);
  const normalizedConfidence = Math.min(confidence, 1);
  const suggestedAction = threatLevel === ThreatLevel.HIGH || threatLevel === ThreatLevel.CRITICAL
    ? 'block'
    : threatLevel === ThreatLevel.MEDIUM
      ? 'warn'
      : 'allow';

  return {
    blocked: suggestedAction === 'block',
    isSafe: indicators.length === 0,
    threatLevel,
    confidence: normalizedConfidence,
    normalization,
    indicators,
    suggestedAction,
  };
}

export function preflightScanToolCall(toolName: string, args: unknown): ToolCallPreflightResult {
  const serializedArgs = typeof args === 'string' ? args : JSON.stringify(args ?? {});
  const promptScan = preflightScanPrompt(`${toolName} ${serializedArgs}`);
  const riskyTool = toolRiskNames.some((candidate) => toolName.toLowerCase().includes(candidate));
  const capabilitySignals = toolCapabilities(toolName, serializedArgs);
  const riskClass = toolRiskClass(capabilitySignals, promptScan);
  const reasons: string[] = [];

  if (riskyTool) {
    reasons.push(`Tool "${toolName}" is in the higher-risk execution class.`);
  }
  if (!promptScan.isSafe) {
    reasons.push('Tool arguments contain prompt-injection or exfiltration signals.');
  }
  if (capabilitySignals.length) {
    reasons.push(`Capability signals: ${capabilitySignals.join(', ')}`);
  }

  return {
    ...promptScan,
    toolName,
    riskyTool,
    reasons,
    riskClass,
    capabilitySignals,
    reviewRequired: riskClass === ToolRiskClass.HIGH || riskClass === ToolRiskClass.CRITICAL,
  };
}

export function preflightScanRAGContext(userQuery: string, documents: RAGDocument[]): RAGPreflightResult {
  const documentResults: RAGPreflightDocumentResult[] = documents.map((document) => {
    const scan = preflightScanPrompt(document.content);
    const similarity = querySimilarity(userQuery, scan.normalization.normalized);
    const directiveDensity = directiveScore(scan.normalization.normalized);
    const mismatchBoost = similarity <= 0.15 && directiveDensity >= 0.12;

    const boostedConfidence = Math.min(scan.confidence + (mismatchBoost ? 0.2 : 0) + (directiveDensity >= 0.18 ? 0.15 : 0), 1);
    const indicators = [...scan.indicators];

    if (directiveDensity >= 0.18) {
      indicators.push({
        type: DetectionType.PATTERN,
        severity: ThreatLevel.MEDIUM,
        confidence: 0.15,
        description: 'High directive density detected in retrieved content.',
        metadata: { category: 'directive_density' },
      });
    }

    if (mismatchBoost) {
      indicators.push({
        type: DetectionType.PATTERN,
        severity: ThreatLevel.HIGH,
        confidence: 0.2,
        description: 'Directive-heavy content appears unrelated to the user query.',
        metadata: { category: 'query_mismatch_directive' },
      });
    }

    const threatLevel = maxSeverity(indicators);

    return {
      documentId: document.id,
      blocked: threatLevel === ThreatLevel.HIGH || threatLevel === ThreatLevel.CRITICAL,
      isSafe: indicators.length === 0,
      threatLevel,
      confidence: boostedConfidence,
      normalization: scan.normalization,
      indicators,
      suggestedAction: threatLevel === ThreatLevel.HIGH || threatLevel === ThreatLevel.CRITICAL ? 'block' : indicators.length ? 'warn' : 'allow',
      querySimilarity: similarity,
      directiveScore: directiveDensity,
      metadata: document.metadata ?? {},
    };
  });

  const unsafeDocuments = documentResults.filter((result) => !result.isSafe);
  const threatLevel = maxSeverity(documentResults.flatMap((result) => result.indicators));

  return {
    blocked: unsafeDocuments.some((result) => result.blocked),
    isSafe: unsafeDocuments.length === 0,
    threatLevel,
    confidence: documentResults.length ? Math.max(...documentResults.map((result) => result.confidence)) : 0,
    userQuery,
    documents: documentResults,
    suggestedAction: unsafeDocuments.some((result) => result.blocked) ? 'block' : unsafeDocuments.length ? 'warn' : 'allow',
  };
}
