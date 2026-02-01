import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton, useUser, useAuth } from '@clerk/clerk-react';

// Re-export Clerk components for easy use
export {
    ClerkProvider,
    SignedIn,
    SignedOut,
    SignInButton,
    UserButton,
    useUser,
    useAuth
};

// Get publishable key from environment
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

// Check if Clerk is configured
export const isClerkConfigured = () => {
    return Boolean(CLERK_PUBLISHABLE_KEY && CLERK_PUBLISHABLE_KEY !== 'your_clerk_publishable_key');
};
