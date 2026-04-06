import { create } from 'zustand';

export interface Asset {
  id: string;
  userId: string;
  symbol: string;
  amount: number;
  type: 'crypto' | 'stock' | 'forex';
  createdAt: any;
}

export interface Alert {
  id: string;
  userId: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  active: boolean;
  createdAt: any;
}

export interface MockUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
}

interface AppState {
  user: MockUser | null;
  assets: Asset[];
  alerts: Alert[];
  setUser: (user: MockUser | null) => void;
  setAssets: (assets: Asset[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  getTotalPortfolioValue: () => number;
}

// Mock prices for demonstration purposes
const MOCK_PRICES: Record<string, number> = {
  'BTC': 65000,
  'ETH': 3500,
  'AAPL': 175,
  'TSLA': 180,
  'EUR': 1.08,
};

export const useStore = create<AppState>()((set, get) => ({
  user: null,
  assets: [],
  alerts: [],
  setUser: (user) => set({ user }),
  setAssets: (assets) => set({ assets }),
  setAlerts: (alerts) => set({ alerts }),
  getTotalPortfolioValue: () => {
    const { assets } = get();
    return assets.reduce((total, asset) => {
      const price = MOCK_PRICES[asset.symbol.toUpperCase()] || 100; // Default mock price
      return total + (asset.amount * price);
    }, 0);
  },
}));
