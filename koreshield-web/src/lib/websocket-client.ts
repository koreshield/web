/**
 * WebSocket Client for Real-Time Event Streaming
 * 
 * Manages WebSocket connections with automatic reconnection,
 * event routing, and React Query cache invalidation.
 */

import { authService } from './auth';

// Get queryClient from the singleton - will be initialized in App.tsx
let queryClient: any = null;
export function setQueryClient(client: any) {
    queryClient = client;
}

// WebSocket URL configuration
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 
    (import.meta.env.VITE_API_BASE_URL?.replace('http', 'ws') || 'ws://localhost:8000');

export type EventType =
    | 'threat_detected'
    | 'provider_health_change'
    | 'cost_threshold_alert'
    | 'system_status_update'
    | 'connection_established'
    | 'subscription_updated'
    | 'pong'
    | 'error';

export interface WebSocketEvent<T = any> {
    type: EventType;
    timestamp: string;
    data: T;
}

export interface ThreatDetectedEvent {
    threat_id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    attack_type: string;
    tenant_id?: string;
    provider?: string;
    blocked: boolean;
}

export interface ProviderHealthEvent {
    provider: string;
    status: 'healthy' | 'degraded' | 'down';
    latency_ms: number;
    error?: string;
}

export interface CostThresholdEvent {
    tenant_id: string;
    current_cost: number;
    threshold: number;
    period: string;
}

type EventHandler<T = any> = (event: WebSocketEvent<T>) => void;

class WebSocketClient {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private reconnectDelay = 1000; // Start with 1 second
    private maxReconnectDelay = 30000; // Max 30 seconds
    private reconnectTimer: number | null = null;
    private heartbeatTimer: number | null = null;
    private heartbeatInterval = 30000; // 30 seconds
    private isIntentionalDisconnect = false;
    private eventHandlers: Map<EventType, Set<EventHandler>> = new Map();
    private subscriptions: Set<EventType> = new Set();

    /**
     * Connect to the WebSocket server
     */
    connect() {
        // Don't connect if user is not authenticated
        const token = authService.getToken();
        if (!token) {
            console.warn('[WebSocket] No auth token available. Skipping connection.');
            return;
        }

        // Clear any existing connection
        this.disconnect();

        try {
            const wsUrl = `${WS_BASE_URL}/ws/events?token=${token}`;
            console.log(`[WebSocket] Connecting to ${wsUrl.replace(token, '***')}`);

            this.ws = new WebSocket(wsUrl);
            this.isIntentionalDisconnect = false;

            this.ws.onopen = () => this.handleOpen();
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onerror = (error) => this.handleError(error);
            this.ws.onclose = (event) => this.handleClose(event);
        } catch (error) {
            console.error('[WebSocket] Connection error:', error);
            this.scheduleReconnect();
        }
    }

    /**
     * Disconnect from the WebSocket server
     */
    disconnect() {
        this.isIntentionalDisconnect = true;
        this.stopHeartbeat();
        this.cancelReconnect();

        if (this.ws) {
            // Remove event listeners to prevent reconnection
            this.ws.onclose = null;
            this.ws.onerror = null;
            
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.close(1000, 'Client disconnect');
            }
            this.ws = null;
        }

        console.log('[WebSocket] Disconnected');
    }

    /**
     * Subscribe to specific event types
     */
    subscribe(eventTypes: EventType[]) {
        eventTypes.forEach(type => this.subscriptions.add(type));

        if (this.isConnected()) {
            this.send({
                action: 'subscribe',
                event_types: Array.from(this.subscriptions)
            });
        }
    }

    /**
     * Add event handler for specific event type
     */
    on<T = any>(eventType: EventType, handler: EventHandler<T>) {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, new Set());
        }
        this.eventHandlers.get(eventType)!.add(handler as EventHandler);

        // Return cleanup function
        return () => {
            const handlers = this.eventHandlers.get(eventType);
            if (handlers) {
                handlers.delete(handler as EventHandler);
            }
        };
    }

    /**
     * Check if WebSocket is connected
     */
    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    /**
     * Send data through WebSocket
     */
    private send(data: any) {
        if (this.isConnected()) {
            this.ws!.send(JSON.stringify(data));
        } else {
            console.warn('[WebSocket] Cannot send - not connected');
        }
    }

    /**
     * Handle WebSocket connection open
     */
    private handleOpen() {
        console.log('[WebSocket] Connected successfully');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.startHeartbeat();

        // Re-subscribe to events if we had subscriptions
        if (this.subscriptions.size > 0) {
            this.send({
                action: 'subscribe',
                event_types: Array.from(this.subscriptions)
            });
        }
    }

    /**
     * Handle incoming WebSocket messages
     */
    private handleMessage(event: MessageEvent) {
        try {
            const message: WebSocketEvent = JSON.parse(event.data);
            console.log('[WebSocket] Message received:', message.type);

            // Route event to handlers
            this.routeEvent(message);

            // Invalidate React Query caches based on event type
            this.invalidateCaches(message);
        } catch (error) {
            console.error('[WebSocket] Message parse error:', error);
        }
    }

    /**
     * Route event to registered handlers
     */
    private routeEvent(event: WebSocketEvent) {
        const handlers = this.eventHandlers.get(event.type);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(event);
                } catch (error) {
                    console.error(`[WebSocket] Handler error for ${event.type}:`, error);
                }
            });
        }
    }

    /**
     * Invalidate React Query caches based on event type
     */
    private invalidateCaches(event: WebSocketEvent) {
        if (!queryClient) {
            console.warn('[WebSocket] Query client not initialized');
            return;
        }

        switch (event.type) {
            case 'threat_detected':
                queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
                queryClient.invalidateQueries({ queryKey: ['analytics'] });
                break;

            case 'provider_health_change':
                queryClient.invalidateQueries({ queryKey: ['provider-health'] });
                queryClient.invalidateQueries({ queryKey: ['system-status'] });
                break;

            case 'cost_threshold_alert':
                queryClient.invalidateQueries({ queryKey: ['cost-analytics'] });
                queryClient.invalidateQueries({ queryKey: ['cost-summary'] });
                break;

            case 'system_status_update':
                queryClient.invalidateQueries({ queryKey: ['system-status'] });
                break;
        }
    }

    /**
     * Handle WebSocket errors
     */
    private handleError(error: Event) {
        // Only log in development if it's not a connection refused error
        const isDev = import.meta.env.VITE_ENV !== 'production';
        if (isDev && this.reconnectAttempts === 0) {
            console.log('[WebSocket] Connection failed (backend may not be running)');
        } else if (!isDev) {
            console.error('[WebSocket] Error:', error);
        }
    }

    /**
     * Handle WebSocket close
     */
    private handleClose(event: CloseEvent) {
        const isDev = import.meta.env.VITE_ENV !== 'production';
        
        // Reduce log spam in development
        if (event.code === 1006) {
            if (isDev && this.reconnectAttempts === 0) {
                console.log('[WebSocket] Connection closed (backend not reachable)');
            }
        } else {
            console.log(`[WebSocket] Connection closed (code: ${event.code}, reason: ${event.reason})`);
        }
        
        this.stopHeartbeat();

        // Only reconnect if it wasn't an intentional disconnect
        if (!this.isIntentionalDisconnect) {
            this.scheduleReconnect();
        }
    }

    /**
     * Schedule reconnection with exponential backoff
     */
    private scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            const isDev = import.meta.env.VITE_ENV !== 'production';
            if (isDev) {
                console.log('[WebSocket] Stopped trying to connect. Start the backend to enable real-time updates.');
            } else {
                console.error('[WebSocket] Max reconnection attempts reached. Giving up.');
            }
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(
            this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
            this.maxReconnectDelay
        );

        const isDev = import.meta.env.VITE_ENV !== 'production';
        if (!isDev || this.reconnectAttempts <= 3) {
            console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        }

        this.reconnectTimer = setTimeout(() => {
            if (!isDev || this.reconnectAttempts <= 3) {
                console.log('[WebSocket] Attempting to reconnect...');
            }
            this.connect();
        }, delay);
    }

    /**
     * Cancel pending reconnection
     */
    private cancelReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    /**
     * Start heartbeat ping/pong
     */
    private startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected()) {
                this.send({ action: 'ping' });
            }
        }, this.heartbeatInterval);
    }

    /**
     * Stop heartbeat
     */
    private stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
}

// Export singleton instance
export const wsClient = new WebSocketClient();

// Auto-connect when auth token is available
if (authService.getToken()) {
    wsClient.connect();
}

// Reconnect when user logs in
authService.on('login', () => {
    wsClient.connect();
});

// Disconnect when user logs out
authService.on('logout', () => {
    wsClient.disconnect();
});
