

import { createFileRoute, Outlet, Link, useNavigate, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import {
    LayoutDashboard,
    Settings,
    ShieldAlert,
    Activity,
    LogOut
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
    component: DashboardLayout,
    beforeLoad: async () => {
        const { data } = await authClient.getSession();
        if (!data) {
            throw redirect({
                to: "/login",
                search: {
                    redirect: location.href,
                },
            });
        }
    }
});

function DashboardLayout() {
    const navigate = useNavigate();
    const { data: session } = authClient.useSession();

    const handleLogout = async () => {
        await authClient.signOut();
        navigate({ to: "/login" });
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black/50 backdrop-blur-xl flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <ShieldAlert className="text-white h-5 w-5" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">KoreShield</span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <NavItem to="/dashboard" icon={LayoutDashboard} label="Overview" activeOptions={{ exact: true }} />
                    <NavItem to="/dashboard/config" icon={Settings} label="Configuration" />
                    <NavItem to="/dashboard/policies" icon={ShieldAlert} label="Policies" />
                    <NavItem to="/dashboard/logs" icon={Activity} label="Audit Logs" />
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <div onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                        <LogOut className="h-5 w-5 text-gray-500" />
                    </div>
                    {session?.user && (
                        <div className="px-4 py-2 text-xs text-gray-400 truncate">
                            Logged in as {session.user.name || session.user.email}
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black/20 flex items-center px-8">
                    <h1 className="text-lg font-medium">Dashboard</h1>
                </header>
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

function NavItem({ to, icon: Icon, label, activeOptions }: { to: string; icon: any; label: string, activeOptions?: any }) {
    return (
        <Link
            to={to}
            activeProps={{
                className: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
            }}
            activeOptions={activeOptions}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
        >
            <Icon className="h-5 w-5" />
            <span className="text-sm font-medium">{label}</span>
        </Link>
    );
}
