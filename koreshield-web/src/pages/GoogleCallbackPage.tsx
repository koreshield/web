import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../lib/auth';
import { ShieldCheck } from 'lucide-react';

export function GoogleCallbackPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const state = searchParams.get('state');

            if (!code || !state) {
                setError('Missing authorization code or state parameter.');
                setLoading(false);
                return;
            }

            try {
                await authService.handleGoogleCallback(code, state);
                navigate('/dashboard', { replace: true });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Authentication failed');
                setLoading(false);
            }
        };

        handleCallback();
    }, [searchParams, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <ShieldCheck className="w-12 h-12 text-electric-green mx-auto mb-4 animate-pulse" />
                    <h1 className="text-2xl font-bold text-foreground mb-2">Completing sign-in…</h1>
                    <p className="text-muted-foreground">Please wait while we authenticate your account.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="w-full max-w-md text-center">
                <ShieldCheck className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-foreground mb-2">Authentication Error</h1>
                <p className="text-muted-foreground mb-6">{error}</p>
                <a
                    href="/login"
                    className="inline-block px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
                >
                    Return to login
                </a>
            </div>
        </div>
    );
}
