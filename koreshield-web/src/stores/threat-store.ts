import { create } from 'zustand';
import type { ThreatEvent } from '../services/websocket';

interface ThreatStore {
    threats: ThreatEvent[];
    addThreat: (threat: ThreatEvent) => void;
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
