import { createFileRoute } from "@tanstack/react-router";
import { Shield, Activity, AlertCircle, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/$orgSlug/firewall")({
  component: FirewallDashboard,
});

function FirewallDashboard() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Firewall Dashboard</h1>
        <p className="text-white/60 mt-2">
          Monitor and configure your LLM security firewall
        </p>
      </div>

      {/* Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-white/60">Total Requests</div>
            <Activity className="h-4 w-4 text-white/40" />
          </div>
          <div className="text-2xl font-bold text-white">12,543</div>
          <p className="text-xs text-white/40 mt-1">+20% from last month</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-white/60">Threats Blocked</div>
            <Shield className="h-4 w-4 text-white/40" />
          </div>
          <div className="text-2xl font-bold text-white">147</div>
          <p className="text-xs text-white/40 mt-1">1.17% threat rate</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-white/60">Safe Requests</div>
            <CheckCircle className="h-4 w-4 text-white/40" />
          </div>
          <div className="text-2xl font-bold text-white">12,396</div>
          <p className="text-xs text-white/40 mt-1">98.83% safe</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-white/60">Warnings</div>
            <AlertCircle className="h-4 w-4 text-white/40" />
          </div>
          <div className="text-2xl font-bold text-white">23</div>
          <p className="text-xs text-white/40 mt-1">Require attention</p>
        </div>
      </div>

      {/* Active Providers */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Active LLM Providers</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
            <div>
              <div className="font-semibold text-white">OpenAI</div>
              <div className="text-sm text-white/60">gpt-4, gpt-3.5-turbo</div>
            </div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm font-medium border border-green-500/20">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              Active
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
            <div>
              <div className="font-semibold text-white">Anthropic</div>
              <div className="text-sm text-white/60">claude-3-opus, claude-3-sonnet</div>
            </div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm font-medium border border-green-500/20">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Recent Security Events */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Security Events</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <div className="flex-1">
              <div className="font-medium text-sm text-white">Prompt Injection Blocked</div>
              <div className="text-xs text-white/60">2 minutes ago • OpenAI</div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <div className="flex-1">
              <div className="font-medium text-sm text-white">Suspicious Pattern Detected</div>
              <div className="text-xs text-white/60">15 minutes ago • Anthropic</div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <div className="flex-1">
              <div className="font-medium text-sm text-white">Request Sanitized Successfully</div>
              <div className="text-xs text-white/60">32 minutes ago • OpenAI</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
