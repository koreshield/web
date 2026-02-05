import { useState, useEffect } from 'react';
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
  Bell
} from 'lucide-react';
import { SEOMeta } from '../components/SEOMeta';
import { api } from '../lib/api-client';

// Types
type ComponentStatus = 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance';
type IncidentSeverity = 'critical' | 'major' | 'minor' | 'maintenance';
type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved' | 'scheduled';

interface Component {
  id: string;
  name: string;
  description: string;
  status: ComponentStatus;
  uptime: number; // percentage
  responseTime?: number; // ms
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
  uptime: number; // percentage
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

// Mock data (replace with real API calls in production)
const mockComponents: Component[] = [
  {
    id: 'api-gateway',
    name: 'API Gateway',
    description: 'Main API endpoint for all requests',
    status: 'operational',
    uptime: 99.99,
    responseTime: 45,
    lastChecked: new Date(),
  },
  {
    id: 'detection-engine',
    name: 'Detection Engine',
    description: 'AI-powered threat detection system',
    status: 'operational',
    uptime: 99.98,
    responseTime: 120,
    lastChecked: new Date(),
  },
  {
    id: 'policy-engine',
    name: 'Policy Engine',
    description: 'RBAC and policy enforcement',
    status: 'operational',
    uptime: 99.97,
    responseTime: 30,
    lastChecked: new Date(),
  },
  {
    id: 'openai',
    name: 'OpenAI Integration',
    description: 'OpenAI provider connection',
    status: 'operational',
    uptime: 99.95,
    lastChecked: new Date(),
  },
  {
    id: 'anthropic',
    name: 'Anthropic Integration',
    description: 'Claude provider connection',
    status: 'operational',
    uptime: 99.96,
    lastChecked: new Date(),
  },
  {
    id: 'gemini',
    name: 'Google Gemini Integration',
    description: 'Gemini provider connection',
    status: 'operational',
    uptime: 99.94,
    lastChecked: new Date(),
  },
  {
    id: 'database',
    name: 'Database',
    description: 'PostgreSQL primary database',
    status: 'operational',
    uptime: 100.0,
    responseTime: 15,
    lastChecked: new Date(),
  },
  {
    id: 'redis',
    name: 'Redis Cache',
    description: 'Cache layer for performance',
    status: 'operational',
    uptime: 99.99,
    responseTime: 5,
    lastChecked: new Date(),
  },
  {
    id: 'dashboard',
    name: 'Web Dashboard',
    description: 'Management dashboard and documentation',
    status: 'operational',
    uptime: 99.98,
    lastChecked: new Date(),
  },
  {
    id: 'monitoring',
    name: 'Monitoring & Metrics',
    description: 'Prometheus and Grafana monitoring',
    status: 'operational',
    uptime: 99.99,
    lastChecked: new Date(),
  },
];

const mockHistoricalIncidents: Incident[] = [
  {
    id: 'inc-001',
    title: 'Increased API Latency - OpenAI Integration',
    severity: 'minor',
    status: 'resolved',
    affectedComponents: ['openai', 'api-gateway'],
    createdAt: new Date('2026-01-28T14:30:00Z'),
    updatedAt: new Date('2026-01-28T16:45:00Z'),
    resolvedAt: new Date('2026-01-28T16:45:00Z'),
    updates: [
      {
        message: 'We are investigating reports of increased latency when connecting to OpenAI APIs.',
        timestamp: new Date('2026-01-28T14:30:00Z'),
        status: 'investigating',
      },
      {
        message: 'Issue has been identified as a rate limiting issue with OpenAI. Implementing retry logic.',
        timestamp: new Date('2026-01-28T15:15:00Z'),
        status: 'identified',
      },
      {
        message: 'Fix deployed. Monitoring for stability.',
        timestamp: new Date('2026-01-28T16:00:00Z'),
        status: 'monitoring',
      },
      {
        message: 'Issue resolved. All systems operating normally.',
        timestamp: new Date('2026-01-28T16:45:00Z'),
        status: 'resolved',
      },
    ],
  },
];

const mockMaintenanceWindows: MaintenanceWindow[] = [
  {
    id: 'maint-001',
    title: 'Scheduled Database Maintenance',
    description: 'Routine database maintenance and optimization. Expected downtime: < 5 minutes.',
    scheduledStart: new Date('2026-02-05T02:00:00Z'),
    scheduledEnd: new Date('2026-02-05T04:00:00Z'),
    affectedComponents: ['database', 'api-gateway'],
    status: 'scheduled',
  },
];

// Generate last 90 days of uptime data
const generateUptimeHistory = (): UptimeDay[] => {
  const days: UptimeDay[] = [];
  for (let i = 89; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push({
      date,
      uptime: Math.random() > 0.02 ? 100 : 99.5 + Math.random() * 0.5, // 98% of days are 100%
      incidents: Math.random() > 0.95 ? 1 : 0, // 5% of days have incidents
    });
  }
  return days;
};

export default function StatusPage() {
  const [components, setComponents] = useState<Component[]>(mockComponents);
  const [activeIncidents] = useState<Incident[]>([]);
  const [historicalIncidents] = useState<Incident[]>(mockHistoricalIncidents);
  const [maintenanceWindows] = useState<MaintenanceWindow[]>(mockMaintenanceWindows);
  const [uptimeHistory] = useState<UptimeDay[]>(generateUptimeHistory());
  const [subscribedToAlerts, setSubscribedToAlerts] = useState(false);

  // Calculate overall system status
  const getOverallStatus = (): ComponentStatus => {
    const statuses = components.map(c => c.status);
    if (statuses.some(s => s === 'major_outage')) return 'major_outage';
    if (statuses.some(s => s === 'partial_outage')) return 'partial_outage';
    if (statuses.some(s => s === 'degraded')) return 'degraded';
    if (statuses.some(s => s === 'maintenance')) return 'maintenance';
    return 'operational';
  };

  // Calculate average uptime
  const getAverageUptime = () => {
    const total = components.reduce((sum, c) => sum + c.uptime, 0);
    return (total / components.length).toFixed(2);
  };

  // Get status color
  const getStatusColor = (status: ComponentStatus) => {
    switch (status) {
      case 'operational': return 'text-green-500 dark:text-green-400';
      case 'degraded': return 'text-yellow-500 dark:text-yellow-400';
      case 'partial_outage': return 'text-orange-500 dark:text-orange-400';
      case 'major_outage': return 'text-red-500 dark:text-red-400';
      case 'maintenance': return 'text-blue-500 dark:text-blue-400';
    }
  };

  const getStatusIcon = (status: ComponentStatus) => {
    switch (status) {
      case 'operational': return <CheckCircle className="w-5 h-5" />;
      case 'degraded': return <AlertTriangle className="w-5 h-5" />;
      case 'partial_outage': return <AlertCircle className="w-5 h-5" />;
      case 'major_outage': return <XCircle className="w-5 h-5" />;
      case 'maintenance': return <Clock className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'major': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'minor': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'maintenance': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const overallStatus = getOverallStatus();
  const averageUptime = getAverageUptime();

  // Simulate real-time updates (in production, use WebSocket or polling)
  // Fetch real health status
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const health = await api.getHealth();

        setComponents(prev => prev.map(c => {
          let newStatus = c.status;

          // Map API health status to component status
          if (c.id === 'database' && health.services.database !== 'up') newStatus = 'major_outage';
          if (c.id === 'redis' && health.services.redis !== 'up') newStatus = 'partial_outage';
          if (c.id === 'openai' && health.services.openai_api !== 'up') newStatus = 'degraded';
          if (c.id === 'anthropic' && health.services.anthropic_api !== 'up') newStatus = 'degraded';

          return {
            ...c,
            status: newStatus,
            lastChecked: new Date(health.timestamp)
          };
        }));
      } catch (error) {
        console.error('Failed to fetch health status:', error);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <SEOMeta
        title="System Status"
        description="Real-time status and uptime information for KoreShield services. View current system status, historical incidents, and scheduled maintenance."
      />

      {/* Header */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="bg-blue-600/10 p-4 rounded-lg">
                <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white">System Status</h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Real-time status and uptime information for all KoreShield services
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Overall Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`rounded-xl p-8 mb-12 ${overallStatus === 'operational'
            ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900'
            : overallStatus === 'maintenance'
              ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900'
              : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900'
            }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full ${overallStatus === 'operational' ? 'bg-green-500 animate-pulse' :
                overallStatus === 'maintenance' ? 'bg-blue-500 animate-pulse' :
                  'bg-red-500 animate-pulse'
                }`} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {overallStatus === 'operational' ? 'All Systems Operational' :
                    overallStatus === 'maintenance' ? 'Scheduled Maintenance' :
                      'Service Disruption'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Average uptime: {averageUptime}% over last 90 days
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSubscribedToAlerts(!subscribedToAlerts)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${subscribedToAlerts
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
              >
                <Bell className="w-4 h-4" />
                {subscribedToAlerts ? 'Subscribed to Alerts' : 'Subscribe to Alerts'}
              </button>
              <a
                href="/rss"
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                RSS Feed
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* Active Incidents */}
        {activeIncidents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Active Incidents</h2>
            <div className="space-y-4">
              {activeIncidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} getSeverityColor={getSeverityColor} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Scheduled Maintenance */}
        {maintenanceWindows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Scheduled Maintenance
            </h2>
            <div className="space-y-4">
              {maintenanceWindows.map((maintenance) => (
                <MaintenanceCard key={maintenance.id} maintenance={maintenance} mockComponents={mockComponents} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Components Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Components</h2>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800">
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

        {/* Uptime History (Last 90 Days) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Uptime History (Last 90 Days)
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-800">
            <UptimeChart data={uptimeHistory} />
            <div className="flex justify-between items-center mt-6 text-sm text-gray-600 dark:text-gray-400">
              <span>90 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </motion.div>

        {/* Historical Incidents */}
        {historicalIncidents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Incidents</h2>
            <div className="space-y-4">
              {historicalIncidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} getSeverityColor={getSeverityColor} isHistorical />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Component Status Row
function ComponentStatusRow({
  component,
  isLast,
  getStatusColor,
  getStatusIcon
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
    <div className={!isLast ? 'border-b border-gray-200 dark:border-gray-800' : ''}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">{component.name}</span>
            <span className={`flex items-center gap-2 ${statusColor}`}>
              {statusIcon}
              <span className="capitalize text-sm font-medium">{component.status.replace('_', ' ')}</span>
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{component.description}</p>
        </div>
        <div className="flex items-center gap-8 text-sm text-gray-600 dark:text-gray-400">
          <div className="text-right">
            <div className="font-semibold text-gray-900 dark:text-white">{component.uptime}%</div>
            <div className="text-xs">Uptime</div>
          </div>
          {component.responseTime && (
            <div className="text-right">
              <div className="font-semibold text-gray-900 dark:text-white">{component.responseTime}ms</div>
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
        <div className="px-6 pb-6 bg-gray-50 dark:bg-gray-800/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600 dark:text-gray-400 mb-1">Status</div>
              <div className={`font-medium capitalize ${statusColor}`}>{component.status.replace('_', ' ')}</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400 mb-1">Uptime (90d)</div>
              <div className="font-medium text-gray-900 dark:text-white">{component.uptime}%</div>
            </div>
            {component.responseTime && (
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">Avg Response</div>
                <div className="font-medium text-gray-900 dark:text-white">{component.responseTime}ms</div>
              </div>
            )}
            <div>
              <div className="text-gray-600 dark:text-gray-400 mb-1">Last Checked</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {new Date(component.lastChecked).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Incident Card Component
function IncidentCard({
  incident,
  getSeverityColor,
  isHistorical = false
}: {
  incident: Incident;
  getSeverityColor: (severity: IncidentSeverity) => string;
  isHistorical?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(!isHistorical);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
                {incident.severity}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {incident.status.replace('_', ' ')}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{incident.title}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{new Date(incident.createdAt).toLocaleString()}</span>
              {incident.resolvedAt && (
                <span className="text-green-600 dark:text-green-400">
                  Resolved in {Math.floor((incident.resolvedAt.getTime() - incident.createdAt.getTime()) / 60000)} minutes
                </span>
              )}
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="pt-6 space-y-4">
            {incident.updates.map((update, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-32 text-sm text-gray-600 dark:text-gray-400">
                  {new Date(update.timestamp).toLocaleString()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {update.status === 'resolved' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {update.status === 'monitoring' && <Activity className="w-4 h-4 text-blue-500" />}
                    {update.status === 'identified' && <Info className="w-4 h-4 text-yellow-500" />}
                    {update.status === 'investigating' && <AlertCircle className="w-4 h-4 text-orange-500" />}
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {update.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{update.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Maintenance Card Component
function MaintenanceCard({
  maintenance,
  mockComponents
}: {
  maintenance: MaintenanceWindow;
  mockComponents: Component[];
}) {
  return (
    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-900">
      <div className="flex items-start gap-4">
        <div className="bg-blue-600/10 p-3 rounded-lg">
          <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{maintenance.title}</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{maintenance.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium">Start:</span> {new Date(maintenance.scheduledStart).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">End:</span> {new Date(maintenance.scheduledEnd).toLocaleString()}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {maintenance.affectedComponents.map((componentId) => {
              const component = mockComponents.find(c => c.id === componentId);
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

// Uptime Chart Component
function UptimeChart({ data }: { data: UptimeDay[] }) {
  const getBarColor = (uptime: number, incidents: number) => {
    if (incidents > 0) return 'bg-red-500';
    if (uptime >= 100) return 'bg-green-500';
    if (uptime >= 99.5) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="flex gap-1 items-end h-32">
      {data.map((day, index) => (
        <div
          key={index}
          className="flex-1 group relative cursor-pointer"
          style={{ minWidth: '4px' }}
        >
          <div
            className={`w-full rounded-t transition-all hover:opacity-80 ${getBarColor(day.uptime, day.incidents)}`}
            style={{ height: `${day.uptime}%` }}
          />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
            <div>{day.date.toLocaleDateString()}</div>
            <div>{day.uptime.toFixed(2)}% uptime</div>
            {day.incidents > 0 && <div className="text-red-300">{day.incidents} incident(s)</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
