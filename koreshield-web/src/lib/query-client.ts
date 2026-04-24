import { QueryClient } from '@tanstack/react-query';
import { setQueryClient } from './websocket-client';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30000, // 30 seconds
            gcTime: 300000, // 5 minutes
            retry: 3,
            refetchOnWindowFocus: true,
        },
        mutations: {
            retry: 1,
        },
    },
});

// Initialize WebSocket client with query client for cache invalidation
setQueryClient(queryClient);

export function clearAuthenticatedQueryCache() {
    queryClient.removeQueries({ queryKey: ['stats'] });
    queryClient.removeQueries({ queryKey: ['recent-attacks'] });
    queryClient.removeQueries({ queryKey: ['analytics'] });
    queryClient.removeQueries({ queryKey: ['cost-analytics'] });
    queryClient.removeQueries({ queryKey: ['cost-summary'] });
    queryClient.removeQueries({ queryKey: ['provider-health'] });
    queryClient.removeQueries({ queryKey: ['system-status'] });
    queryClient.removeQueries({ queryKey: ['reports'] });
    queryClient.removeQueries({ queryKey: ['teams'] });
    queryClient.removeQueries({ queryKey: ['api-keys'] });
    queryClient.removeQueries({ queryKey: ['alert-rules'] });
    queryClient.removeQueries({ queryKey: ['alert-channels'] });
    queryClient.removeQueries({ queryKey: ['policies'] });
}
