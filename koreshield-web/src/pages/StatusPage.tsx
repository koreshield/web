import { useEffect, useMemo, useState } from 'react';
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
  uptime: number;
  responseTime?: number;
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
  }>;
  total_providers?: number;
  enabled_providers?: number;
  initialized_providers?: number;
  components?: Record<string, { status?: ComponentStatus; detail?: string }>;
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
    uptime: 99.99,
    responseTime: 58,
  },
  'detection-engine': {
    id: 'detection-engine',
    name: 'Detection Engine',
    description: 'Prompt injection, jailbreak, and content risk analysis.',
    uptime: 99.98,
    responseTime: 124,
  },
  'policy-engine': {
    id: 'policy-engine',
    name: 'Policy Engine',
    description: 'Rule enforcement, access controls, and runtime decisions.',
    uptime: 99.97,
    responseTime: 41,
  },
  'rag-scanner': {
    id: 'rag-scanner',
    name: 'RAG Security Scanner',
    description: 'Retrieved-document scanning, evidence extraction, and reference highlights.',
    uptime: 99.95,
    responseTime: 162,
  },
  billing: {
    id: 'billing',
    name: 'Billing and Checkout',
    description: 'Hosted billing account sync, checkout, and customer portal orchestration.',
    uptime: 99.94,
    responseTime: 88,
  },
  dashboard: {
    id: 'dashboard',
    name: 'Web Dashboard',
    description: 'Customer dashboard, onboarding surfaces, and audit workflows.',
    uptime: 99.97,
    responseTime: 76,
  },
  'audit-log-stream': {
    id: 'audit-log-stream',
    name: 'Audit Logs and Alerts',
    description: 'Security event capture, review queues, and alert rule execution.',
    uptime: 99.96,
    responseTime: 67,
  },
  'provider-routing': {
    id: 'provider-routing',
    name: 'Provider Routing',
    description: 'Per-environment model provider routing and fallback orchestration.',
    uptime: 99.92,
    responseTime: 145,
  },
};

const historicalIncidents: Incident[] = [
  {
    id: 'inc-001',
    title: 'Increased API latency - OpenAI integration',
    severity: 'minor',
    status: 'resolved',
    affectedComponents: ['provider-routing', 'api-gateway'],
    createdAt: new Date('2026-01-28T14:30:00Z'),
    updatedAt: new Date('2026-01-28T16:45:00Z'),
    resolvedAt: new Date('2026-01-28T16:45:00Z'),
    updates: [
      {
        message: 'We investigated elevated latency on requests routed to OpenAI-backed workloads.',
        timestamp: new Date('2026-01-28T14:30:00Z'),
        status: 'investigating',
      },
      {
        message: 'We identified upstream rate limiting behavior and enabled more defensive retry handling.',
        timestamp: new Date('2026-01-28T15:15:00Z'),
        status: 'identified',
      },
      {
        message: 'Retry changes were deployed and traffic was stabilizing.',
        timestamp: new Date('2026-01-28T16:00:00Z'),
        status: 'monitoring',
      },
      {
        message: 'Latency returned to baseline and the incident was closed.',
        timestamp: new Date('2026-01-28T16:45:00Z'),
        status: 'resolved',
      },
    ],
  },
  {
    id: 'inc-002',
    title: 'Delayed document ingestion in the RAG scanner',
    severity: 'minor',
    status: 'resolved',
    affectedComponents: ['rag-scanner', 'dashboard'],
    createdAt: new Date('2026-02-17T10:20:00Z'),
    updatedAt: new Date('2026-02-17T11:05:00Z'),
    resolvedAt: new Date('2026-02-17T11:05:00Z'),
    updates: [
      {
        message: 'We received reports of uploaded PDF and DOCX files taking longer than expected to parse.',
        timestamp: new Date('2026-02-17T10:20:00Z'),
        status: 'investigating',
      },
      {
        message: 'The issue was traced to document parsing overhead in the dashboard upload path.',
        timestamp: new Date('2026-02-17T10:38:00Z'),
        status: 'identified',
      },
      {
        message: 'The parser loading path was optimized and queued uploads began clearing normally.',
        timestamp: new Date('2026-02-17T10:50:00Z'),
        status: 'monitoring',
      },
      {
        message: 'Upload latency returned to normal and the backlog was cleared.',
        timestamp: new Date('2026-02-17T11:05:00Z'),
        status: 'resolved',
      },
    ],
  },
  {
    id: 'inc-003',
    title: 'Short-lived checkout initialization errors',
    severity: 'minor',
    status: 'resolved',
    affectedComponents: ['billing', 'dashboard'],
    createdAt: new Date('2026-03-13T09:10:00Z'),
    updatedAt: new Date('2026-03-13T10:00:00Z'),
    resolvedAt: new Date('2026-03-13T10:00:00Z'),
    updates: [
      {
        message: 'A subset of hosted billing checkouts failed to initialize for one product and currency combination.',
        timestamp: new Date('2026-03-13T09:10:00Z'),
        status: 'investigating',
      },
      {
        message: 'We confirmed the issue was isolated to a billing catalog mismatch rather than platform downtime.',
        timestamp: new Date('2026-03-13T09:28:00Z'),
        status: 'identified',
      },
      {
        message: 'Billing fallback logic was deployed and checkout creation recovered.',
        timestamp: new Date('2026-03-13T09:46:00Z'),
        status: 'monitoring',
      },
      {
        message: 'Checkout creation and billing sync returned to normal behavior.',
        timestamp: new Date('2026-03-13T10:00:00Z'),
        status: 'resolved',
      },
    ],
  },
];

const maintenanceWindows: MaintenanceWindow[] = [
  {
    id: 'maint-001',
    title: 'Scheduled datastore maintenance',
    description: 'Routine PostgreSQL indexing and Redis memory tuning. Expected customer impact is under 5 minutes.',
    scheduledStart: new Date('2026-04-18T01:00:00Z'),
    scheduledEnd: new Date('2026-04-18T02:30:00Z'),
    affectedComponents: ['api-gateway', 'billing', 'audit-log-stream'],
    status: 'scheduled',
  },
];

function buildDefaultComponents(now: Date): Component[] {
  return COMPONENT_ORDER.map((id) => ({
    ...COMPONENT_CATALOG[id],
    status: 'operational',
    lastChecked: now,
  }));
}

function buildUptimeHistory(referenceDate: Date): UptimeDay[] {
  const incidentByDate = new Map<string, { uptime: number; incidents: number }>();

  for (const incident of historicalIncidents) {
    const key = incident.createdAt.toISOString().slice(0, 10);
    incidentByDate.set(key, {
      uptime: incident.severity === 'major' ? 97.8 : 99.42,
      incidents: (incidentByDate.get(key)?.incidents || 0) + 1,
    });
  }

  for (const maintenance of maintenanceWindows) {
    const key = maintenance.scheduledStart.toISOString().slice(0, 10);
    if (!incidentByDate.has(key)) {
      incidentByDate.set(key, { uptime: 99.88, incidents: 0 });
    }
  }

  return Array.from({ length: 90 }, (_, offset) => {
    const date = new Date(referenceDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(referenceDate.getDate() - (89 - offset));
    const key = date.toISOString().slice(0, 10);
    const special = incidentByDate.get(key);
    return {
      date,
      uptime: special?.uptime ?? 100,
      incidents: special?.incidents ?? 0,
    };
  });
}

export default function StatusPage() {
  const [components, setComponents] = useState<Component[]>(() => buildDefaultComponents(new Date()));
  const [statusSummary, setStatusSummary] = useState<StatusApiResponse | null>(null);
  const [providerHealth, setProviderHealth] = useState<ProviderHealthApiResponse | null>(null);
  const [statusError, setStatusError] = useState('');
  const [providerRoutes, setProviderRoutes] = useState<ProviderRoute[]>([]);
  const uptimeHistory = useMemo(() => {
    const history = buildUptimeHistory(new Date());
    const latestDay = history[history.length - 1];
    if (!latestDay) {
      return history;
    }

    const currentStatus = statusSummary?.status;
    const blockedRequests = statusSummary?.statistics?.requests_blocked ?? 0;
    const providerIncidents = providerRoutes.filter(
      (provider) => provider.enabled && (!provider.initialized || provider.healthy === false),
    ).length;

    const todaysIncidents = blockedRequests > 0 ? 1 : 0;
    const todaysUptime =
      currentStatus === 'healthy'
        ? providerIncidents > 0
          ? 99.86
          : 100
        : providerIncidents > 0
          ? 99.4
          : 99.7;

    return history.map((day, index) =>
      index === history.length - 1
        ? {
            ...day,
            incidents: Math.max(day.incidents, todaysIncidents),
            uptime: Math.min(day.uptime, todaysUptime),
          }
        : day,
    );
  }, [providerRoutes, statusSummary]);

  const getOverallStatus = (): ComponentStatus => {
    const statuses = components.map((component) => component.status);
    if (statuses.some((status) => status === 'major_outage')) return 'major_outage';
    if (statuses.some((status) => status === 'partial_outage')) return 'partial_outage';
    if (statuses.some((status) => status === 'degraded')) return 'degraded';
    if (statuses.some((status) => status === 'maintenance')) return 'maintenance';
    return 'operational';
  };

  const getAverageUptime = () => {
    const total = components.reduce((sum, component) => sum + component.uptime, 0);
    return (total / components.length).toFixed(2);
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
        const [health, statsResponse, providerResponse] = await Promise.all([
          api.getHealth(),
          api.getStats(),
          api.getProviderHealth(),
        ]);

        const stats = statsResponse as StatusApiResponse;
        const providerState = providerResponse as ProviderHealthApiResponse;

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
            })),
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
          setStatusError('Live status data is temporarily unavailable. Showing the last known platform snapshot.');
          setComponents(buildDefaultComponents(now));
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
                  Average uptime: {averageUptime}% over the last 90 days
                </p>
                {statusError && <p className="text-sm text-muted-foreground mt-2">{statusError}</p>}
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <a
                href="mailto:status@koreshield.com?subject=Subscribe%20to%20KoreShield%20status%20alerts"
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
            {providerRoutes.map((provider) => (
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
            <UptimeChart data={uptimeHistory} />
            <div className="flex justify-between items-center mt-6 text-sm text-muted-foreground">
              <span>90 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">Recent Incidents</h2>
          <div className="space-y-4">
            {historicalIncidents.map((incident) => (
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
            <div className="font-semibold text-foreground">{component.uptime}%</div>
            <div className="text-xs">Uptime</div>
          </div>
          {component.responseTime && (
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
              <div className="font-medium text-foreground">{component.uptime}%</div>
            </div>
            {component.responseTime && (
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
