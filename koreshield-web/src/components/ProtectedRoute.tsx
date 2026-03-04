import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../lib/auth';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const location = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        let isMounted = true;
        const checkAuth = async () => {
            const ok = await authService.restoreSession();
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
        return null;
    }

    if (!isAuthenticated) {
        // Redirect to login, save the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
