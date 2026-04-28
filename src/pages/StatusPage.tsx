import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  Info,
  ExternalLink,
  Calendar,
  Bell,
} from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';
import { api } from '../lib/api-client';

type ComponentStatus = 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance';
type IncidentSeverity = 'critical' | 'major' | 'minor' | 'maintenance';
type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved' | 'scheduled';

interface Component {
  id: string;
  name: string;
  description: string;
  status: ComponentStatus;
  uptime: number | null;
  responseTime?: number | null;
  lastChecked: Date;
}

interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedComponents: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  updates: IncidentUpdate[];
}

interface IncidentUpdate {
  message: string;
  timestamp: Date;
  status: IncidentStatus;
}

interface UptimeDay {
  date: Date;
  uptime: number;
  incidents: number;
}

interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  affectedComponents: string[];
  status: 'scheduled' | 'in_progress' | 'completed';
}

interface StatusApiResponse {
  status?: string;
  version?: string;
  statistics?: {
    requests_total?: number;
    requests_allowed?: number;
    requests_blocked?: number;
    attacks_detected?: number;
    errors?: number;
  };
  providers?: Record<string, {
    enabled?: boolean;
    credentials_present?: boolean;
    initialized?: boolean;
    priority?: number | null;
    type?: string | null;
    status?: string;
    base_url?: string | null;
    missing_env_vars?: string[];
    present_env_vars?: string[];
    healthy?: boolean;
    response_time_ms?: number;
    error?: string;
  }>;
  total_providers?: number;
  enabled_providers?: number;
  initialized_providers?: number;
  components?: Record<string, { status?: ComponentStatus; detail?: string }>;
}

interface OperationalStatusResponse extends StatusApiResponse {
  incidents?: Array<{
    id: string;
    title: string;
    severity: IncidentSeverity;
    status: IncidentStatus;
    affected_components?: string[];
    created_at: string;
    updated_at: string;
    resolved_at?: string | null;
    updates?: Array<{
      message: string;
      timestamp: string;
      status: IncidentStatus;
    }>;
  }>;
  maintenance_windows?: Array<{
    id: string;
    title: string;
    description: string;
    scheduled_start: string;
    scheduled_end: string;
    affected_components?: string[];
    status: 'scheduled' | 'in_progress' | 'completed';
  }>;
  uptime_history?: Array<{
    date: string;
    uptime_percentage: number;
    incidents: number;
    sample_count?: number;
  }>;
  evidence?: {
    snapshot_count?: number;
    first_recorded_at?: string | null;
    last_recorded_at?: string | null;
    incident_count?: number;
    maintenance_count?: number;
    breach_record_count?: number;
    retention_days?: number;
  };
}

interface ProviderHealthApiResponse {
  providers?: Record<string, {
    enabled?: boolean;
    credentials_present?: boolean;
    initialized?: boolean;
    priority?: number | null;
    type?: string | null;
    status?: string;
    base_url?: string | null;
    missing_env_vars?: string[];
    present_env_vars?: string[];
    healthy?: boolean;
    response_time_ms?: number;
    error?: string;
  }>;
  total_providers?: number;
  enabled_providers?: number;
  healthy_providers?: number;
  initialized_providers?: number;
  configured?: boolean;
  missing_credentials?: string[];
}

type ProviderRoute = {
  id: string;
  status: string;
  enabled: boolean;
  initialized: boolean;
  credentialsPresent: boolean;
  healthy?: boolean;
  type?: string | null;
  responseTimeMs?: number;
  baseUrl?: string | null;
  missingEnvVars: string[];
  error?: string | null;
};

const COMPONENT_ORDER = [
  'api-gateway',
  'detection-engine',
  'policy-engine',
  'rag-scanner',
  'billing',
  'dashboard',
  'audit-log-stream',
  'provider-routing',
] as const;

const COMPONENT_STATUS_KEY: Record<(typeof COMPONENT_ORDER)[number], string> = {
  'api-gateway': 'api_gateway',
  'detection-engine': 'detection_engine',
  'policy-engine': 'policy_engine',
  'rag-scanner': 'rag_scanner',
  billing: 'billing',
  dashboard: 'dashboard',
  'audit-log-stream': 'audit_log_stream',
  'provider-routing': 'provider_routing',
};

const COMPONENT_CATALOG: Record<(typeof COMPONENT_ORDER)[number], Omit<Component, 'status' | 'lastChecked'>> = {
  'api-gateway': {
    id: 'api-gateway',
    name: 'API Gateway',
    description: 'Primary ingress for proxied chat, scan, and management traffic.',
    uptime: null,
    responseTime: null,
  },
  'detection-engine': {
    id: 'detection-engine',
    name: 'Detection Engine',
    description: 'Prompt injection, jailbreak, and content risk analysis.',
    uptime: null,
    responseTime: null,
  },
  'policy-engine': {
    id: 'policy-engine',
    name: 'Policy Engine',
    description: 'Rule enforcement, access controls, and runtime decisions.',
    uptime: null,
    responseTime: null,
  },
  'rag-scanner': {
    id: 'rag-scanner',
    name: 'RAG Security Scanner',
    description: 'Retrieved-document scanning, evidence extraction, and reference highlights.',
    uptime: null,
    responseTime: null,
  },
  billing: {
    id: 'billing',
    name: 'Billing and Checkout',
    description: 'Hosted billing account sync, checkout, and customer portal orchestration.',
    uptime: null,
    responseTime: null,
  },
  dashboard: {
    id: 'dashboard',
    name: 'Web Dashboard',
    description: 'Customer dashboard, onboarding surfaces, and audit workflows.',
    uptime: null,
    responseTime: null,
  },
  'audit-log-stream': {
    id: 'audit-log-stream',
    name: 'Audit Logs and Alerts',
    description: 'Security event capture, review queues, and alert rule execution.',
    uptime: null,
    responseTime: null,
  },
  'provider-routing': {
    id: 'provider-routing',
    name: 'Provider Routing',
    description: 'Per-environment model provider routing and fallback orchestration.',
    uptime: null,
    responseTime: null,
  },
};

function buildDefaultComponents(now: Date): Component[] {
  return COMPONENT_ORDER.map((id) => ({
    ...COMPONENT_CATALOG[id],
    status: 'operational',
    lastChecked: now,
  }));
}

export default function StatusPage() {
  const [components, setComponents] = useState<Component[]>(() => buildDefaultComponents(new Date()));
  const [statusSummary, setStatusSummary] = useState<StatusApiResponse | null>(null);
  const [providerHealth, setProviderHealth] = useState<ProviderHealthApiResponse | null>(null);
  const [statusError, setStatusError] = useState('');
  const [providerRoutes, setProviderRoutes] = useState<ProviderRoute[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [maintenanceWindows, setMaintenanceWindows] = useState<MaintenanceWindow[]>([]);
  const [uptimeHistory, setUptimeHistory] = useState<UptimeDay[]>([]);
  const [statusEvidence, setStatusEvidence] = useState<OperationalStatusResponse['evidence'] | null>(null);

  const getOverallStatus = (): ComponentStatus => {
    const statuses = components.map((component) => component.status);
    if (statuses.some((status) => status === 'major_outage')) return 'major_outage';
    if (statuses.some((status) => status === 'partial_outage')) return 'partial_outage';
    if (statuses.some((status) => status === 'degraded')) return 'degraded';
    if (statuses.some((status) => status === 'maintenance')) return 'maintenance';
    return 'operational';
  };

  const getAverageUptime = () => {
    if (uptimeHistory.length === 0) {
      return null;
    }
    const total = uptimeHistory.reduce((sum, day) => sum + day.uptime, 0);
    return (total / uptimeHistory.length).toFixed(2);
  };

  const getStatusColor = (status: ComponentStatus) => {
    switch (status) {
      case 'operational':
        return 'text-green-500 dark:text-green-400';
      case 'degraded':
        return 'text-yellow-500 dark:text-yellow-400';
      case 'partial_outage':
        return 'text-orange-500 dark:text-orange-400';
      case 'major_outage':
        return 'text-red-500 dark:text-red-400';
      case 'maintenance':
        return 'text-blue-500 dark:text-blue-400';
    }
  };

  const getStatusIcon = (status: ComponentStatus) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-5 h-5" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5" />;
      case 'partial_outage':
        return <AlertCircle className="w-5 h-5" />;
      case 'major_outage':
        return <XCircle className="w-5 h-5" />;
      case 'maintenance':
        return <Clock className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'major':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'minor':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'maintenance':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      const now = new Date();

      try {
        const [health, statsResponse, providerResponse, operationalResponse] = await Promise.all([
          api.getHealth(),
          api.getPublicStats(),
          api.getProviderHealth(),
          api.getOperationalStatus(),
        ]);

        const stats = statsResponse as StatusApiResponse;
        const providerState = providerResponse as ProviderHealthApiResponse;
        const operational = operationalResponse as OperationalStatusResponse;

        if (cancelled) {
          return;
        }

        const totalProviders = providerState.total_providers ?? stats.total_providers ?? 0;
        const providerSnapshot = providerState.providers || stats.providers || {};
        const configuredProviders = stats.enabled_providers ?? providerState.enabled_providers ?? Object.values(providerSnapshot).filter((provider) => provider.enabled).length;
        const requestsTotal = stats?.statistics?.requests_total ?? 0;
        const blockedTotal = stats?.statistics?.requests_blocked ?? 0;
        const initializedProviders = providerState.initialized_providers ?? stats.initialized_providers ?? Object.values(providerSnapshot).filter((provider) => provider.initialized).length;
        const backendComponents = stats.components || {};

        setStatusSummary(stats);
        setProviderHealth(providerState);
        setStatusError('');
        setStatusEvidence(operational.evidence || null);
        setIncidents(
          operational.incidents?.map((incident) => ({
            id: incident.id,
            title: incident.title,
            severity: incident.severity,
            status: incident.status,
            affectedComponents: incident.affected_components || [],
            createdAt: new Date(incident.created_at),
            updatedAt: new Date(incident.updated_at),
            resolvedAt: incident.resolved_at ? new Date(incident.resolved_at) : undefined,
            updates: (incident.updates || []).map((update) => ({
              message: update.message,
              timestamp: new Date(update.timestamp),
              status: update.status,
            })),
          })) || [],
        );
        setMaintenanceWindows(
          operational.maintenance_windows?.map((window) => ({
            id: window.id,
            title: window.title,
            description: window.description,
            scheduledStart: new Date(window.scheduled_start),
            scheduledEnd: new Date(window.scheduled_end),
            affectedComponents: window.affected_components || [],
            status: window.status,
          })) || [],
        );
        setUptimeHistory(
          operational.uptime_history?.map((day) => ({
            date: new Date(day.date),
            uptime: day.uptime_percentage,
            incidents: day.incidents,
          })) || [],
        );
        setProviderRoutes(
          Object.entries(providerSnapshot)
            .filter(([, provider]) => provider.enabled || provider.initialized || provider.credentials_present)
            .map(([providerName, provider]) => ({
              id: providerName,
              status: provider.status || (provider.healthy ? 'healthy' : provider.enabled ? 'degraded' : 'disabled'),
              enabled: Boolean(provider.enabled),
              initialized: Boolean(provider.initialized),
              credentialsPresent: Boolean(provider.credentials_present),
              healthy: provider.healthy,
              type: provider.type,
              responseTimeMs: provider.response_time_ms,
              baseUrl: provider.base_url,
              missingEnvVars: provider.missing_env_vars || [],
            })).sort((a, b) => {
              const order = ['gemini', 'azure_openai', 'deepseek'];
              const idxA = order.indexOf(a.id);
              const idxB = order.indexOf(b.id);
              if (idxA === -1 && idxB === -1) return a.id.localeCompare(b.id);
              if (idxA === -1) return 1;
              if (idxB === -1) return -1;
              return idxA - idxB;
            }),
        );
        setComponents(
          buildDefaultComponents(now).map((component) => {
            const backendComponent = backendComponents[COMPONENT_STATUS_KEY[component.id as keyof typeof COMPONENT_STATUS_KEY]];

            if (component.id === 'provider-routing') {
              return {
                ...component,
                status: backendComponent?.status || (configuredProviders > 0 ? 'operational' : 'degraded'),
                description:
                  backendComponent?.detail ||
                  (configuredProviders > 0
                    ? `Provider routing is enabled for ${configuredProviders} provider configuration${configuredProviders === 1 ? '' : 's'}, with ${initializedProviders} initialized route${initializedProviders === 1 ? '' : 's'}.`
                    : 'Provider routing is healthy, but this environment has no provider credentials configured right now.'),
              };
            }

            if (component.id === 'api-gateway') {
              return {
                ...component,
                status: backendComponent?.status || (health?.status === 'healthy' ? 'operational' : 'degraded'),
                responseTime: component.responseTime,
                description: backendComponent?.detail || `Primary ingress for proxied chat, scan, and management traffic. ${requestsTotal.toLocaleString()} requests observed in this environment.`,
              };
            }

            if (component.id === 'audit-log-stream') {
              return {
                ...component,
                status: backendComponent?.status || component.status,
                description: backendComponent?.detail || `Security event capture, review queues, and alert rule execution. ${blockedTotal.toLocaleString()} requests blocked so far.`,
              };
            }

            if (component.id === 'billing') {
              return {
                ...component,
                status: backendComponent?.status || component.status,
                description: backendComponent?.detail || 'Hosted billing account sync, checkout, and customer portal orchestration with Polar.',
              };
            }

            if (component.id === 'dashboard') {
              return {
                ...component,
                status: backendComponent?.status || component.status,
                description: backendComponent?.detail || 'Customer dashboard, onboarding surfaces, audit views, and status communication.',
              };
            }

            return {
              ...component,
              status: backendComponent?.status || component.status,
              description: backendComponent?.detail || component.description,
            };
          }),
        );

        if (totalProviders === 0 && health?.status === 'healthy') {
          setStatusError('Core KoreShield services are healthy. Provider routing depends on credentials configured in each deployment environment.');
        }
      } catch {
        if (!cancelled) {
          setStatusError('Live status data is temporarily unavailable.');
          setComponents(buildDefaultComponents(now));
          setIncidents([]);
          setMaintenanceWindows([]);
          setUptimeHistory([]);
          setStatusEvidence(null);
          setProviderRoutes([]);
        }
      }
    };

    void fetchStatus();
    const interval = window.setInterval(() => {
      void fetchStatus();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const overallStatus = getOverallStatus();
  const averageUptime = getAverageUptime();
  const platformSnapshot = statusSummary?.statistics;
  const protectedRequestsObserved = platformSnapshot?.requests_total ?? 0;
  const threatsBlocked = Math.max(platformSnapshot?.requests_blocked ?? 0, platformSnapshot?.attacks_detected ?? 0);
  const configuredProviderCount =
    providerHealth?.initialized_providers ??
    statusSummary?.initialized_providers ??
    providerRoutes.filter((provider) => provider.initialized || provider.credentialsPresent).length;

  return (
    <div className="min-h-screen bg-background">
      <SEOMeta
        title="System Status"
        description="Real-time status and uptime information for KoreShield services. View current system status, resolved incidents, and scheduled maintenance."
      />

      <section className="py-20 px-4 bg-card/40">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="bg-electric-green/10 p-4 rounded-lg">
                <Activity className="w-8 h-8 text-electric-green" />
              </div>
              <h1 className="text-5xl font-bold text-foreground">System Status</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Live platform health, resolved incidents, and scheduled maintenance for KoreShield.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`rounded-xl p-8 mb-12 ${
            overallStatus === 'operational'
              ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900'
              : overallStatus === 'maintenance'
                ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900'
                : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-4 h-4 rounded-full ${
                  overallStatus === 'operational'
                    ? 'bg-green-500 animate-pulse'
                    : overallStatus === 'maintenance'
                      ? 'bg-blue-500 animate-pulse'
                      : 'bg-red-500 animate-pulse'
                }`}
              />
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {overallStatus === 'operational'
                    ? 'All core systems operational'
                    : overallStatus === 'maintenance'
                      ? 'Scheduled maintenance in progress'
                      : 'Service disruption detected'}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {averageUptime ? `Average uptime: ${averageUptime}% over the last 90 days` : 'Not enough recorded uptime evidence yet.'}
                </p>
                {statusError && <p className="text-sm text-muted-foreground mt-2">{statusError}</p>}
                {statusEvidence?.last_recorded_at && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Evidence last recorded {new Date(statusEvidence.last_recorded_at).toLocaleString()} from {statusEvidence.snapshot_count || 0} live snapshots.
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <a
                href="mailto:hello@koreshield.ai?subject=Subscribe%20to%20KoreShield%20status%20alerts"
                className="flex items-center gap-2 px-4 py-2 bg-card text-foreground border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                <Bell className="w-4 h-4" />
                Subscribe to Alerts
              </a>
              <a
                href="/status-feed.xml"
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-2 px-4 py-2 bg-card text-foreground border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                RSS Feed
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="text-sm text-muted-foreground mb-2">Protected requests observed</div>
              <div className="text-3xl font-bold text-foreground">{protectedRequestsObserved.toLocaleString()}</div>
            </div>
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="text-sm text-muted-foreground mb-2">Threats blocked</div>
              <div className="text-3xl font-bold text-foreground">{threatsBlocked.toLocaleString()}</div>
            </div>
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="text-sm text-muted-foreground mb-2">Configured provider routes</div>
              <div className="text-3xl font-bold text-foreground">{configuredProviderCount}</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">Live Provider Routes</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {providerRoutes.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                No provider route data is available for this environment yet.
              </div>
            ) : providerRoutes.map((provider) => (
              <div key={provider.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground capitalize">{provider.id.replace('_', ' ')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {provider.type || 'Provider route'} {provider.baseUrl ? `· ${provider.baseUrl}` : ''}
                    </p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                    provider.status === 'healthy' || provider.status === 'initialized'
                      ? 'bg-green-500/10 text-green-500 border-green-500/20'
                      : provider.status === 'missing_credentials'
                        ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        : provider.status === 'disabled'
                          ? 'bg-muted text-muted-foreground border-border'
                          : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                  }`}>
                    {provider.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between gap-4">
                    <span>Enabled in config</span>
                    <span className="font-medium text-foreground">{provider.enabled ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Credentials present</span>
                    <span className="font-medium text-foreground">{provider.credentialsPresent ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Initialized</span>
                    <span className="font-medium text-foreground">{provider.initialized ? 'Yes' : 'No'}</span>
                  </div>
                  {typeof provider.healthy === 'boolean' && (
                    <div className="flex justify-between gap-4">
                      <span>Health check</span>
                      <span className="font-medium text-foreground">{provider.healthy ? 'Healthy' : 'Unhealthy'}</span>
                    </div>
                  )}
                  {provider.responseTimeMs ? (
                    <div className="flex justify-between gap-4">
                      <span>Response time</span>
                      <span className="font-medium text-foreground">{provider.responseTimeMs.toFixed(0)} ms</span>
                    </div>
                  ) : null}
                  {provider.error ? (
                    <div className="pt-2">
                      <div className="text-muted-foreground mb-1">Latest health note</div>
                      <p className="text-xs leading-relaxed text-foreground/80 break-words">{provider.error}</p>
                    </div>
                  ) : null}
                  {!provider.credentialsPresent && provider.missingEnvVars.length > 0 ? (
                    <p className="pt-2">
                      Missing environment values: <span className="font-mono text-xs text-foreground">{provider.missingEnvVars.join(', ')}</span>
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {maintenanceWindows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Scheduled Maintenance
            </h2>
            <div className="space-y-4">
              {maintenanceWindows.map((maintenance) => (
                <MaintenanceCard key={maintenance.id} maintenance={maintenance} components={components} />
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">Components</h2>
          <div className="bg-card rounded-xl shadow-lg overflow-hidden border border-border">
            {components.map((component, index) => (
              <ComponentStatusRow
                key={component.id}
                component={component}
                isLast={index === components.length - 1}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Uptime History (Last 90 Days)
          </h2>
          <div className="bg-card rounded-xl shadow-lg p-8 border border-border">
            {uptimeHistory.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No uptime history has been recorded yet.
              </div>
            ) : (
              <>
                <UptimeChart data={uptimeHistory} />
                <div className="flex justify-between items-center mt-6 text-sm text-muted-foreground">
                  <span>90 days ago</span>
                  <span>Today</span>
                </div>
              </>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">Recent Incidents</h2>
          <div className="space-y-4">
            {incidents.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
                No incidents have been published.
              </div>
            ) : incidents.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} getSeverityColor={getSeverityColor} isHistorical />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ComponentStatusRow({
  component,
  isLast,
  getStatusColor,
  getStatusIcon,
}: {
  component: Component;
  isLast: boolean;
  getStatusColor: (status: ComponentStatus) => string;
  getStatusIcon: (status: ComponentStatus) => React.JSX.Element;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusColor = getStatusColor(component.status);
  const statusIcon = getStatusIcon(component.status);

  return (
    <div className={!isLast ? 'border-b border-border' : ''}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition-colors"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-lg font-semibold text-foreground">{component.name}</span>
            <span className={`flex items-center gap-2 ${statusColor}`}>
              {statusIcon}
              <span className="capitalize text-sm font-medium">{component.status.replace('_', ' ')}</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{component.description}</p>
        </div>
        <div className="flex items-center gap-8 text-sm text-muted-foreground">
          <div className="text-right">
            <div className="font-semibold text-foreground">{component.uptime !== null ? `${component.uptime}%` : 'N/A'}</div>
            <div className="text-xs">Uptime</div>
          </div>
          {component.responseTime !== null && component.responseTime !== undefined && (
            <div className="text-right">
              <div className="font-semibold text-foreground">{component.responseTime}ms</div>
              <div className="text-xs">Response Time</div>
            </div>
          )}
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isExpanded && (
        <div className="px-6 pb-6 bg-muted/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">Status</div>
              <div className={`font-medium capitalize ${statusColor}`}>{component.status.replace('_', ' ')}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Uptime (90d)</div>
              <div className="font-medium text-foreground">{component.uptime !== null ? `${component.uptime}%` : 'N/A'}</div>
            </div>
            {component.responseTime !== null && component.responseTime !== undefined && (
              <div>
                <div className="text-muted-foreground mb-1">Avg Response</div>
                <div className="font-medium text-foreground">{component.responseTime}ms</div>
              </div>
            )}
            <div>
              <div className="text-muted-foreground mb-1">Last Checked</div>
              <div className="font-medium text-foreground">{new Date(component.lastChecked).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IncidentCard({
  incident,
  getSeverityColor,
  isHistorical = false,
}: {
  incident: Incident;
  getSeverityColor: (severity: IncidentSeverity) => string;
  isHistorical?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(!isHistorical);

  return (
    <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
                {incident.severity}
              </span>
              <span className="text-sm text-muted-foreground capitalize">{incident.status.replace('_', ' ')}</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{incident.title}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{new Date(incident.createdAt).toLocaleString()}</span>
              {incident.resolvedAt && (
                <span className="text-green-600 dark:text-green-400">
                  Resolved in {Math.floor((incident.resolvedAt.getTime() - incident.createdAt.getTime()) / 60000)} minutes
                </span>
              )}
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-border bg-muted/30">
          <div className="pt-6 space-y-4">
            {incident.updates.map((update, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-32 text-sm text-muted-foreground">
                  {new Date(update.timestamp).toLocaleString()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {update.status === 'resolved' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {update.status === 'monitoring' && <Activity className="w-4 h-4 text-blue-500" />}
                    {update.status === 'identified' && <Info className="w-4 h-4 text-yellow-500" />}
                    {update.status === 'investigating' && <AlertCircle className="w-4 h-4 text-orange-500" />}
                    <span className="text-sm font-medium text-foreground capitalize">{update.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-foreground/80">{update.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MaintenanceCard({
  maintenance,
  components,
}: {
  maintenance: MaintenanceWindow;
  components: Component[];
}) {
  return (
    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-900">
      <div className="flex items-start gap-4">
        <div className="bg-electric-green/10 p-3 rounded-lg">
          <Calendar className="w-6 h-6 text-electric-green" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-2">{maintenance.title}</h3>
          <p className="text-foreground/80 mb-4">{maintenance.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Start:</span> {new Date(maintenance.scheduledStart).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">End:</span> {new Date(maintenance.scheduledEnd).toLocaleString()}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {maintenance.affectedComponents.map((componentId) => {
              const component = components.find((item) => item.id === componentId);
              return component ? (
                <span key={componentId} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs">
                  {component.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function UptimeChart({ data }: { data: UptimeDay[] }) {
  const getBarColor = (uptime: number, incidents: number) => {
    if (incidents > 0) return 'bg-red-500';
    if (uptime >= 100) return 'bg-green-500';
    if (uptime >= 99.8) return 'bg-blue-500';
    if (uptime >= 99.5) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="flex gap-1 items-end h-32">
      {data.map((day, index) => (
        <div key={index} className="flex-1 h-full self-stretch group relative cursor-pointer" style={{ minWidth: '4px' }}>
          <div
            className={`w-full rounded-t transition-all hover:opacity-80 ${getBarColor(day.uptime, day.incidents)}`}
            style={{ height: `${Math.max(day.uptime, 92)}%` }}
          />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-card text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
            <div>{day.date.toLocaleDateString()}</div>
            <div>{day.uptime.toFixed(2)}% uptime</div>
            {day.incidents > 0 && <div className="text-red-300">{day.incidents} incident(s)</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
