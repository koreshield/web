import { createFileRoute, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { appClient } from "@/lib/app-client";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const router = useRouter();

  // checking authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Try to access admin data to check if authenticated
      await appClient.admin.overview();
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setAuthError(null);
    try {
      const res = await appClient.admin.login(phrase);
      if ("error" in res) {
        setAuthError("Invalid passphrase");
        return;
      }
      setIsAuthenticated(true);
      setPhrase("");
    } catch {
      setAuthError("Login failed");
    }
  };

  const handleLogout = async () => {
    try {
      await appClient.apiCall("post", "/api/admin/logout");
    } catch {
      // Ignore logout errors
    }
    setIsAuthenticated(false);
    router.navigate({ to: "/admin" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070707] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070707] flex items-center justify-center p-4">
        <div className="w-full max-w-sm p-8 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <img src="/logo.png" alt="KoreShield Logo" className="w-12 mb-4" />
            <h3 className="text-xl font-bold text-white tracking-tight">
              Admin Access
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Enter your passphrase to continue
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
              placeholder="Passphrase"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLogin();
              }}
              autoFocus
            />

            {authError && (
              <p className="text-red-400 text-xs text-center font-medium">
                {authError}
              </p>
            )}

            <button
              onClick={handleLogin}
              className="w-full bg-white text-black font-bold rounded-xl py-3 text-sm transition-all hover:bg-gray-200 active:scale-[0.98]"
            >
              Unlock Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if we're on the root /admin path (not a child route)
  const isRootAdmin = location.pathname === "/admin";

  return (
    <div className="min-h-screen bg-[#070707]">
      <AdminSidebar onLogout={handleLogout} />
      <main className="ml-64 min-h-screen overflow-auto">
        <div className="p-8">
          {isRootAdmin ? <AdminOverview /> : <Outlet />}
        </div>
      </main>
    </div>
  );
}

// Inline overview component for the root /admin route
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Users, Building2, Network, CreditCard, Activity } from "lucide-react";
import { AdminStatsCard } from "@/components/admin/admin-stats-card";
import { OverviewSkeleton } from "@/components/admin/admin-skeleton";

function AdminOverview() {
  const [period, setPeriod] = useState("24h");
  const [overview, setOverview] = useState<any>(null);
  const [securityData, setSecurityData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, statsRes] = await Promise.all([
          appClient.admin.overview(),
          appClient.admin.stats(period),
        ]);

        // Check for auth errors
        if ("error" in overviewRes) {
          if (overviewRes.error === "Unauthorized" || overviewRes.error === "Forbidden") {
            window.location.reload(); // Force re-auth
            return;
          }
          console.error("Overview error:", overviewRes.error);
          return;
        }

        if ("error" in statsRes) {
          console.error("Stats error:", statsRes.error);
          return;
        }

        setOverview(overviewRes);
        setSecurityData(statsRes);
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);
            return;
          }
        }
        if ("error" in statsRes) {
          if (statsRes.error === "Unauthorized" || statsRes.error === "Forbidden") {
            clearToken();
            return;
          }
        }

        if (!("error" in overviewRes)) {
          setOverview(overviewRes);
        }
        if (!("error" in statsRes)) {
          setSecurityData(
            statsRes.map((d: any) => ({
              ...d,
              time: new Date(d.time.replace(" ", "T")).getTime(),
            }))
          );
        }
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [period, token, clearToken]);

  if (loading) {
    return <OverviewSkeleton />;
  }

  const formatXAxis = (tickItem: number) => {
    const date = new Date(tickItem);
    if (period === "1h")
      return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    if (period === "24h")
      return date.toLocaleTimeString([], { hour: "numeric", hour12: true });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const planColors: Record<string, string> = {
    free: "#6B7280",
    ray: "#3B82F6",
    beam: "#8B5CF6",
    pulse: "#F59E0B",
  };

  const pieData = overview?.subscriptions?.byPlan
    ? Object.entries(overview.subscriptions.byPlan)
        .filter(([_, value]) => (value as number) > 0)
        .map(([name, value]) => ({
          name,
          value: value as number,
          color: planColors[name] || "#6B7280",
        }))
    : [];

  const totalSubs = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Global system metrics and analytics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AdminStatsCard
          title="Total Users"
          value={overview?.users?.total?.toLocaleString() || "0"}
          change={overview?.users?.growth}
          icon={<Users size={20} />}
          subtitle={`${overview?.users?.newToday || 0} today`}
        />
        <AdminStatsCard
          title="Organizations"
          value={overview?.organizations?.total?.toLocaleString() || "0"}
          change={overview?.organizations?.growth}
          icon={<Building2 size={20} />}
        />
        <AdminStatsCard
          title="Security Requests"
          value={overview?.security?.totalRequests?.toLocaleString() || "0"}
          icon={<Network size={20} />}
          subtitle={`${overview?.security?.requestsToday || 0} today`}
        />
        <AdminStatsCard
          title="Threats Blocked"
          value={overview?.security?.threatsBlocked?.toLocaleString() || "0"}
          icon={<Activity size={20} />}
          subtitle={`${overview?.security?.activeConfigs || 0} active configs`}
        />
        <AdminStatsCard
          title="Monthly Revenue"
          value={`$${overview?.subscriptions?.mrr?.toLocaleString() || "0"}`}
          icon={<CreditCard size={20} />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Activity Chart */}
        <div className="lg:col-span-2 bg-white/2 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <Activity size={18} className="text-accent" />
                Security Activity
              </h3>
              <p className="text-sm text-gray-500">
                Firewall request activity over time
              </p>
            </div>
            <div className="flex bg-white/5 rounded-lg p-1">
              {["1h", "24h", "7d", "30d"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    period === p
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72">
            {loading || securityData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                Loading...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={securityData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorSecurity"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#FFA62B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FFA62B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="time"
                    tickFormatter={formatXAxis}
                    stroke="#666"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                  />
                  <YAxis
                    stroke="#666"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0A0A0A",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="security_events"
                    stroke="#FFA62B"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSecurity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-white/2 border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-medium text-white mb-2">
            Plan Distribution
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {totalSubs} organizations by plan
          </p>

          <div className="h-48">
            {pieData.length > 0 && totalSubs > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0A0A0A",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#fff" }}
                    labelStyle={{ color: "#9ca3af" }}
                    formatter={(value, name) => [value, String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No subscription data
              </div>
            )}
          </div>

          <div className="space-y-2 mt-4">
            {Object.entries(planColors).map(([plan, color]) => (
              <div
                key={plan}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-gray-400 capitalize">{plan}</span>
                </div>
                <span className="text-white font-medium">
                  {(overview?.subscriptions?.byPlan?.[plan] || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
