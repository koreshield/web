import { Activity, Shield, AlertTriangle } from "lucide-react";
import { OverviewCard } from "./overview-card";
import { formatNumber } from "./format";

export type OverviewStats = {
  totalRequests: number;
  requestsChange?: number;
  threatsBlocked?: number | null;
  threatsBlockedChange?: number;
  securityWarnings: number;
  warningsChange?: number;
};

export function StatsSummary({ stats }: { stats?: OverviewStats | null }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <OverviewCard
        title="Protected Requests"
        value={formatNumber(stats?.totalRequests || 0)}
        change={stats?.requestsChange}
        icon={<Activity size={20} />}
        trend={
          stats?.requestsChange && stats.requestsChange < 0 ? "down" : "up"
        }
        showDash={stats?.totalRequests === 0}
      />
      <OverviewCard
        title="Threats Blocked"
        value={formatNumber(stats?.threatsBlocked ?? 0)}
        change={stats?.threatsBlockedChange}
        icon={<Shield size={20} />}
        trend="neutral"
      />
      <OverviewCard
        title="Security Warnings"
        value={formatNumber(stats?.securityWarnings || 0)}
        change={stats?.warningsChange}
        icon={<AlertTriangle size={20} />}
        trend={
          stats?.warningsChange && stats.warningsChange < 0 ? "down" : "up"
        }
        showDash={stats?.securityWarnings === 0}
      />
    </div>
  );
}
