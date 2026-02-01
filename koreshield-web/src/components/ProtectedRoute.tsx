import { Navigate, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, isClerkConfigured } from '../lib/auth';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const location = useLocation();

    // If Clerk is not configured, allow access (for development)
    if (!isClerkConfigured()) {
        return <>{children}</>;
    }

    return (
        <>
            <SignedIn>{children}</SignedIn>
            <SignedOut>
                <Navigate to="/login" state={{ from: location }} replace />
            </SignedOut>
        </>
    );
}
