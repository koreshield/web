import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api-client';

export function useHealth() {
    return useQuery({
        queryKey: ['health'],
        queryFn: () => api.getHealth(),
        refetchInterval: 30000, // 30 seconds
    });
}

export function useStats() {
    return useQuery({
        queryKey: ['stats'],
        queryFn: () => api.getStats(),
        refetchInterval: 5000, // 5 seconds
        retry: false, // Don't retry on 403/401
        retryOnMount: false,
    });
}

export function useProviderHealth() {
    return useQuery({
        queryKey: ['provider-health'],
        queryFn: () => api.getProviderHealth(),
        refetchInterval: 30000, // 30 seconds
    });
}

export function useRecentAttacks(limit = 10) {
    return useQuery({
        queryKey: ['recent-attacks', limit],
        queryFn: () => api.getRecentAttacks(limit),
        refetchInterval: 10000, // 10 seconds
        retry: false, // Don't retry on 403/401
        retryOnMount: false,
    });
}

export function useMetrics() {
    return useQuery({
        queryKey: ['metrics'],
        queryFn: () => api.getMetrics(),
        refetchInterval: 15000, // 15 seconds
    });
}
