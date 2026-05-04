import { Link, Navigate, useLocation } from 'react-router-dom';
import { authService } from '../lib/auth';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: 'admin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const location = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        let isMounted = true;
        const checkAuth = async () => {
            // Always validate with backend on route check - don't use cache
            const ok = await authService.restoreSession(true);
            if (isMounted) {
                setIsAuthenticated(ok);
            }
        };
        void checkAuth();
        return () => {
            isMounted = false;
        };
    }, []);

    if (isAuthenticated === null) {
        return (
            <div className="min-h-[40vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login, save the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const currentUser = authService.getCurrentUser();
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner' || currentUser?.role === 'superuser';

    if (requiredRole === 'admin' && !isAdmin) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
                    <h1 className="text-2xl font-bold text-foreground">Admin access required</h1>
                    <p className="mt-3 text-sm text-muted-foreground">
                        This page is reserved for workspace admins. Most customer onboarding happens through API keys, teams, rules, alerts, audit logs, and the getting-started flow.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            to="/getting-started"
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            Open getting started
                        </Link>
                        <Link
                            to="/dashboard"
                            className="rounded-lg bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/80"
                        >
                            Back to dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
