import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { appClient } from "@/lib/app-client";
import { getPlanLimits } from "@/lib/subscription-plans";
import { OverviewHeader } from "@/components/overview/overview-header";
import { StatsSummary } from "@/components/overview/stats-summary";
import { RequestActivityCard } from "@/components/overview/request-activity-card";
import { OverviewSkeleton } from "@/components/overview/overview-skeleton";

export const Route = createFileRoute("/app/$orgSlug/")({
  component: OverviewView,
});

function OverviewView() {
  const [timeRange, setTimeRange] = useState("24h");
  const { orgSlug } = Route.useParams();

  const { data: subscriptionData } = useQuery({
    queryKey: ["subscription", orgSlug],
    queryFn: async () => {
      if (!orgSlug) return null;
      const response = await appClient.subscriptions.get(orgSlug);
      if ("error" in response) throw new Error(response.error);
      return response;
    },
    enabled: !!orgSlug,
  });

  const {
    data: stats,
    isLoading: statsLoading,
    isPlaceholderData,
  } = useQuery({
    queryKey: ["stats", "overview", orgSlug, timeRange],
    queryFn: async () => {
      if (!orgSlug) return null;
      const result = await appClient.stats.overview(orgSlug, timeRange);
      if ("error" in result) {
        throw new Error(result.error);
      }
      return result;
    },
    enabled: !!orgSlug,
    placeholderData: keepPreviousData,
  });

  const subscription = subscriptionData?.subscription;
  const currentPlan = subscription?.plan || "free";

  if (statsLoading) {
    return <OverviewSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <OverviewHeader />

      <StatsSummary stats={stats} />

      <div className="grid grid-cols-1 gap-6">
        <RequestActivityCard
          stats={stats}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          isPlaceholderData={isPlaceholderData}
        />
      </div>
    </div>
  );
}
