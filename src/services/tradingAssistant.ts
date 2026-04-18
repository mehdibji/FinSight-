import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export type MarketItem = { name: string; symbol: string; price: number; change: number | null };
export type MarketOverview = {
  updatedAt: string;
  crypto: {
    BTCUSDT: { price: number; change: number } | null;
    ETHUSDT: { price: number; change: number } | null;
  };
  stocks: MarketItem[];
  etfs: MarketItem[];
  commodities: MarketItem[];
  fx: MarketItem[];
};
export type KlineCandle = {
  t: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export async function getMarketOverview() {
  const res = await fetch('/api/market/overview', { cache: 'no-store' });
  if (!res.ok) throw new Error('Market overview fetch failed');
  return (await res.json()) as MarketOverview;
}

export async function getKlines(symbol: string, interval: string, limit = 120) {
  const res = await fetch(`/api/binance/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Klines fetch failed');
  return (await res.json()) as { symbol: string; interval: string; candles: KlineCandle[] };
}

export async function getDepth(symbol: string, limit = 20) {
  const res = await fetch(`/api/binance/depth?symbol=${encodeURIComponent(symbol)}&limit=${limit}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Depth fetch failed');
  return (await res.json()) as {
    symbol: string;
    bids: Array<{ price: number; quantity: number }>;
    asks: Array<{ price: number; quantity: number }>;
  };
}

export async function getRecentTrades(symbol: string, limit = 20) {
  const res = await fetch(`/api/binance/trades?symbol=${encodeURIComponent(symbol)}&limit=${limit}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Trades fetch failed');
  return (await res.json()) as {
    symbol: string;
    trades: Array<{ id: string; price: number; quantity: number; side: "buy" | "sell"; time: number }>;
  };
}

// Attempt to fetch user's portfolio from Firestore: doc users/{uid}
export async function getUserPortfolio(uid?: string) {
  if (!uid) return null;
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
      const data = snap.data() as { portfolio?: unknown; assets?: unknown };
      return data.portfolio ?? data.assets ?? null;
  } catch (e) {
    console.warn('Failed to fetch user portfolio', e);
    return null;
  }
}
