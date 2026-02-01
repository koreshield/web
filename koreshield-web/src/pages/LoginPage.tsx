import { SignIn } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { isClerkConfigured, useAuth } from '../lib/auth';

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isSignedIn } = useAuth();

    // Redirect if already signed in
    useEffect(() => {
        if (isSignedIn) {
            const from = (location.state as any)?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        }
    }, [isSignedIn, navigate, location]);

    // If Clerk is not configured, show setup message
    if (!isClerkConfigured()) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-card border border-border rounded-lg p-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Authentication Setup Required</h1>
                        <p className="text-muted-foreground mb-4">
                            To enable authentication, please configure Clerk by adding your publishable key to the environment variables.
                        </p>
                        <div className="bg-muted p-4 rounded-lg text-left">
                            <code className="text-sm">
                                VITE_CLERK_PUBLISHABLE_KEY=your_key_here
                            </code>
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                            Visit{' '}
                            <a
                                href="https://clerk.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                clerk.com
                            </a>
                            {' '}to get started.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Welcome to KoreShield</h1>
                    <p className="text-muted-foreground">Sign in to access your dashboard</p>
                </div>
                <SignIn
                    appearance={{
                        elements: {
                            rootBox: 'mx-auto',
                            card: 'bg-card border border-border shadow-lg'
                        }
                    }}
                />
            </div>
        </div>
    );
}
