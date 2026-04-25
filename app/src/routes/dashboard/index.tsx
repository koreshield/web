
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { koreshieldApi, LogEntry } from "@/lib/api-client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import {
  ShieldCheck,
  ShieldAlert,
  Activity,
  Globe,
  ArrowUpRight,
  Clock,
  LucideIcon
} from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: koreshieldApi.getStats,
    refetchInterval: 3000,
  });

  const { data: logsData } = useQuery({
    queryKey: ["recent-attacks"],
    queryFn: () => koreshieldApi.getLogs({ limit: 5, level: "warning" }),
    refetchInterval: 5000,
  });

  const recentAttacks = logsData?.logs || [];

  // Mock data for chart (since backend doesn't provide time-series yet)
  // In a real app, we'd fetch historical metrics
  const chartData = [
    { time: "10:00", requests: 120, blocked: 5 },
    { time: "10:10", requests: 132, blocked: 8 },
    { time: "10:20", requests: 101, blocked: 2 },
    { time: "10:30", requests: 154, blocked: 12 },
    { time: "10:40", requests: 190, blocked: 15 },
    { time: "10:50", requests: 230, blocked: 20 },
    { time: "11:00", requests: stats?.requests_total ? Math.min(stats.requests_total % 300 + 100, 300) : 180, blocked: stats?.requests_blocked ? Math.min(stats.requests_blocked % 50 + 5, 50) : 10 },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-gray-500">Real-time supervision of your LLM traffic security.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Requests"
          value={stats?.requests_total || 0}
          icon={Globe}
          color="blue"
          trend="+12%"
        />
        <StatsCard
          title="Allowed"
          value={stats?.requests_allowed || 0}
          icon={ShieldCheck}
          color="green"
          trend="+8%"
        />
        <StatsCard
          title="Blocked"
          value={stats?.requests_blocked || 0}
          icon={ShieldAlert}
          color="red"
          trend="+2%"
        />
        <StatsCard
          title="Attacks Detected"
          value={stats?.attacks_detected || 0}
          icon={Activity}
          color="orange"
          trend="+5%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-6">Traffic & Security Events</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" />
                <Area type="monotone" dataKey="blocked" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorBlocked)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Attacks */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Recent Threats</h3>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">Live</span>
          </div>

          <div className="space-y-4">
            {recentAttacks.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No recent threats detected</div>
            ) : (
              recentAttacks.map((log: LogEntry, i: number) => (
                <div key={log.request_id || i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <div className="mt-1">
                    <ShieldAlert className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {log.event}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="w-full mt-6 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium border-t border-gray-100 dark:border-gray-800">
            View All Logs
          </button>
        </div>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  trend: string;
}

function StatsCard({ title, value, icon: Icon, color, trend }: StatsCardProps) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold mt-2">{value.toLocaleString()}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center text-xs font-medium text-emerald-600">
        <ArrowUpRight className="h-3 w-3 mr-1" />
        {trend} <span className="text-gray-400 ml-1">vs last hour</span>
      </div>
    </div>
  )
}
