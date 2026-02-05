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
