import { create } from 'zustand';
import type { WebSocketEvent, ThreatDetectedEvent } from '../lib/websocket-client';

interface ThreatStore {
    threats: WebSocketEvent<ThreatDetectedEvent>[];
    addThreat: (event: WebSocketEvent<ThreatDetectedEvent>) => void;
    clearThreats: () => void;
    maxThreats: number;
}

export const useThreatStore = create<ThreatStore>((set) => ({
    threats: [],
    maxThreats: 100,
    addThreat: (threat) =>
        set((state) => ({
            threats: [threat, ...state.threats].slice(0, state.maxThreats),
        })),
    clearThreats: () => set({ threats: [] }),
}));
