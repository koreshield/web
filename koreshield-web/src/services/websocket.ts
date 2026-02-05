type ThreatEvent = {
    id: string;
    timestamp: string;
    threat_type: string;
    confidence: number;
    content_preview: string;
    action_taken: 'blocked' | 'warned';
    user_id?: string;
    metadata?: Record<string, any>;
};

type WebSocketEventHandler = (event: ThreatEvent) => void;

class WebSocketService {
    private ws: WebSocket | null = null;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 3000;
    private eventHandlers: WebSocketEventHandler[] = [];
    private baseUrl: string;

    constructor() {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://koreshield-production.up.railway.app';
        this.baseUrl = apiUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    }

    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            this.ws = new WebSocket(`${this.baseUrl}/ws/threats`);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
            };

            this.ws.onmessage = (event) => {
                try {
                    const data: ThreatEvent = JSON.parse(event.data);
                    this.eventHandlers.forEach(handler => handler(data));
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            this.ws.onclose = () => {
                console.log('WebSocket closed');
                this.scheduleReconnect();
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.scheduleReconnect();
        }
    }

    private scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            console.log(`Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.connect();
        }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
    }

    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.reconnectAttempts = 0;
    }

    subscribe(handler: WebSocketEventHandler) {
        this.eventHandlers.push(handler);
        return () => {
            this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
        };
    }

    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
}

export const websocketService = new WebSocketService();
export type { ThreatEvent };
