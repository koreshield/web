
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { koreshieldApi, LogEntry } from "@/lib/api-client";
import { useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Info,
    ShieldAlert
} from "lucide-react";

export const Route = createFileRoute("/dashboard/logs")({
    component: AuditLogs,
});

function AuditLogs() {
    const [page, setPage] = useState(0);
    const limit = 20;

    const { data, isLoading } = useQuery({
        queryKey: ["audit-logs", page],
        queryFn: () => koreshieldApi.getLogs({ limit, offset: page * limit }),
        refetchInterval: 5000,
    });

    const logs = data?.logs || [];
    const total = data?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
                    <p className="text-gray-500">System events, security alerts, and request logs.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                        {total > 0 ? `${page * limit + 1}-${Math.min((page + 1) * limit, total)} of ${total}` : "No logs"}
                    </span>
                    <div className="flex">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="p-2 border border-r-0 border-gray-200 dark:border-gray-800 rounded-l-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={(page + 1) * limit >= total}
                            className="p-2 border border-gray-200 dark:border-gray-800 rounded-r-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-black/20 text-gray-500 font-medium border-b border-gray-200 dark:border-gray-800">
                        <tr>
                            <th className="px-6 py-4 w-32">Level</th>
                            <th className="px-6 py-4 w-48">Timestamp</th>
                            <th className="px-6 py-4 w-48">Event</th>
                            <th className="px-6 py-4">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {isLoading ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading logs...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No logs found.</td></tr>
                        ) : (
                            logs.map((log: LogEntry, i: number) => (
                                <LogRow key={log.request_id || i} log={log} />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function LogRow({ log }: { log: LogEntry }) {
    // Determine color based on level
    let badgeClass = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    let Icon = Info;

    const level = log.level?.toLowerCase() || "info";

    if (level === "warning") {
        badgeClass = "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
        Icon = AlertTriangle;
    } else if (level === "error" || level === "critical") {
        badgeClass = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
        Icon = ShieldAlert;
    }

    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${badgeClass}`}>
                    <Icon className="h-3 w-3" />
                    {log.level}
                </span>
            </td>
            <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                {new Date(log.timestamp).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                })}
            </td>
            <td className="px-6 py-4 font-medium">
                {log.event}
            </td>
            <td className="px-6 py-4">
                <div className="font-mono text-xs text-gray-500 overflow-hidden line-clamp-1 hover:line-clamp-none hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded cursor-default">
                    {JSON.stringify(omit(log, ["timestamp", "level", "event"]), null, 2)}
                </div>
            </td>
        </tr>
    )
}

function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const newObj = { ...obj };
    keys.forEach(key => delete newObj[key]);
    return newObj;
}
